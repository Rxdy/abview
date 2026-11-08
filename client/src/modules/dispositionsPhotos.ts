/**
 * Dispositions du module Photos. Comme un mur de cadres accrochés à la main : les emplacements n'ont pas tous
 * la même taille, ne sont pas alignés (l'un plus haut que l'autre) et penchent très légèrement. Positions et
 * tailles sont en % du module. Une photo en paysage ne va jamais dans un emplacement en portrait : chaque
 * emplacement demande sa propre orientation à abflow.
 */
import type { Orientation } from '../utils/photosDemo'

/**
 * Le style du cadre : « or » (doré, mouluré), « noir » (fin, avec filet doré), « bois » (noyer), puis des formes
 * de fantaisie : « ovale » et « rond » (dorés), « arche » (doré, cintré en haut).
 */
export type StyleCadre = 'or' | 'noir' | 'bois' | 'ovale' | 'rond' | 'arche'

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
 * Les autres dispositions sont celles du mode veille (voir plus bas).
 */
export const PERMANENT = ['un', 'portrait'] as const

/** Dispositions du mode veille : la page entière devient un mur de cadres (2 à 5 photos). */
export const VEILLE = ['deux', 'trois', 'quatre', 'cinq'] as const

export const DISPOSITIONS: Record<string, Disposition> = {
  // une photo en paysage (4 × 3 cases) — cadre doré mouluré
  un: { emplacements: [e(5, 7, 90, 86, 'paysage', 'or')] },
  // une photo en portrait (3 × 5) — cadre en arche dorée
  portrait: { emplacements: [e(8, 5, 84, 90, 'portrait', 'arche')] },

  // ----- Mode veille : positions en % de l'écran entier (16:9) -----
  // deux grands cadres : un paysage et un portrait ovale
  deux: { emplacements: [e(4, 8, 60, 80, 'paysage', 'or', -0.7), e(68, 12, 28, 68, 'portrait', 'ovale', 1)] },
  // un grand paysage, un portrait ovale plus haut, un portrait en bois plus bas
  trois: {
    emplacements: [
      e(3, 10, 52, 70, 'paysage', 'or', -0.6),
      e(58, 4, 22, 78, 'portrait', 'arche', 0.8),
      e(80, 16, 17, 62, 'portrait', 'bois', -1),
    ],
  },
  // un grand paysage, une arche, un rond et un portrait en bois (celui que l'on préfère : il remplit bien l'écran)
  quatre: {
    emplacements: [
      e(3, 5, 50, 72, 'paysage', 'or', -0.6),
      e(56, 3, 22, 72, 'portrait', 'arche', 0.8),
      e(81, 6, 16, 28, 'carre', 'rond', -1),
      e(81, 40, 16, 54, 'portrait', 'bois', 1),
    ],
  },
  // cinq cadres qui remplissent l'écran, de formes et de tailles différentes
  cinq: {
    emplacements: [
      e(2, 5, 42, 50, 'paysage', 'or', -0.7),
      e(47, 3, 19, 64, 'portrait', 'arche', 0.9),
      e(69, 6, 29, 30, 'paysage', 'noir', -0.8),
      e(72, 42, 24, 42, 'carre', 'rond', 1.1),
      e(4, 60, 40, 36, 'paysage', 'bois', 0.7),
    ],
  },
}

export const DISPOSITION_PAR_DEFAUT = 'un'

/** Chaque emplacement change de photo toutes les 20 à 40 secondes (au hasard, chacun à son rythme). */
export const DUREE_MIN = 20_000
export const DUREE_MAX = 40_000
