<template>
  <div v-if="isVisible" class="annual-recap-wrapper">
    <div class="recap-content">
      <div class="recap-header">
        <h1>Rétrospective {{ pastYear }}</h1>
      </div>

      <div class="recap-body">
        <div v-if="isLoading" class="loading">
          <div class="spinner"></div>
          <p>Chargement de vos souvenirs...</p>
        </div>

        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
          <button @click="retry" class="retry-btn">Réessayer</button>
        </div>

        <div v-else class="recap-slides">
          <!-- Slide 1: Célébration Nouvelle Année -->
          <CelebrationSlide
            v-if="currentSlide === 0"
            :current-year="currentYear"
            :past-year="pastYear"
          />

          <!-- Slide 1: Events -->
          <EventsSlide
            v-if="currentSlide === 1"
            :total-events="totalEvents"
            :events-by-month="eventsByMonth"
          />

          <!-- Slide 2: Tasks -->
          <TasksSlide
            v-if="currentSlide === 2"
            :total-tasks-created="totalTasksCreated"
            :total-tasks-completed="totalTasksCompleted"
            :tasks-by-list="tasksByList"
          />

          <!-- Slide 3: Weather Stats -->
          <WeatherSlide
            v-if="currentSlide === 3"
            :past-year="pastYear"
            :average-temp="averageTemp"
            :sunny-days="sunnyDays"
            :weather-description="weatherDescription"
            :weather-stats="weatherStats"
            :is-fullscreen="isFullscreen"
          />
        </div>

        <!-- Barre de progression du timer -->
        <div v-if="isAutoPlaying" class="progress-container">
          <div class="progress-bar" :style="{ width: progressPercent + '%' }"></div>
          <span class="progress-text">{{ timeRemaining }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAnnualRecapStore } from '@/stores/annualRecapStore'
import {
  CelebrationSlide,
  EventsSlide,
  TasksSlide,
  WeatherSlide
} from './annual-recap'

const emit = defineEmits<{
  close: []
}>()

const store = useAnnualRecapStore()
const currentSlide = ref(0)
const currentYear = new Date().getFullYear()
const pastYear = currentYear // Afficher l'année actuelle (2025) au lieu de l'année passée
const autoPlayInterval = ref<number | null>(null)

const isVisible = ref(false)
const isLoading = computed(() => store.isLoading)
const error = computed(() => store.error)
const totalEvents = computed(() => store.totalEvents)
const totalTasksCreated = computed(() => store.totalTasksCreated)
const totalTasksCompleted = computed(() => store.totalTasksCompleted)
const eventsByMonth = computed(() => store.eventsByMonth)
const tasksByList = computed(() => store.tasksByList)

// Weather stats
const averageTemp = computed(() => store.averageTemp)
const rainyDays = computed(() => store.rainyDays)
const sunnyDays = computed(() => store.sunnyDays)
const weatherDescription = computed(() => store.weatherDescription)
const weatherStats = computed(() => store.weatherStats)

const isAutoPlaying = computed(() => autoPlayInterval.value !== null)
const topUsersByTasks = computed(() => store.topUsersByTasks)

// Calculer le temps restant en format mm:ss
const timeRemaining = computed(() => {
  const remainingMs = (slideDuration.value * 1000) - (progressPercent.value / 100 * slideDuration.value * 1000)
  const minutes = Math.floor(remainingMs / 60000)
  const seconds = Math.floor((remainingMs % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// Détection du mode présentation (fullscreen)
const isFullscreen = ref(false)

const updateFullscreenStatus = () => {
  isFullscreen.value = document.fullscreenElement !== null || 
                      window.innerHeight === screen.height || 
                      window.innerWidth === screen.width
}

// Écouteurs pour les changements de fullscreen
onMounted(() => {
  updateFullscreenStatus()
  
  document.addEventListener('fullscreenchange', updateFullscreenStatus)
  document.addEventListener('webkitfullscreenchange', updateFullscreenStatus)
  document.addEventListener('mozfullscreenchange', updateFullscreenStatus)
  document.addEventListener('MSFullscreenChange', updateFullscreenStatus)
  
  window.addEventListener('resize', updateFullscreenStatus)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', updateFullscreenStatus)
  document.removeEventListener('webkitfullscreenchange', updateFullscreenStatus)
  document.removeEventListener('mozfullscreenchange', updateFullscreenStatus)
  document.removeEventListener('MSFullscreenChange', updateFullscreenStatus)
  
  window.removeEventListener('resize', updateFullscreenStatus)
})

// Barre de progression du timer
const progressPercent = ref(0)
const slideDuration = ref(60) // Durée par défaut : 60 secondes
const progressInterval = ref<number | null>(null)

function nextSlide() {
  progressPercent.value = 0
  if (progressInterval.value) {
    clearInterval(progressInterval.value)
    progressInterval.value = null
  }
  
  if (currentSlide.value < 3) {
    // Ajuster la durée selon la slide actuelle (avant l'incrémentation)
    slideDuration.value = currentSlide.value === 0 ? 15 : 60
    currentSlide.value++
    startProgress()
  } else {
    // Après la dernière slide, attendre 3 secondes puis fermer
    setTimeout(() => {
      hideRecap()
    }, 3000)
  }
}

function startProgress() {
  progressPercent.value = 0
  const startTime = Date.now()
  
  progressInterval.value = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000
    progressPercent.value = Math.min((elapsed / slideDuration) * 100, 100)
  }, 100) // Mise à jour toutes les 100ms pour une progression fluide
}

function startAutoPlay() {
  if (autoPlayInterval.value) {
    clearInterval(autoPlayInterval.value)
  }

  // Initialiser la durée pour la première slide
  slideDuration.value = currentSlide.value === 0 ? 15 : 60
  startProgress() // Démarrer la progression dès le départ

  autoPlayInterval.value = setInterval(() => {
    if (currentSlide.value < 3) {
      nextSlide()
    } else {
      // Après la dernière slide, attendre 3 secondes puis fermer
      setTimeout(() => {
        hideRecap()
      }, 3000)
    }
  }, slideDuration.value * 1000) // Utiliser slideDuration.value secondes par slide
}

function stopAutoPlay() {
  if (autoPlayInterval.value) {
    clearInterval(autoPlayInterval.value)
    autoPlayInterval.value = null
  }
}

function hideRecap() {
  stopAutoPlay()
  if (progressInterval.value) {
    clearInterval(progressInterval.value)
    progressInterval.value = null
  }
  progressPercent.value = 0
  isVisible.value = false
  // Mark as seen for this year
  localStorage.setItem(`annualRecapSeen_${currentYear}`, 'true')
}

function retry() {
  store.fetchPastYearData()
}

function checkIfShouldShow() {
  const now = new Date()
  const currentYear = now.getFullYear()
  
  // Vérifier si c'est le 1er janvier
  const isJan1 = now.getMonth() === 0 && now.getDate() === 1
  
  if (!isJan1) {
    isVisible.value = false
    return
  }
  
  // Vérifier si on est dans une fenêtre de 2 minutes toutes les 30 minutes
  const minutes = now.getMinutes()
  const isInWindow = minutes >= 0 && minutes < 2
  
  // Vérifier si déjà vu cette heure
  const currentHour = now.getHours()
  const alreadySeen = localStorage.getItem(`annualRecapSeen_${currentYear}_${currentHour}`)
  
  if (isInWindow && !alreadySeen) {
    isVisible.value = true
    store.fetchPastYearData()
    startAutoPlay()
    // Marquer comme vu pour cette heure
    localStorage.setItem(`annualRecapSeen_${currentYear}_${currentHour}`, 'true')
  } else {
    isVisible.value = false
  }
}

// Commandes de développement
;(window as any).showAnnualRecap = () => {
  console.log('🎉 Annual Recap triggered manually')
  isVisible.value = true
  store.fetchPastYearData()
  startAutoPlay()
}

;(window as any).nextSlide = () => {
  stopAutoPlay()
  nextSlide()
  startAutoPlay()
  console.log(`📄 Slide ${currentSlide.value + 1}/4`)
}

;(window as any).stopAutoPlay = () => {
  stopAutoPlay()
  console.log('⏸️ Autoplay arrêté')
}

;(window as any).startAutoPlay = () => {
  startAutoPlay()
  console.log('▶️ Autoplay démarré')
}

;(window as any).closeRecap = () => {
  stopAutoPlay()
  emit('close')
  console.log('❌ Récapitulatif annuel fermé manuellement')
}

;(window as any).recapStatus = () => {
  console.log('📊 État du recap annuel:')
  console.log(`- Visible: ${isVisible.value}`)
  console.log(`- Slide actuelle: ${currentSlide.value + 1}/5`)
  console.log(`- Loading: ${isLoading.value}`)
  console.log(`- Error: ${error.value || 'Aucune'}`)
  console.log(`- Événements: ${totalEvents.value}`)
  console.log(`- Tâches créées: ${totalTasksCreated.value}`)
  console.log(`- Tâches terminées: ${totalTasksCompleted.value}`)
  console.log(`- Température moyenne: ${averageTemp.value}°C`)
  console.log(`- Jours de pluie: ${rainyDays.value}`)
  console.log(`- Jours ensoleillés: ${sunnyDays.value}`)
}

onMounted(() => {
  checkIfShouldShow()
})
</script>

<style scoped>
.annual-recap-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.8s ease-out;
}

.recap-content {
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a2a2a 100%);
  border-radius: 0;
  max-width: 100vw;
  width: 100vw;
  max-height: 100vh;
  height: 100vh;
  overflow: hidden;
  box-shadow: none;
  animation: fadeIn 1s ease-out;
  border: none;
  display: flex;
  flex-direction: column;
}

.recap-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  height: 5%;
  flex-shrink: 0;
}

.recap-header h1 {
  margin: 0;
  color: #fff;
  font-size: 1.5rem;
  text-align: center;
}

.recap-slides {
  width: 100%;
  height: 100%;
}

.recap-body {
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 95%;
  box-sizing: border-box;
  padding: 0;
}

.slide {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  text-align: center;
  box-sizing: border-box;
  min-height: fit-content;
}

.loading, .error {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.error p {
  color: #e74c3c;
  margin-bottom: 16px;
}

.retry-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background: #2980b9;
}

.progress-container {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 24px;
  background: var(--color-surface);
  z-index: 10001;
  display: flex;
  align-items: center;
}

.progress-bar {
  height: 100%;
  background: var(--color-accent);
  transition: width 0.1s linear;
  transform-origin: left;
}

.progress-text {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.8rem;
  font-weight: bold;
  color: var(--color-text);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>