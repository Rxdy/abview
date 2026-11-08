/**
 * Dispositions du module Photos. Comme un mur de cadres accrochés à la main : les emplacements n'ont pas tous
 * la même taille, ne sont pas alignés (l'un plus haut que l'autre) et penchent très légèrement. Positions et
 * tailles sont en % du module. Une photo en paysage ne va jamais dans un emplacement en portrait : chaque
 * emplacement demande sa propre orientation à abflow.
 */
import type { Orientation } from '../utils/photosDemo'

/**
 * Le style du cadre : « or » (doré, mouluré), « noir » (fin, avec filet doré), « bois » (noyer), puis des formes
 * de fantaisie : « ovale » (doré) et « arche » (doré, cintré en haut).
 */
export type StyleCadre = 'or' | 'noir' | 'bois' | 'ovale' | 'arche'

export interface Emplacement {
  x: number
  y: number
  largeur: number
  hauteur: number
  orientation: Orientation
  cadre: StyleCadre
  /** Inclinaison en degrés (très légère : un cadre accroché à la main n'est jamais parfaitement droit). */
  inclinaison?: number
}

export interface Disposition {
  emplacements: Emplacement[]
}

const e = (
  x: number,
  y: number,
  largeur: number,
  hauteur: number,
  orientation: Orientation,
  cadre: StyleCadre,
  inclinaison?: number
): Emplacement => ({ x, y, largeur, hauteur, orientation, cadre, ...(inclinaison ? { inclinaison } : {}) })

/**
 * Photo permanente (module posé sur le tableau de bord, en mode normal) : UNE seule photo, en paysage ou en portrait.
 * Le mur de cadres est celui du mode veille (voir plus bas).
 */
export const PERMANENT = ['un', 'portrait'] as const

/** Dispositions du mode veille : la page entière devient un mur de cadres. Il n'y en a qu'une : cinq photos. */
export const VEILLE = ['cinq'] as const

export const DISPOSITIONS: Record<string, Disposition> = {
  // une photo en paysage (4 × 3 cases) — cadre doré mouluré
  un: { emplacements: [e(5, 7, 90, 86, 'paysage', 'or')] },
  // une photo en portrait (3 × 5) — cadre en arche dorée
  portrait: { emplacements: [e(8, 5, 84, 90, 'portrait', 'arche')] },

  /*
   * Mode veille, positions en % de l'écran entier (16:9) : cinq cadres de formes et de tailles différentes,
   * à des hauteurs différentes. La plupart des photos étant en portrait, quatre emplacements sont en portrait
   * (dont une arche et un ovale) et un seul en paysage.
   */
  cinq: {
    emplacements: [
      e(2, 10, 19, 60, 'portrait', 'arche', -0.8),
      e(27, 6, 22, 78, 'portrait', 'noir', 0.7),
      e(50, 7, 30, 44, 'paysage', 'or', -0.6),
      e(54, 54, 13, 40, 'portrait', 'ovale', 1.1),
      e(82, 8, 16, 60, 'portrait', 'bois', -1),
    ],
  },
}

export const DISPOSITION_PAR_DEFAUT = 'un'

/** Tous les emplacements changent de photo en même temps, toutes les 30 secondes. */
export const DUREE_CHANGEMENT = 30_000
