import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useTasksStore } from './tasksStore';
import { useWeatherStore } from './weatherStore';
import { useCalendarStore } from './calendarStore';

export const useProgressStore = defineStore('progress', () => {
  const progress = ref(0);
  const totalTime = 60 * 1000; // 1 minute
  const startTime = ref(Date.now());
  const currentTime = ref(Date.now()); // Pour forcer la réactivité du computed
  let interval: ReturnType<typeof setInterval> | null = null;
  let refreshInterval: ReturnType<typeof setInterval> | null = null; // Timer séparé pour les refreshes

  // Calculer le temps restant en millisecondes
  const timeRemaining = computed(() => {
    const elapsed = currentTime.value - startTime.value;
    return Math.max(0, totalTime - elapsed);
  });

  const startProgress = async () => {
    if (interval) return; // Already started

    // Timer pour mettre à jour la progression (toutes les 100ms)
    interval = setInterval(async () => {
      const now = Date.now();
      currentTime.value = now; // Force la réactivité du computed

      const elapsed = now - startTime.value;

      // Calculer le progrès basé sur le temps écoulé
      const newProgress = Math.min((elapsed / totalTime) * 100, 100);
      
      // Si on atteint 100%, rester à 100% (le reset sera fait par le timer de refresh)
      if (newProgress >= 100) {
        progress.value = 100;
      } else {
        progress.value = newProgress;
      }

    }, 100); // Mise à jour toutes les 100ms pour fluidité

    // Timer séparé pour les refreshes (toutes les minutes)
    refreshInterval = setInterval(async () => {
      console.log('Déclenchement du refresh périodique');

      // Laisser la barre à 100% pendant le fetch
      progress.value = 100;

      // Trigger global refresh en arrière-plan
      const tasksStore = useTasksStore();
      const weatherStore = useWeatherStore();
      const calendarStore = useCalendarStore();

      // Rafraîchir en parallèle sans bloquer
      Promise.all([
        tasksStore.fetchTasks(true),
        weatherStore.fetchWeather(true),
        calendarStore.fetchAll(true)
      ]).then(() => {
        console.log('Refresh terminé');
        // Reset immédiat du cycle après le refresh
        startTime.value = Date.now();
        currentTime.value = Date.now();
        progress.value = 0;
        console.log('Nouveau cycle commencé');
      }).catch(error => {
        console.warn('Erreur lors du rafraîchissement:', error);
        // Même en cas d'erreur, reset le cycle
        startTime.value = Date.now();
        currentTime.value = Date.now();
        progress.value = 0;
      });

    }, 60 * 1000); // Toutes les minutes
  };

  const stopProgress = () => {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  };

  const resetProgress = () => {
    startTime.value = Date.now();
    currentTime.value = Date.now();
    progress.value = 0;
  };

  return {
    progress,
    timeRemaining,
    startProgress,
    stopProgress,
    resetProgress,
  };
});