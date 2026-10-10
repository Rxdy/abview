<template>
  <div class="date-time">
    <span class="date">{{ currentDate }}</span>
    <span class="separateur" aria-hidden="true"></span>
    <span class="heure num">{{ currentTime }}<span class="secondes">:{{ currentSeconds }}</span></span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const currentDate = ref('');
const currentTime = ref('');
const currentSeconds = ref('');

const deuxChiffres = (n: number) => String(n).padStart(2, '0');

const updateDateTime = () => {
  const now = new Date();
  const weekday = now.toLocaleDateString('fr-FR', { weekday: 'long' });
  const month = now.toLocaleDateString('fr-FR', { month: 'long' });
  // « Samedi 10 octobre 2026 »
  currentDate.value = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${now.getDate()} ${month} ${now.getFullYear()}`;
  currentTime.value = `${deuxChiffres(now.getHours())}:${deuxChiffres(now.getMinutes())}`;
  currentSeconds.value = deuxChiffres(now.getSeconds());
};

let interval: ReturnType<typeof setInterval>;

onMounted(() => {
  updateDateTime();
  interval = setInterval(updateDateTime, 1000);
});

onUnmounted(() => {
  clearInterval(interval);
});
</script>

<style scoped>
/* Pilule centrée de l'en-tête : date, filet, heure (secondes en plus petit). */
.date-time {
  display: flex;
  align-items: center;
  gap: calc(14 * var(--px));
  padding: var(--space-2) calc(22 * var(--px));
  border-radius: var(--radius-pill);
  background: var(--c-surface);
  box-shadow: var(--shadow-card);
  color: var(--c-text);
}

.date {
  font-size: var(--fs-lg);
  font-weight: 700;
}

.separateur {
  width: 1px;
  height: calc(22 * var(--px));
  background: var(--c-line);
}

.heure {
  font-size: var(--fs-xl);
  font-weight: 800;
  color: var(--c-accent-text);
}

.secondes {
  font-size: calc(15 * var(--px));
  color: var(--c-muted);
}
</style>
