<template>
  <div class="notification-modal" v-if="isVisible && event">
    <div class="modal-content">
      <h2>{{ languageStore.t('reminder') }} : {{ event.title }}</h2>
      <p v-if="type === '1h'">{{ languageStore.t('eventReminder1h') }}</p>
      <p v-else-if="type === '30min'">{{ languageStore.t('eventReminder30min') }}</p>
      <p>
        Heure : {{ event.startTime
        }}<span v-if="event.endTime"> - {{ event.endTime }}</span>
      </p>
      <p v-if="event.description" v-html="event.description"></p>
      <p v-if="event.location">Lieu : {{ event.location }}</p>
      <div class="progress-bar">
        <div class="progress-fill"></div>
        <span class="countdown-text">{{ secondsLeft }}s</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useLanguageStore } from '../stores/languageStore';

interface Event {
  title: string;
  startTime: string;
  endTime?: string;
  description?: string;
  location?: string;
}

defineProps<{
  event?: Event | null;
  type: string;
  isVisible: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const secondsLeft = ref(20);
let interval: number | null = null;
const languageStore = useLanguageStore();

onMounted(() => {
  secondsLeft.value = 20;
  interval = setInterval(() => {
    secondsLeft.value--;
    if (secondsLeft.value <= 0) {
      emit('close');
      if (interval) clearInterval(interval);
    }
  }, 1000);
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
});
</script>

<style scoped>
.notification-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--color-surface);
  color: var(--color-text);
  padding: clamp(15px, 3vh, 30px);
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.3s;
  width: 80%;
  max-width: 600px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-content h2 {
  margin-bottom: 10px;
  font-size: clamp(1.2rem, 3vh, 2rem);
}

.modal-content p {
  margin-bottom: 10px;
  font-size: clamp(1rem, 2.5vh, 1.5rem);
}

.close-button {
  background-color: var(--color-accent);
  color: var(--color-text);
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 10px;
}

.close-button:hover {
  opacity: 0.8;
}

.progress-bar {
  width: 100%;
  height: clamp(8px, 1.5vh, 15px);
  background-color: var(--color-gray);
  border-radius: 5px;
  overflow: hidden;
  margin-top: 10px;
  position: relative;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-accent);
  animation: consume 17.4s linear forwards;
}

@keyframes consume {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.countdown-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.8rem;
  font-weight: bold;
  color: var(--color-text);
}
</style>