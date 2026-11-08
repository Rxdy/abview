/**
 * Modifications d'une configuration pour l'éditeur. Fonctions pures : elles rendent une nouvelle
 * configuration, ou null quand la modification serait invalide (hors grille, chevauchement…).
 */
import { dansLaGrille, GRILLE, seChevauchent } from './grille'
import { rectangle, validerPlacement, type Configuration, type Placement } from './configuration'
import { REGISTRE, variante } from './registre'

const avec = (config: Configuration, placements: Placement[]): Configuration => ({ ...config, placements })

/** Un identifiant qui n'existe pas encore : « meteo », puis « meteo-2 », « meteo-3 »… */
export function identifiantLibre(config: Configuration, module: string): string {
  const pris = new Set(config.placements.map((p) => p.id))
  if (!pris.has(module)) return module
  let n = 2
  while (pris.has(`${module}-${n}`)) n++
  return `${module}-${n}`
}

/** Pourquoi un module ne peut pas être ajouté : trop d'exemplaires déjà, ou plus de place. */
export function obstacle(config: Configuration, module: string): 'max' | 'place' | null {
  const def = REGISTRE[module]
  if (!def) return 'place'
  if (def.max !== undefined && config.placements.filter((p) => p.module === module).length >= def.max) return 'max'
  return positionLibre(config, module) ? null : 'place'
}

/** La première case libre (de haut en bas, de gauche à droite) où le module tient ; null s'il n'y en a pas. */
export function positionLibre(config: Configuration, module: string): { x: number; y: number } | null {
  const v = variante(REGISTRE, module)
  if (!v) return null
  for (let y = 1; y <= GRILLE.lignes; y++) {
    for (let x = 1; x <= GRILLE.colonnes; x++) {
      const essai = avec(config, [...config.placements, { id: '_essai', module, x, y }])
      if (validerPlacement(essai).length === 0) return { x, y }
    }
  }
  return null
}

export function ajouter(config: Configuration, module: string): Configuration | null {
  if (obstacle(config, module)) return null
  const place = positionLibre(config, module)
  if (!place) return null
  return avec(config, [...config.placements, { id: identifiantLibre(config, module), module, ...place }])
}

/** Pose un module à une case donnée (sa case de départ) ; null si ça ne tient pas là. */
export function ajouterA(config: Configuration, module: string, x: number, y: number): Configuration | null {
  if (!variante(REGISTRE, module) || obstacle(config, module) === 'max') return null
  const suivante = avec(config, [...config.placements, { id: identifiantLibre(config, module), module, x, y }])
  return validerPlacement(suivante).length === 0 ? suivante : null
}

export function retirer(config: Configuration, id: string): Configuration {
  return avec(config, config.placements.filter((p) => p.id !== id))
}

function modifier(config: Configuration, id: string, changement: Partial<Placement>): Configuration | null {
  const suivante = avec(config, config.placements.map((p) => (p.id === id ? { ...p, ...changement } : p)))
  return validerPlacement(suivante).length === 0 ? suivante : null
}

export function deplacer(config: Configuration, id: string, x: number, y: number): Configuration | null {
  return modifier(config, id, { x, y })
}

export function changerVariante(config: Configuration, id: string, nouvelle: string): Configuration | null {
  return modifier(config, id, { variante: nouvelle })
}

/**
 * Change un réglage d'un module. Une liste vide efface le réglage. Rend toujours une configuration : si le
 * résultat est invalide (deux exemplaires identiques…), l'éditeur le montre et refuse seulement d'enregistrer.
 */
export function definirReglage(config: Configuration, id: string, cle: string, valeur: string[]): Configuration {
  return avec(
    config,
    config.placements.map((p) => {
      if (p.id !== id) return p
      const { [cle]: _ancien, ...autres } = p.reglages ?? {}
      const reglages = valeur.length ? { ...autres, [cle]: valeur } : autres
      const { reglages: _r, ...sans } = p
      return Object.keys(reglages).length ? { ...sans, reglages } : sans
    })
  )
}

/** Un module qui a dû faire de la place : où il est allé, et s'il a dû rétrécir. */
export interface Deplacement {
  id: string
  module: string
  /** Nouvelle variante, quand le module a dû rétrécir pour tenir. */
  reduitEn?: string
}

/**
 * Cherche une place pour un module parmi des placements fixes : d'abord à l'endroit préféré, puis à la première
 * case libre ; sa taille actuelle d'abord, puis des tailles plus petites (de la plus grande à la plus petite).
 */
function trouverPlace(fixes: Placement[], p: Placement, prefere?: { x: number; y: number }): Placement | null {
  const def = REGISTRE[p.module]
  const actuelle = variante(REGISTRE, p.module, p.variante)
  if (!def || !actuelle) return null
  const aire = (v: { largeur: number; hauteur: number }) => v.largeur * v.hauteur
  const tailles = [
    actuelle,
    ...def.variantes.filter((v) => v.id !== actuelle.id && aire(v) < aire(actuelle)).sort((a, b) => aire(b) - aire(a)),
  ]
  const positions: { x: number; y: number }[] = prefere ? [prefere] : []
  for (let y = 1; y <= GRILLE.lignes; y++) for (let x = 1; x <= GRILLE.colonnes; x++) positions.push({ x, y })
  for (const v of tailles) {
    for (const pos of positions) {
      const essai: Placement = { ...p, variante: v.id, ...pos }
      if (validerPlacement({ nom: '', placements: [...fixes, essai] }).length === 0) return essai
    }
  }
  return null
}

/**
 * Pose un module (existant ou nouveau) à une case donnée en faisant de la place : les modules qui le gênent
 * vont ailleurs, là où il y a de la place (de préférence à l'ancienne place du module déplacé, ce qui donne
 * un échange), et rétrécissent si nécessaire. Rend null si le module sort de la grille ou si un des modules
 * gênés ne trouve vraiment aucune place : la disposition reste alors telle quelle.
 */
export function poserEnPoussant(
  config: Configuration,
  candidat: Placement
): { config: Configuration; deplaces: Deplacement[] } | null {
  const rc = rectangle(candidat)
  if (!rc || !dansLaGrille(rc)) return null
  const ancien = config.placements.find((p) => p.id === candidat.id)
  const autres = config.placements.filter((p) => p.id !== candidat.id)
  const gênés = autres.filter((o) => {
    const ro = rectangle(o)
    return ro && seChevauchent(ro, rc)
  })
  const fixes = [...autres.filter((o) => !gênés.includes(o)), candidat]
  const nouveaux = new Map<string, Placement>([[candidat.id, candidat]])
  const deplaces: Deplacement[] = []
  for (const o of gênés) {
    const place = trouverPlace(fixes, o, ancien ? { x: ancien.x, y: ancien.y } : undefined)
    if (!place) return null
    fixes.push(place)
    nouveaux.set(o.id, place)
    deplaces.push({
      id: o.id,
      module: o.module,
      ...(place.variante !== (o.variante ?? REGISTRE[o.module]?.variantes[0]?.id) ? { reduitEn: place.variante } : {}),
    })
  }
  const placements = autres.map((o) => nouveaux.get(o.id) ?? o)
  if (ancien) placements.splice(config.placements.indexOf(ancien), 0, candidat)
  else placements.push(candidat)
  return { config: avec(config, placements), deplaces }
}

/** Déplace un module à une case en faisant de la place aux autres (voir poserEnPoussant). */
export function deplacerEnPoussant(config: Configuration, id: string, x: number, y: number) {
  const p = config.placements.find((q) => q.id === id)
  return p ? poserEnPoussant(config, { ...p, x, y }) : null
}

/** Ajoute un module à une case en faisant de la place (voir poserEnPoussant) ; null au-delà du maximum du module. */
export function ajouterEnPoussant(config: Configuration, module: string, x: number, y: number) {
  if (!variante(REGISTRE, module) || obstacle(config, module) === 'max') return null
  return poserEnPoussant(config, { id: identifiantLibre(config, module), module, x, y })
}

/** Le rectangle d'un placement de la configuration (pour l'affichage). */
export function rectangleDe(config: Configuration, id: string) {
  const p = config.placements.find((x) => x.id === id)
  return p ? rectangle(p) : undefined
}

/** « Semaine d'école » → « semaine-d-ecole » : l'identifiant d'une configuration vient de son nom. */
export function identifiantDepuisNom(nom: string): string {
  const id = nom
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '')
  return id || 'configuration'
}
