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
  /** Une applique de tableau (lampe en laiton) au-dessus du cadre, qui éclaire le mur. */
  lampe?: boolean
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
  inclinaison?: number,
  lampe?: boolean
): Emplacement => ({
  x, y, largeur, hauteur, orientation, cadre,
  ...(inclinaison ? { inclinaison } : {}),
  ...(lampe ? { lampe } : {}),
})

/**
 * Emplacement dont la hauteur découle de la largeur, pour un écran 16:9 pris en entier (le mode veille) : une
 * photo 2:3 en portrait, 3:2 en paysage. On ne règle ainsi que la largeur de chaque cadre.
 */
const RATIO_HAUTEUR: Record<Orientation, number> = { portrait: (3 / 2) * (16 / 9), paysage: (2 / 3) * (16 / 9), carre: 16 / 9 }
const p = (
  x: number,
  y: number,
  largeur: number,
  orientation: Orientation,
  cadre: StyleCadre,
  inclinaison?: number,
  lampe?: boolean
): Emplacement =>
  e(x, y, largeur, Math.round(largeur * RATIO_HAUTEUR[orientation] * 10) / 10, orientation, cadre, inclinaison, lampe)

/**
 * Photo permanente (module posé sur le tableau de bord, en mode normal) : UNE seule photo, en paysage ou en portrait.
 * Le mur de cadres est celui du mode veille (voir plus bas).
 */
export const PERMANENT = ['un', 'portrait'] as const

/** Dispositions du mode veille : la page entière devient un mur de cadres. Il n'y en a qu'une : cinq photos. */
export const VEILLE = ['cinq'] as const
/** Toutes les dispositions du mode veille, pour l'aperçu (/apercu-veille?disposition=galerie). */
export const DISPOSITIONS_VEILLE = ['cinq', 'galerie'] as const

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

  /*
   * Mode veille, mur de galerie : dix-sept cadres de formes et de tailles variées, accrochés serrés comme dans un
   * salon, pour couvrir tout l'écran. Dix portraits et sept paysages, avec des appliques en laiton au-dessus des grands cadres.
   */
  galerie: {
    emplacements: [
      p(2, 5, 12, 'portrait', 'arche', -0.6),
      p(3.5, 43, 9, 'portrait', 'ovale', 0.8),
      p(2.5, 74, 12, 'paysage', 'bois', -0.5),
      p(17, 7, 15, 'portrait', 'noir', 0.6),
      p(17.5, 53, 17, 'paysage', 'or', -0.5, true),
      p(19, 78, 13, 'paysage', 'noir', 0.5),
      p(36, 5, 11, 'portrait', 'bois', -0.8),
      p(50, 6, 13, 'portrait', 'ovale', 0.7),
      p(36, 45, 25, 'paysage', 'or', 0.4, true),
      p(36.5, 79, 12, 'paysage', 'bois', -0.4),
      p(52, 75, 8, 'portrait', 'ovale', 0.6),
      p(66, 6, 15, 'portrait', 'arche', 0.7),
      p(66, 52, 12, 'portrait', 'noir', -0.6, true),
      p(67, 85, 10, 'paysage', 'or', 0.5),
      p(85, 8, 13, 'portrait', 'or', -0.7),
      p(84.5, 48, 12, 'portrait', 'bois', 0.6),
      p(86, 82, 9, 'paysage', 'noir', -0.5),
    ],
  },
}

export const DISPOSITION_PAR_DEFAUT = 'un'

/** Tous les emplacements changent de photo en même temps, toutes les 30 secondes. */
export const DUREE_CHANGEMENT = 30_000
