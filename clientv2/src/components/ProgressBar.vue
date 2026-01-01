<template>
  <div v-if="progressStore.progress >= 0 && progressStore.progress <= 100" class="progress-container">
    <div class="progress-bar" :style="{ transform: `scaleX(${progressStore.progress / 100})` }"></div>
    <span class="progress-text">{{ timeRemaining }}</span>
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
  transition: transform 0.05s linear;
  will-change: transform;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.8rem;
  font-weight: bold;
}
</style>