/**
 * Modifications d'une configuration pour l'éditeur. Fonctions pures : elles rendent une nouvelle
 * configuration, ou null quand la modification serait invalide (hors grille, chevauchement…).
 */
import { GRILLE } from './grille'
import { rectangle, valider, type Configuration, type Placement } from './configuration'
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

/** La première case libre (de haut en bas, de gauche à droite) où le module tient ; null s'il n'y en a pas. */
export function positionLibre(config: Configuration, module: string): { x: number; y: number } | null {
  const v = variante(REGISTRE, module)
  if (!v) return null
  for (let y = 1; y <= GRILLE.lignes; y++) {
    for (let x = 1; x <= GRILLE.colonnes; x++) {
      const essai = avec(config, [...config.placements, { id: '_essai', module, x, y }])
      if (valider(essai).length === 0) return { x, y }
    }
  }
  return null
}

export function ajouter(config: Configuration, module: string): Configuration | null {
  const place = positionLibre(config, module)
  if (!place) return null
  return avec(config, [...config.placements, { id: identifiantLibre(config, module), module, ...place }])
}

export function retirer(config: Configuration, id: string): Configuration {
  return avec(config, config.placements.filter((p) => p.id !== id))
}

function modifier(config: Configuration, id: string, changement: Partial<Placement>): Configuration | null {
  const suivante = avec(config, config.placements.map((p) => (p.id === id ? { ...p, ...changement } : p)))
  return valider(suivante).length === 0 ? suivante : null
}

export function deplacer(config: Configuration, id: string, x: number, y: number): Configuration | null {
  return modifier(config, id, { x, y })
}

export function changerVariante(config: Configuration, id: string, nouvelle: string): Configuration | null {
  return modifier(config, id, { variante: nouvelle })
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
