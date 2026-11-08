/**
 * Registre des modules : ce que chaque module sait afficher, et sous quelles tailles (ses variantes).
 * Ajouter un module = un composant + une entrée ici. Le registre ne contient que des données : le
 * composant est chargé à la demande, pour que la validation d'une configuration reste légère.
 */
import type { Component } from 'vue'

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
  charger: () => Promise<{ default: Component }>
}

export type Registre = Record<string, DefinitionModule>

export const REGISTRE: Registre = {
  calendrier: {
    id: 'calendrier',
    titre: 'Agenda',
    variantes: [{ id: 'large', largeur: 12, hauteur: 5 }],
    charger: () => import('../components/CalendarModule.vue'),
  },
  meteo: {
    id: 'meteo',
    titre: 'Météo',
    variantes: [{ id: 'standard', largeur: 4, hauteur: 3 }],
    charger: () => import('../components/WeatherModule.vue'),
  },
  taches: {
    id: 'taches',
    titre: 'Tâches',
    variantes: [{ id: 'large', largeur: 8, hauteur: 3 }],
    charger: () => import('../components/TasksModule.vue'),
  },
}

export function variante(registre: Registre, module: string, id?: string): Variante | undefined {
  const def = registre[module]
  if (!def) return undefined
  return id === undefined ? def.variantes[0] : def.variantes.find((v) => v.id === id)
}
