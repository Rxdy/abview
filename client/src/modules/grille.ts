/**
 * La grille de l'écran : l'espace sous l'en-tête et au-dessus du pied de page est découpé en cases.
 * Écran 16:9 uniquement pour l'instant (voir l'issue #23 pour d'autres formats).
 *
 * Les positions (x, y) et les tailles (largeur, hauteur) sont en cases, à partir de 1.
 */
export interface Grille {
  colonnes: number
  lignes: number
}

export const GRILLE: Grille = { colonnes: 12, lignes: 8 }

/** Rectangle occupé par un module : case de départ (x, y) et taille en cases. */
export interface Rectangle {
  x: number
  y: number
  largeur: number
  hauteur: number
}

export function dansLaGrille(r: Rectangle, grille: Grille = GRILLE): boolean {
  return (
    Number.isInteger(r.x) &&
    Number.isInteger(r.y) &&
    Number.isInteger(r.largeur) &&
    Number.isInteger(r.hauteur) &&
    r.x >= 1 &&
    r.y >= 1 &&
    r.largeur >= 1 &&
    r.hauteur >= 1 &&
    r.x + r.largeur - 1 <= grille.colonnes &&
    r.y + r.hauteur - 1 <= grille.lignes
  )
}

/** Deux rectangles se chevauchent s'ils partagent au moins une case (se toucher par un bord n'est pas se chevaucher). */
export function seChevauchent(a: Rectangle, b: Rectangle): boolean {
  return (
    a.x < b.x + b.largeur && b.x < a.x + a.largeur && a.y < b.y + b.hauteur && b.y < a.y + a.hauteur
  )
}
