<template>
  <div v-if="progressStore.progress >= 0 && progressStore.progress <= 100" class="progress-container">
    <div class="progress-track">
      <div class="progress-bar" :style="{ transform: `scaleX(${progressStore.progress / 100})` }"></div>
    </div>
    <div class="progress-info num">
      <span>Prochaine actualisation dans <span class="progress-text">{{ timeRemaining }}</span></span>
      <span aria-hidden="true">·</span>
      <span class="last-update">dernière à {{ lastRefreshFormatted }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useProgressStore } from '../stores/progressStore';
import { useCalendarStore } from '../stores/calendarStore';
import { useTasksStore } from '../stores/tasksStore';
import { useWeatherStore } from '../stores/weatherStore';

const progressStore = useProgressStore();
const calendarStore = useCalendarStore();
const tasksStore = useTasksStore();
const weatherStore = useWeatherStore();

// Calculer le temps restant en format mm:ss
const timeRemaining = computed(() => {
  const remainingMs = progressStore.timeRemaining;
  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Afficher le datetime du dernier appel du serveur aux APIs externes (toutes les 5 minutes)
const lastRefreshFormatted = computed(() => {
  const dates = [
    calendarStore.lastRefresh,
    tasksStore.lastRefresh,
    weatherStore.lastRefresh
  ].filter(d => d !== null) as Date[];
  
  if (dates.length === 0) {
    // Si aucun refresh n'a eu lieu, afficher "sync..."
    return 'sync...';
  }
  
  // Prendre la date la plus récente (dernière mise à jour du serveur)
  const mostRecent = new Date(Math.max(...dates.map(d => d.getTime())));
  
  const hours = mostRecent.getHours().toString().padStart(2, '0');
  const minutes = mostRecent.getMinutes().toString().padStart(2, '0');
  const seconds = mostRecent.getSeconds().toString().padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
});

// Mettre à jour l'affichage chaque seconde pour le cas "sync..."
const currentTime = ref(Date.now());
setInterval(() => {
  currentTime.value = Date.now();
}, 1000);

onMounted(() => {
  progressStore.startProgress();
});

onUnmounted(() => {
  progressStore.stopProgress();
});
</script>

<style scoped>
/* Barre fine et arrondie qui prend la largeur disponible, texte d'actualisation à droite. */
.progress-container {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.progress-track {
  flex: 1;
  height: calc(6 * var(--px));
  border-radius: var(--radius-pill);
  background: var(--c-line);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: var(--radius-pill);
  background: var(--c-accent);
  transform-origin: left;
  transition: transform 0.3s ease-out;
  will-change: transform;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: calc(6 * var(--px));
  white-space: nowrap;
}
</style>
