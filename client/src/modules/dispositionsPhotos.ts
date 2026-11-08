/**
 * Dispositions du module Photos : combien d'emplacements, où, et dans quelle orientation. Les positions sont
 * en cases d'une petite grille propre au module. Une photo en paysage ne va jamais dans un emplacement en
 * portrait : chaque emplacement demande sa propre orientation à abflow.
 */
import type { Orientation } from '../utils/photosDemo'

export interface Emplacement {
  /** Case de départ et taille, à partir de 1. */
  x: number
  y: number
  largeur: number
  hauteur: number
  orientation: Orientation
}

export interface Disposition {
  colonnes: number
  lignes: number
  emplacements: Emplacement[]
}

const e = (x: number, y: number, largeur: number, hauteur: number, orientation: Orientation): Emplacement => ({
  x, y, largeur, hauteur, orientation,
})

export const DISPOSITIONS: Record<string, Disposition> = {
  // une photo en paysage (4 × 3 cases)
  un: { colonnes: 1, lignes: 1, emplacements: [e(1, 1, 1, 1, 'paysage')] },
  // une photo en portrait (3 × 5)
  portrait: { colonnes: 1, lignes: 1, emplacements: [e(1, 1, 1, 1, 'portrait')] },
  // deux paysages côte à côte (6 × 3)
  deux: { colonnes: 2, lignes: 1, emplacements: [e(1, 1, 1, 1, 'paysage'), e(2, 1, 1, 1, 'paysage')] },
  // trois paysages en ligne (8 × 3)
  trois: {
    colonnes: 3,
    lignes: 1,
    emplacements: [e(1, 1, 1, 1, 'paysage'), e(2, 1, 1, 1, 'paysage'), e(3, 1, 1, 1, 'paysage')],
  },
  // quatre paysages en carré (6 × 5)
  quatre: {
    colonnes: 2,
    lignes: 2,
    emplacements: [e(1, 1, 1, 1, 'paysage'), e(2, 1, 1, 1, 'paysage'), e(1, 2, 1, 1, 'paysage'), e(2, 2, 1, 1, 'paysage')],
  },
  // galerie plein écran (12 × 8) : un grand paysage et quatre portraits
  galerie: {
    colonnes: 5,
    lignes: 2,
    emplacements: [
      e(1, 1, 3, 2, 'paysage'),
      e(4, 1, 1, 1, 'portrait'),
      e(5, 1, 1, 1, 'portrait'),
      e(4, 2, 1, 1, 'portrait'),
      e(5, 2, 1, 1, 'portrait'),
    ],
  },
}

export const DISPOSITION_PAR_DEFAUT = 'un'

/** Chaque emplacement change de photo toutes les 20 à 40 secondes (au hasard, chacun à son rythme). */
export const DUREE_MIN = 20_000
export const DUREE_MAX = 40_000
