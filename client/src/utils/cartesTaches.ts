/**
 * Largeur des cartes de liste d'un module Tâches, en unités de 1/1280 de la largeur de l'écran (les mêmes que
 * `--px`), d'après la largeur de la zone du module.
 *
 * - Zone assez large pour au moins deux cartes à leur largeur normale : les cartes gardent cette largeur
 *   (les autres listes défilent), comme sur l'écran standard.
 * - Zone plus étroite : deux cartes plus étroites se partagent la largeur si elles tiennent, sinon une carte
 *   remplit la zone. Aucune carte n'est coupée par le bord.
 */
export const CARTE_NORMALE = 276
export const CARTE_MINI = 190
export const ECART = 10

export function largeurCartes(zone: number): number {
  if (zone <= 0) return CARTE_NORMALE
  if (zone >= 2 * CARTE_NORMALE + ECART) return CARTE_NORMALE
  if (zone >= 2 * CARTE_MINI + ECART) return (zone - ECART) / 2
  return Math.min(zone, CARTE_NORMALE * 1.25)
}
