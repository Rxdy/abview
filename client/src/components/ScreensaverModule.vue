<template>
  <div class="screensaver">
    <!-- Carrousel de photos -->
    <transition name="fade" mode="out-in">
      <img
        :key="currentIndex"
        :src="resolveUrl(currentPhoto.url)"
        :alt="currentPhoto.title"
        class="screensaver__photo"
      />
    </transition>

    <!-- Overlay dégradé pour lisibilité -->
    <div class="screensaver__overlay" />

    <!-- Métadonnées — bas gauche (date uniquement) -->
    <div class="screensaver__meta">
      <span v-if="currentPhoto.title" class="screensaver__meta-title">{{ currentPhoto.title }}</span>
      <span v-if="currentPhoto.createdAt" class="screensaver__meta-date">{{ formatDate(currentPhoto.createdAt) }}</span>
    </div>

    <!-- Heure & date — bas droite -->
    <div class="screensaver__clock">
      <span class="screensaver__time">{{ currentTime }}</span>
      <span class="screensaver__date">{{ currentDate }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { calendarService, type Photo } from '../services/calendarService';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3333' : '');
const resolveUrl = (url: string) => url.startsWith('/') ? `${API_BASE}${url}` : url;

// Fallback picsum si l'API n'est pas encore disponible
const FALLBACK_PHOTOS: Photo[] = Array.from({ length: 8 }, (_, i) => ({
  id: `fallback-${i}`,
  url: `https://picsum.photos/seed/veille${i + 1}/1920/1080`,
  title: `Photo ${i + 1}`,
  description: 'Placeholder — Google Photos non connecté',
  location: '',
  createdAt: '',
  width: 1920,
  height: 1080,
}));

const photos = ref<Photo[]>(FALLBACK_PHOTOS);
const currentIndex = ref(0);
const currentTime = ref('');
const currentDate = ref('');

const currentPhoto = computed((): Photo => {
  const photo = photos.value[currentIndex.value];
  return photo ?? FALLBACK_PHOTOS[0] as Photo;
});

const formatDate = (iso: string): string => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

const updateDateTime = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  currentDate.value = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const nextPhoto = () => {
  if (photos.value.length === 0) return;
  currentIndex.value = (currentIndex.value + 1) % photos.value.length;
};

let clockInterval: ReturnType<typeof setInterval>;
let carouselInterval: ReturnType<typeof setInterval>;

const loadPhotos = async () => {
  try {
    const fetched = await calendarService.getPhotos();
    if (fetched.length > 0) {
      photos.value = fetched;
      currentIndex.value = 0;
      // Les dates viennent déjà du Picker API - pas besoin d'enrichissement
    }
  } catch {
    // Garder les photos fallback silencieusement
  }
};

const onPhotosConfirmed = async () => {
  await loadPhotos();
};

onMounted(() => {
  updateDateTime();
  clockInterval = setInterval(updateDateTime, 1000);
  carouselInterval = setInterval(nextPhoto, 10000);
  loadPhotos();
  window.addEventListener('abview-photos-confirmed', onPhotosConfirmed);
});

onUnmounted(() => {
  clearInterval(clockInterval);
  clearInterval(carouselInterval);
  window.removeEventListener('abview-photos-confirmed', onPhotosConfirmed);
});
</script>

<style scoped>
.screensaver {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #000;
  overflow: hidden;
}

.screensaver__photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.screensaver__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.65) 0%,
    rgba(0, 0, 0, 0.1) 40%,
    rgba(0, 0, 0, 0.1) 60%,
    rgba(0, 0, 0, 0.3) 100%
  );
  z-index: 1;
}

/* Bas gauche — métadonnées */
.screensaver__meta {
  position: absolute;
  bottom: 2.5rem;
  left: 2.5rem;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  max-width: 40%;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.85);
}

.screensaver__meta-title {
  font-size: 1.1rem;
  font-weight: 600;
}

.screensaver__meta-description {
  font-size: 0.85rem;
  opacity: 0.8;
}

.screensaver__meta-location {
  font-size: 0.8rem;
  opacity: 0.65;
  font-style: italic;
}

.screensaver__meta-title {
  font-size: 1.25rem;
  font-weight: 600;
  opacity: 0.95;
}

.screensaver__meta-date {
  font-size: 1.2rem;
  opacity: 0.85;
  font-style: italic;
  margin-top: 0.15rem;
}

/* Bas droite — horloge */
.screensaver__clock {
  position: absolute;
  bottom: 2.5rem;
  right: 2.5rem;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  color: white;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.8);
}

.screensaver__time {
  font-size: 4rem;
  font-weight: 200;
  font-family: 'Segoe UI', system-ui, sans-serif;
  letter-spacing: 0.04em;
  line-height: 1;
}

.screensaver__date {
  font-size: 1.1rem;
  font-weight: 400;
  opacity: 0.9;
  text-transform: capitalize;
}

/* Transition entre photos */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
