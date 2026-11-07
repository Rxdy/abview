<template>
  <div v-if="progressStore.progress >= 0 && progressStore.progress <= 100" class="progress-container">
    <div class="progress-track">
      <div class="progress-bar" :style="{ transform: `scaleX(${progressStore.progress / 100})` }"></div>
    </div>
    <div class="progress-info num">
      <span>Prochaine actualisation dans <span class="progress-text">{{ timeRemaining }}</span></span>
      <span aria-hidden="true">·</span>
      <span class="last-update" :class="{ echec: progressStore.enEchec }">{{ progressStore.enEchec ? 'échec, dernière réussie à' : 'dernière à' }} {{ lastRefreshFormatted }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useProgressStore } from '../stores/progressStore';

const progressStore = useProgressStore();

// Calculer le temps restant en format mm:ss
const timeRemaining = computed(() => {
  const remainingMs = progressStore.timeRemaining;
  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Heure de fin du dernier rechargement réussi de l'écran (le cycle d'une minute)
const deuxChiffres = (n: number) => n.toString().padStart(2, '0');
const lastRefreshFormatted = computed(() => {
  const d = progressStore.derniereActualisation;
  if (!d) return 'sync...';
  return `${deuxChiffres(d.getHours())}:${deuxChiffres(d.getMinutes())}:${deuxChiffres(d.getSeconds())}`;
});

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
.last-update.echec {
  color: var(--cat-sante-fg);
}
</style>
