/** Le composant Vue de chaque module du registre. */
import type { Component } from 'vue'
import CalendarModule from '../components/CalendarModule.vue'
import WeatherModule from '../components/WeatherModule.vue'
import TasksModule from '../components/TasksModule.vue'
import PhotosModule from '../components/PhotosModule.vue'

export const COMPOSANTS: Record<string, Component> = {
  calendrier: CalendarModule,
  meteo: WeatherModule,
  taches: TasksModule,
  photos: PhotosModule,
}
