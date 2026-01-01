<template>
  <div class="annual-recap-wrapper" v-if="currentSlideIndex !== null">
    <div class="slide-container">
      <component
        :is="currentSlide.component"
        v-bind="currentSlide.props || {}"
        :key="currentSlideIndex"
      ></component>
    </div>

    <div class="progress-container">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>
      <div class="time-remaining">
        {{ Math.ceil(timeRemaining / 1000) }}s
      </div>
    </div>

    <div class="slide-indicators">
      <div
        v-for="(slide, index) in slides"
        :key="index"
        class="indicator"
        :class="{ active: index === currentSlideIndex }"
        @click="goToSlide(index)"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  CelebrationSlide,
  EventsSlide,
  TasksSlide,
  WeatherSlide,
  UserStatsSlide
} from './index'
import { useCalendarStore } from '../../stores/calendarStore'
import { useTasksStore } from '../../stores/tasksStore'
import { useWeatherStore } from '../../stores/weatherStore'

interface Slide {
  component: any
  duration: number // in seconds
  props?: Record<string, any>
}

const calendarStore = useCalendarStore()
const tasksStore = useTasksStore()
const weatherStore = useWeatherStore()

const slides = ref<Slide[]>([
  {
    component: CelebrationSlide,
    duration: 10, // Réduit à 10 secondes pour la première slide
    props: {}
  },
  {
    component: EventsSlide,
    duration: 60, // 60 seconds for other slides
    props: {}
  },
  {
    component: TasksSlide,
    duration: 60,
    props: {}
  },
  {
    component: WeatherSlide,
    duration: 60,
    props: {}
  },
  {
    component: UserStatsSlide,
    duration: 60,
    props: {}
  }
])

const currentSlideIndex = ref<number | null>(null)
const slideStartTime = ref(Date.now())
const slideTimer = ref<number | null>(null)

const currentSlide = computed(() => {
  if (currentSlideIndex.value === null) return null
  const slide = slides.value[currentSlideIndex.value]
  
  // Add dynamic props based on slide type
  if (slide.component === EventsSlide) {
    return {
      ...slide,
      props: {
        totalEvents: calendarStore.pastYearEvents?.length || 0,
        eventsByMonth: (() => {
          const events = calendarStore.pastYearEvents || []
          const byMonth: any[] = Array(12).fill(null).map(() => [])
          events.forEach(event => {
            const date = new Date(event.start?.dateTime || event.start)
            const month = date.getMonth()
            byMonth[month].push(event)
          })
          return byMonth
        })()
      }
    }
  }
  
  if (slide.component === TasksSlide) {
    return {
      ...slide,
      props: {
        tasksData: tasksStore.tasksData || {}
      }
    }
  }
  
  if (slide.component === WeatherSlide) {
    return {
      ...slide,
      props: {
        weatherData: weatherStore.pastYearWeatherStats || {}
      }
    }
  }
  
  if (slide.component === UserStatsSlide) {
    return {
      ...slide,
      props: {
        userStats: calendarStore.pastYearStats || {}
      }
    }
  }
  
  return slide
})

const timeRemaining = computed(() => {
  if (currentSlideIndex.value === null) return 0
  const elapsed = Date.now() - slideStartTime.value
  const duration = slides.value[currentSlideIndex.value].duration * 1000
  return Math.max(0, duration - elapsed)
})

const progressPercent = computed(() => {
  if (currentSlideIndex.value === null) return 0
  const elapsed = Date.now() - slideStartTime.value
  const duration = slides.value[currentSlideIndex.value].duration * 1000
  return Math.min(100, (elapsed / duration) * 100)
})

const startSlide = (index: number) => {
  currentSlideIndex.value = index
  slideStartTime.value = Date.now()

  if (slideTimer.value) {
    clearTimeout(slideTimer.value)
  }

  const duration = slides.value[index].duration * 1000
  slideTimer.value = setTimeout(() => {
    nextSlide()
  }, duration)
}

const nextSlide = () => {
  if (currentSlideIndex.value === null) return

  const nextIndex = currentSlideIndex.value + 1
  if (nextIndex < slides.value.length) {
    startSlide(nextIndex)
  } else {
    // End of recap
    currentSlideIndex.value = null
  }
}

const goToSlide = (index: number) => {
  if (index >= 0 && index < slides.value.length) {
    startSlide(index)
  }
}

const startRecap = () => {
  startSlide(0)
}

const stopRecap = () => {
  if (slideTimer.value) {
    clearTimeout(slideTimer.value)
    slideTimer.value = null
  }
  currentSlideIndex.value = null
}

onMounted(() => {
  // Auto-start recap when component mounts
  startRecap()
})

onUnmounted(() => {
  stopRecap()
})

onUnmounted(() => {
  stopRecap()
})

// Expose methods for external control
defineExpose({
  startRecap,
  stopRecap,
  goToSlide,
  currentSlideIndex
})
</script>

<style scoped>
.annual-recap-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--color-background);
  z-index: 10000;
  display: flex;
  flex-direction: column;
}

.slide-container {
  flex: 1;
  overflow: hidden;
  padding-bottom: 120px; /* Espace pour la barre de progression */
}

.progress-container {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(0, 0, 0, 0.9);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  z-index: 10001;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.progress-bar {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

.time-remaining {
  color: white;
  font-size: 0.9rem;
  font-weight: bold;
  min-width: 40px;
  text-align: center;
}

.slide-indicators {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.5rem;
}

.indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: background 0.3s ease;
}

.indicator.active {
  background: var(--color-primary);
}
</style>