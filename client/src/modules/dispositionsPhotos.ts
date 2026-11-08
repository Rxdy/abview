/**
 * Dispositions du module Photos. Comme un mur de cadres accrochés à la main : les emplacements n'ont pas tous
 * la même taille, ne sont pas alignés (l'un plus haut que l'autre) et penchent très légèrement. Positions et
 * tailles sont en % du module. Une photo en paysage ne va jamais dans un emplacement en portrait : chaque
 * emplacement demande sa propre orientation à abflow.
 */
import type { Orientation } from '../utils/photosDemo'

/** Le style du cadre : « or » (doré, mouluré), « noir » (fin, avec filet doré), « bois » (noyer), « ovale » (doré, ovale). */
export type StyleCadre = 'or' | 'noir' | 'bois' | 'ovale'

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

export const DISPOSITIONS: Record<string, Disposition> = {
  // une photo en paysage (4 × 3 cases)
  un: { emplacements: [e(5, 7, 90, 86, 'paysage', 'or')] },
  // une photo en portrait (3 × 5)
  portrait: { emplacements: [e(8, 5, 84, 90, 'portrait', 'or')] },
  // deux paysages, un grand et un plus petit, plus bas (6 × 3)
  deux: { emplacements: [e(3, 8, 56, 84, 'paysage', 'or', -0.8), e(63, 20, 34, 62, 'paysage', 'noir', 1)] },
  // un portrait haut, un grand paysage, un petit paysage plus bas (8 × 3)
  trois: {
    emplacements: [
      e(3, 8, 17, 84, 'portrait', 'noir', -1),
      e(22, 10, 43, 80, 'paysage', 'or'),
      e(69, 22, 28, 60, 'paysage', 'bois', 1.2),
    ],
  },
  // un grand paysage, un portrait plus haut, deux petits paysages à des hauteurs différentes (6 × 5)
  quatre: {
    emplacements: [
      e(3, 4, 57, 46, 'paysage', 'or', -0.6),
      e(65, 7, 31, 62, 'portrait', 'noir', 1),
      e(3, 55, 33, 40, 'paysage', 'bois', 0.8),
      e(38, 62, 26, 30, 'paysage', 'or', -1.2),
    ],
  },
  // galerie plein écran (12 × 8) : cinq cadres de tailles et de styles différents, à des hauteurs différentes
  galerie: {
    emplacements: [
      e(3, 6, 40, 62, 'paysage', 'or', -0.7),
      e(46, 4, 21, 66, 'portrait', 'noir', 0.9),
      e(70, 5, 27, 34, 'paysage', 'bois', -1),
      e(70, 43, 13, 40, 'portrait', 'ovale', 1.2),
      e(85, 50, 12, 30, 'portrait', 'or', -0.8),
    ],
  },
}

export const DISPOSITION_PAR_DEFAUT = 'un'

/** Chaque emplacement change de photo toutes les 20 à 40 secondes (au hasard, chacun à son rythme). */
export const DUREE_MIN = 20_000
export const DUREE_MAX = 40_000
