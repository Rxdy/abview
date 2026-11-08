import fs from 'node:fs'
import path from 'node:path'

/**
 * Configurations de l'écran (la disposition des modules) : plusieurs, nommées (les « favorites »),
 * dont une seule est active. Le kiosque lit l'active ; l'éditeur écrit.
 *
 * Le serveur ne vérifie que la FORME des données (types, tailles raisonnables). Le sens (module
 * connu, variante, chevauchement) est vérifié par le client, qui garde la disposition standard si une
 * configuration est refusée : le serveur ne duplique pas le registre des modules.
 */
export interface Placement {
  id: string
  module: string
  variante?: string
  x: number
  y: number
  reglages?: Record<string, unknown>
}

export interface Configuration {
  nom: string
  placements: Placement[]
}

interface Fichier {
  actif: string | null
  configurations: Record<string, Configuration>
}

const ID = /^[a-z0-9][a-z0-9-]{0,39}$/

export function idValide(id: string): boolean {
  return ID.test(id)
}

/** Les problèmes de forme d'une configuration ; liste vide si elle est acceptable. */
export function verifierForme(candidate: unknown): string[] {
  const c = candidate as Configuration
  if (!c || typeof c !== 'object') return ['configuration absente']
  const erreurs: string[] = []
  if (typeof c.nom !== 'string' || !c.nom.trim() || c.nom.length > 80) {
    erreurs.push('nom : texte de 1 à 80 caractères attendu')
  }
  if (!Array.isArray(c.placements) || c.placements.length > 50) {
    erreurs.push('placements : liste de 50 éléments au plus attendue')
    return erreurs
  }
  c.placements.forEach((p, i) => {
    const o = `placements[${i}]`
    if (!p || typeof p !== 'object') return erreurs.push(`${o} : objet attendu`)
    if (typeof p.id !== 'string' || !p.id || p.id.length > 40)
      erreurs.push(`${o}.id : texte attendu`)
    if (typeof p.module !== 'string' || !p.module) erreurs.push(`${o}.module : texte attendu`)
    if (p.variante !== undefined && typeof p.variante !== 'string')
      erreurs.push(`${o}.variante : texte attendu`)
    if (!Number.isInteger(p.x) || !Number.isInteger(p.y))
      erreurs.push(`${o} : x et y entiers attendus`)
    if (
      p.reglages !== undefined &&
      (typeof p.reglages !== 'object' || p.reglages === null || Array.isArray(p.reglages))
    ) {
      erreurs.push(`${o}.reglages : objet attendu`)
    }
  })
  return erreurs
}

export default class ConfigurationsService {
  private get dossier() {
    return process.env.DONNEES_DIR || path.join(process.cwd(), 'donnees')
  }

  private get fichier() {
    return path.join(this.dossier, 'configurations.json')
  }

  lire(): Fichier {
    try {
      const brut = JSON.parse(fs.readFileSync(this.fichier, 'utf-8'))
      return { actif: brut.actif ?? null, configurations: brut.configurations ?? {} }
    } catch {
      // Fichier absent ou illisible : aucune configuration, le kiosque garde sa disposition standard
      return { actif: null, configurations: {} }
    }
  }

  private ecrire(donnees: Fichier) {
    fs.mkdirSync(this.dossier, { recursive: true })
    if (fs.existsSync(this.fichier)) {
      // Une seule version précédente est gardée, pour revenir en arrière après une fausse manœuvre
      fs.copyFileSync(this.fichier, path.join(this.dossier, 'configurations.precedent.json'))
    }
    const temporaire = `${this.fichier}.tmp`
    fs.writeFileSync(temporaire, JSON.stringify(donnees, null, 2))
    fs.renameSync(temporaire, this.fichier) // jamais de fichier à moitié écrit
  }

  liste() {
    const f = this.lire()
    return {
      actif: f.actif,
      configurations: Object.entries(f.configurations).map(([id, c]) => ({ id, nom: c.nom })),
    }
  }

  obtenir(id: string): Configuration | null {
    return this.lire().configurations[id] ?? null
  }

  /** La configuration active, ou null (disposition standard du kiosque). */
  active(): { id: string; configuration: Configuration } | null {
    const f = this.lire()
    const config = f.actif ? f.configurations[f.actif] : undefined
    return config ? { id: f.actif as string, configuration: config } : null
  }

  enregistrer(id: string, config: Configuration) {
    const f = this.lire()
    f.configurations[id] = { nom: config.nom.trim(), placements: config.placements }
    this.ecrire(f)
  }

  /** Refuse de supprimer la configuration active : on en active une autre d'abord. */
  supprimer(id: string): 'ok' | 'absente' | 'active' {
    const f = this.lire()
    if (!f.configurations[id]) return 'absente'
    if (f.actif === id) return 'active'
    delete f.configurations[id]
    this.ecrire(f)
    return 'ok'
  }

  /** id = null : retour à la disposition standard. */
  activer(id: string | null): boolean {
    const f = this.lire()
    if (id !== null && !f.configurations[id]) return false
    f.actif = id
    this.ecrire(f)
    return true
  }
}
