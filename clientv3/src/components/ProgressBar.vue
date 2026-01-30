<template>
  <div v-if="progressStore.progress >= 0 && progressStore.progress <= 100" class="progress-container">
    <div class="progress-bar" :style="{ transform: `scaleX(${progressStore.progress / 100})` }"></div>
    <div class="progress-info">
      <span class="progress-text">{{ timeRemaining }}</span>
      <span class="last-update">Dernière mise à jour: {{ lastRefreshFormatted }}</span>
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
.progress-container {
  position: relative;
  width: 800px;
  height: 24px;
  background: var(--color-surface);
  border-radius: 12px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--color-accent);
  transform-origin: left;
  transition: transform 0.3s ease-out;
  will-change: transform;
}

.progress-info {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 0.8rem;
  font-weight: bold;
}

.progress-text {
  white-space: nowrap;
  font-weight: bold;
}

.last-update {
  font-size: 0.7rem;
  opacity: 0.8;
  font-weight: normal;
  white-space: nowrap;
}
</style>