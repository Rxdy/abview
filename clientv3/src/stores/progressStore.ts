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
  let interval: number | null = null;
  let refreshInterval: number | null = null; // Timer séparé pour les refreshes
  let timeOffset = 0; // Pour la synchronisation avec le serveur
  let lastSyncTime = 0;
  let serverStartTime = Date.now(); // État du serveur
  let serverTotalTime = 60 * 1000; // 1 minute par défaut
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
          'Accept': 'application/json'
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

      // Ajuster notre timer local pour être synchronisé avec le cycle CLIENT (1 minute)
      // Le serveur a son propre cycle de 5 minutes pour les APIs externes
      const newStartTime = Date.now() - (serverElapsed % totalTime); // Garder la continuité du cycle client
      const newProgress = Math.min(((Date.now() - newStartTime) / totalTime) * 100, 100);
      
      // Éviter les sauts brusques : seulement mettre à jour si la différence est significative
      const progressDiff = Math.abs(newProgress - progress.value);
      if (progressDiff > 10) { // Seuil plus élevé pour éviter les micro-ajustements
        startTime.value = newStartTime;
        progress.value = newProgress;
      }
      
      currentTime.value = Date.now();
      lastSyncTime = requestEnd;

      console.log(`Sync: offset=${timeOffset}ms, elapsed=${serverElapsed}ms, progress=${progress.value.toFixed(1)}%`);

    } catch (error) {
      console.warn('Erreur de synchronisation du timer de progression:', error);
      // En cas d'erreur, continuer avec le timer local
    }
  };

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