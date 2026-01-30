import { defineStore } from 'pinia';
import { useDashboardStore } from './dashboardStore';

export const useLanguageStore = defineStore('language', {
  state: () => ({
    language: 'fr' as string,
    translations: {
      fr: {
        weather: {
          feelsLike: 'Ressenti',
          humidity: 'Humidité',
          pressure: 'Pression',
          wind: 'Vent',
          visibility: 'Visibilité',
          clouds: 'Nuages',
          uvIndex: 'UV',
          windDirection: 'Direction vent',
          updated: 'Mis à jour',
          today: 'Aujourd\'hui',
          tomorrow: 'Demain',
          clear: 'Clair',
          cloudy: 'Nuageux',
          rain: 'Pluie',
          snow: 'Neige',
        },
        errors: {
          networkError: 'Erreur réseau',
          networkErrorMessage: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.',
          noData: 'Aucune donnée',
          noDataMessage: 'Aucune donnée météo disponible pour le moment.',
          serviceUnavailable: 'Service indisponible',
          serviceUnavailableMessage: 'Le service météo est temporairement indisponible.',
          error: 'Erreur',
          genericErrorMessage: 'Une erreur inattendue s\'est produite.',
          retry: 'Réessayer',
        },
        notifications: {
          reminder: 'Rappel',
          eventReminder1h: 'Rappel : événement dans 1 heure',
          eventReminder30min: 'Rappel : événement dans 30 minutes',
          eventStarting: 'Événement imminent',
        },
        calendar: {
          today: 'Aujourd\'hui',
          tomorrow: 'Demain',
          monday: 'Lundi',
          tuesday: 'Mardi',
          wednesday: 'Mercredi',
          thursday: 'Jeudi',
          friday: 'Vendredi',
          saturday: 'Samedi',
          sunday: 'Dimanche',
          noEvents: 'Aucun événement',
        },
        tasks: {
          completed: 'Terminée',
          pending: 'En cours',
          due: 'Échéance',
          noTasks: 'Aucune tâche',
        }
      },
      en: {
        weather: {
          feelsLike: 'Feels like',
          humidity: 'Humidity',
          pressure: 'Pressure',
          wind: 'Wind',
          visibility: 'Visibility',
          clouds: 'Clouds',
          uvIndex: 'UV',
          windDirection: 'Wind direction',
          updated: 'Updated',
          today: 'Today',
          tomorrow: 'Tomorrow',
          clear: 'Clear',
          cloudy: 'Cloudy',
          rain: 'Rain',
          snow: 'Snow',
        },
        errors: {
          networkError: 'Network Error',
          networkErrorMessage: 'Unable to connect to server. Please check your internet connection.',
          noData: 'No Data',
          noDataMessage: 'No weather data available at the moment.',
          serviceUnavailable: 'Service Unavailable',
          serviceUnavailableMessage: 'Weather service is temporarily unavailable.',
          error: 'Error',
          genericErrorMessage: 'An unexpected error occurred.',
          retry: 'Retry',
        },
        notifications: {
          reminder: 'Reminder',
          eventReminder1h: 'Reminder: event in 1 hour',
          eventReminder30min: 'Reminder: event in 30 minutes',
          eventStarting: 'Upcoming event',
        },
        calendar: {
          today: 'Today',
          tomorrow: 'Tomorrow',
          monday: 'Monday',
          tuesday: 'Tuesday',
          wednesday: 'Wednesday',
          thursday: 'Thursday',
          friday: 'Friday',
          saturday: 'Saturday',
          sunday: 'Sunday',
          noEvents: 'No events',
        },
        tasks: {
          completed: 'Completed',
          pending: 'Pending',
          due: 'Due',
          noTasks: 'No tasks',
        }
      }
    } as any,
  }),
  actions: {
    async loadLanguage() {
      const dashboardStore = useDashboardStore();
      await dashboardStore.loadConfig();
      this.language = dashboardStore.language;
    },
    t(key: string, section = 'weather') {
      return this.translations[this.language]?.[section]?.[key] || key;
    }
  },
});