<template>
  <div class="date-time">
    <span>{{ currentDate }}</span>
    <span>{{ currentTime }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const currentDate = ref('');
const currentTime = ref('');

const updateDateTime = () => {
  const now = new Date();
  const day = now.getDate();
  const month = now.toLocaleDateString('fr-FR', { month: 'long' });
  const year = now.getFullYear();
  currentDate.value = `${day} ${month} ${year}`; // Format personnalisé pour s'assurer que tout s'affiche
  currentTime.value = now.toLocaleTimeString('fr-FR');
};

let interval: number;

onMounted(() => {
  updateDateTime();
  interval = setInterval(updateDateTime, 1000); // Update every second
});

onUnmounted(() => {
  clearInterval(interval);
});
</script>

<style scoped>
.date-time {
  display: flex;
  flex-direction: row;
  align-items: center;
  color: white;
  font-size: 1.2rem;
  font-weight: bold;
  gap: 1rem;
}

.date-time span:nth-child(2) {
  font-family: monospace; /* Police monospace pour éviter le décalage des secondes */
}

.light-theme .date-time {
  color: #000000;
}
</style>