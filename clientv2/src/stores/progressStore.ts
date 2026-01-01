import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useTasksStore } from './tasksStore';
import { useWeatherStore } from './weatherStore';
import { useCalendarStore } from './calendarStore';

export const useProgressStore = defineStore('progress', () => {
  const progress = ref(0);
  const totalTime = 5 * 60 * 1000; // 5 min
  const startTime = ref(Date.now());
  const currentTime = ref(Date.now()); // Pour forcer la réactivité du computed
  let interval: number | null = null;
  let timeOffset = 0; // Pour la synchronisation avec le serveur
  let lastSyncTime = 0;
  let serverStartTime = Date.now(); // État du serveur
  let serverTotalTime = 5 * 60 * 1000; // 5 min par défaut
  const SYNC_INTERVAL = 30000; // Synchronisation toutes les 30 secondes

  // Calculer le temps restant en millisecondes avec compensation de synchronisation
  const timeRemaining = computed(() => {
    const elapsed = currentTime.value - startTime.value;
    return Math.max(0, totalTime - elapsed);
  });

  // Synchronisation avec le serveur pour obtenir l'état précis du timer
  const syncWithServer = async () => {
    try {
      const requestStart = Date.now();

      const response = await fetch('http://localhost:3333/progress/sync', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const requestEnd = Date.now();

      // Calculer l'offset : différence entre l'heure serveur et l'heure locale
      const serverTime = data.serverTime;
      const localTime = requestEnd;
      timeOffset = serverTime - localTime;

      // Calculer le temps écoulé selon le serveur
      const serverElapsed = serverTime - data.startTime;

      // Ajuster notre timer local pour être synchronisé
      startTime.value = Date.now() - serverElapsed;
      currentTime.value = Date.now(); // Force la réactivité immédiate
      progress.value = Math.min((serverElapsed / data.totalTime) * 100, 100);

      lastSyncTime = requestEnd;

      console.log(`Sync: offset=${timeOffset}ms, elapsed=${serverElapsed}ms, progress=${progress.value.toFixed(1)}%`);

    } catch (error) {
      console.warn('Erreur de synchronisation du timer de progression:', error);
      // En cas d'erreur, continuer avec le timer local
    }
  };

  const startProgress = async () => {
    if (interval) return; // Already started

    // Synchronisation initiale avec le serveur
    await syncWithServer();

    interval = setInterval(async () => {
      const now = Date.now();
      currentTime.value = now; // Force la réactivité du computed

      const elapsed = now - startTime.value;

      // Synchronisation périodique toutes les 30 secondes
      if (now - lastSyncTime > SYNC_INTERVAL) {
        await syncWithServer();
      }

      // Calculer le progrès basé sur le temps écoulé
      progress.value = Math.min((elapsed / totalTime) * 100, 100);

      if (progress.value >= 100) {
        // Garder la barre à 100% pendant le délai de refresh
        progress.value = 100;

        // Attendre un délai aléatoire avant de rafraîchir (simule la réponse du serveur)
        const delay = Math.random() * 15000 + 5000; // 5-20 secondes
        setTimeout(() => {
          // Trigger global refresh
          const tasksStore = useTasksStore();
          const weatherStore = useWeatherStore();
          const calendarStore = useCalendarStore();

          // Rafraîchir en parallèle
          Promise.all([
            tasksStore.fetchTasks(true),
            weatherStore.fetchWeather(true),
            calendarStore.fetchAll(true)
          ]).catch(error => {
            console.warn('Erreur lors du rafraîchissement:', error);
          });

          // Reset for next cycle
          startTime.value = Date.now();
          currentTime.value = Date.now();
          progress.value = 0;
        }, delay);
      }
    }, 100); // Mise à jour toutes les 100ms pour fluidité
  };

  const stopProgress = () => {
    if (interval) {
      clearInterval(interval);
      interval = null;
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