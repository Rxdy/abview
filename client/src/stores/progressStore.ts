import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useTasksStore } from './tasksStore';
import { useWeatherStore } from './weatherStore';
import { useCalendarStore } from './calendarStore';
import { rechargerSiNouvelleVersion } from '../utils/nouvelleVersion';

/**
 * Horloge unique de l'actualisation de l'écran.
 *
 * Un cycle dure une minute : la barre se remplit, puis les trois sources
 * (tâches, météo, calendrier) sont rechargées ensemble. À la fin du rechargement,
 * « dernière à » prend l'heure de fin et un nouveau cycle commence.
 * Aucun autre minuteur ne recharge les données ni ne remet la barre à zéro.
 * Après chaque rechargement, la page se recharge elle-même si une nouvelle version
 * de l'app a été déployée.
 */
export const useProgressStore = defineStore('progress', () => {
  const totalTime = 60 * 1000; // 1 minute
  const progress = ref(0);
  const startTime = ref(Date.now());
  const currentTime = ref(Date.now());
  // Heure de fin du dernier rechargement réussi (null : pas encore eu lieu)
  const derniereActualisation = ref<Date | null>(null);
  // Le dernier rechargement a échoué sur au moins une source
  const enEchec = ref(false);
  const enCours = ref(false);
  let interval: ReturnType<typeof setInterval> | null = null;

  const timeRemaining = computed(() => {
    const elapsed = currentTime.value - startTime.value;
    return Math.max(0, totalTime - elapsed);
  });

  const nouveauCycle = () => {
    startTime.value = Date.now();
    currentTime.value = startTime.value;
    progress.value = 0;
  };

  const actualiser = async () => {
    if (enCours.value) return;
    enCours.value = true;
    progress.value = 100;

    const tasksStore = useTasksStore();
    const weatherStore = useWeatherStore();
    const calendarStore = useCalendarStore();

    try {
      await Promise.all([
        tasksStore.fetchTasks(true),
        weatherStore.fetchWeather(true),
        calendarStore.fetchAll(true),
      ]);
      // Les stores gardent leur erreur au lieu de la lever
      enEchec.value = Boolean(tasksStore.error || weatherStore.error || calendarStore.error);
    } catch (error) {
      console.warn('Erreur lors du rafraîchissement:', error);
      enEchec.value = true;
    } finally {
      if (!enEchec.value) derniereActualisation.value = new Date();
      enCours.value = false;
      nouveauCycle();
    }
    // Une nouvelle version en ligne : la page se recharge (le kiosque ne le ferait jamais seul)
    await rechargerSiNouvelleVersion();
  };

  const tic = () => {
    currentTime.value = Date.now();
    if (enCours.value) return; // la barre reste pleine pendant le rechargement
    const elapsed = currentTime.value - startTime.value;
    progress.value = Math.min((elapsed / totalTime) * 100, 100);
    if (elapsed >= totalTime) void actualiser();
  };

  const startProgress = async () => {
    if (interval) return; // déjà démarré
    nouveauCycle();
    interval = setInterval(tic, 100);
    // Premier rechargement tout de suite : « dernière à » est connue dès l'ouverture
    await actualiser();
  };

  const stopProgress = () => {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  };

  const resetProgress = () => {
    nouveauCycle();
  };

  return {
    progress,
    timeRemaining,
    derniereActualisation,
    enEchec,
    enCours,
    startProgress,
    stopProgress,
    resetProgress,
    actualiser,
  };
});
