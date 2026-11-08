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
    variantes: [{ id: 'large', largeur: 12, hauteur: 5 }],
    animation: 'fade-in-1',
  },
  meteo: {
    id: 'meteo',
    titre: 'Météo',
    variantes: [{ id: 'standard', largeur: 4, hauteur: 3 }],
    carte: true,
  },
  taches: {
    id: 'taches',
    titre: 'Tâches',
    variantes: [{ id: 'large', largeur: 8, hauteur: 3 }],
    animation: 'fade-in-3',
  },
}

export function variante(registre: Registre, module: string, id?: string): Variante | undefined {
  const def = registre[module]
  if (!def) return undefined
  return id === undefined ? def.variantes[0] : def.variantes.find((v) => v.id === id)
}
