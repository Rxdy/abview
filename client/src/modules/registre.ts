/**
 * Registre des modules : ce que chaque module sait afficher, et sous quelles tailles (ses variantes).
 * Ajouter un module = un composant (voir composants.ts) + une entrée ici. Le registre ne contient que
 * des données, pour que la validation d'une configuration reste légère.
 */

export interface Variante {
  id: string
  /** Taille en cases. */
  largeur: number
  hauteur: number
}

export interface DefinitionModule {
  id: string
  titre: string
  /** Tracé de l'icône (SVG 24 × 24, traits), affichée dans la palette de l'éditeur. */
  icone: string
  /** Tailles que le module sait afficher ; la première est celle par défaut. */
  variantes: Variante[]
  /** Le module est posé sur une carte (fond, coins arrondis, ombre) ; sinon il dessine ses propres cartes. */
  carte?: boolean
  /** Classe d'animation d'entrée (voir base.css), pour échelonner l'apparition des modules. */
  animation?: string
}

export type Registre = Record<string, DefinitionModule>

export const REGISTRE: Registre = {
  calendrier: {
    id: 'calendrier',
    titre: 'Agenda',
    icone: 'M7 2.5v3M17 2.5v3M3.5 9h17M5 4.5h14a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V6A1.5 1.5 0 0 1 5 4.5zM8 13h2M14 13h2M8 17h2M14 17h2',
    variantes: [{ id: 'large', largeur: 12, hauteur: 5 }],
    animation: 'fade-in-1',
  },
  meteo: {
    id: 'meteo',
    titre: 'Météo',
    icone: 'M12 3v1.5M5.6 5.6l1 1M18.4 5.6l-1 1M3 12h1.5M19.5 12H21M7 18a3.5 3.5 0 0 1 .3-7 5 5 0 0 1 9.6 1.2A3 3 0 0 1 17 18z',
    variantes: [
      { id: 'standard', largeur: 4, hauteur: 3 },
      { id: 'compact', largeur: 3, hauteur: 2 },
      { id: 'large', largeur: 6, hauteur: 3 },
    ],
    carte: true,
  },
  taches: {
    id: 'taches',
    titre: 'Tâches',
    icone: 'M10 6h10M10 12h10M10 18h10M3.5 6l1.3 1.3L7 5M3.5 12l1.3 1.3L7 11M3.5 18l1.3 1.3L7 17',
    variantes: [{ id: 'large', largeur: 8, hauteur: 3 }],
    animation: 'fade-in-3',
  },
}

export function variante(registre: Registre, module: string, id?: string): Variante | undefined {
  const def = registre[module]
  if (!def) return undefined
  return id === undefined ? def.variantes[0] : def.variantes.find((v) => v.id === id)
}
