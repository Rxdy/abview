<template>
  <div class="slide events-slide">
    <h3>Événements de l'année</h3>
    <div class="stats-card total-events">
      <div class="stat-number">{{ totalEvents }}</div>
      <div class="stat-label">événements planifiés</div>
    </div>
    
    <div class="content-container">
      <!-- Grille des mois (côté gauche/décalé) -->
      <div class="months-section">
        <h4>Sélectionnez un mois</h4>
        <div class="months-grid">
          <div 
            v-for="month in 12" 
            :key="month" 
            class="month-card"
            :class="{ selected: selectedMonth === month - 1 }"
          >
            <div class="month-name">{{ getMonthName(month - 1) }}</div>
            <div class="month-count">{{ (eventsByMonth[month - 1] || []).length }}</div>
            <div class="month-label">événements</div>
          </div>
        </div>
      </div>
      
      <!-- Détails du mois sélectionné (côté droit) -->
      <div class="details-section">
        <h4>{{ selectedMonth !== null ? getMonthName(selectedMonth) : 'Sélectionnez un mois' }}</h4>
        <div v-if="selectedMonth !== null" class="month-details">
          <div class="events-count">
            {{ selectedMonthEvents.length }} événement{{ selectedMonthEvents.length > 1 ? 's' : '' }}
          </div>
          <div class="events-list">
            <div 
              v-for="(event, index) in visibleEvents" 
              :key="event.id" 
              class="event-item"
              :style="{ animationDelay: `${index * 0.2}s` }"
            >
              <div class="event-title">{{ event.title }}</div>
              <div class="event-date">{{ formatDate(event.startTime) }}</div>
              <div v-if="event.location" class="event-location">📍 {{ event.location }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  totalEvents: number
  eventsByMonth: { [key: number]: any[] }
}

const props = defineProps<Props>()

const selectedMonth = ref<number | null>(null)
const visibleEventsCount = ref(0)
const autoSelectInterval = ref<number | null>(null)
const currentAutoMonth = ref(0)
const eventTimeouts = ref<number[]>([])

const monthNames = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

const selectedMonthEvents = computed(() => {
  if (selectedMonth.value === null) return []
  return props.eventsByMonth[selectedMonth.value] || []
})

const visibleEvents = computed(() => {
  return selectedMonthEvents.value.slice(0, visibleEventsCount.value)
})

function getMonthName(month: number): string {
  return monthNames[month] || 'Inconnu'
}

function clearEventTimeouts() {
  eventTimeouts.value.forEach(timeout => clearTimeout(timeout))
  eventTimeouts.value = []
}

function selectMonth(month: number) {
  selectedMonth.value = month
  visibleEventsCount.value = 0
  
  // Annuler les timeouts précédents
  clearEventTimeouts()
  
  // Afficher les événements un par un avec un délai
  const events = selectedMonthEvents.value
  for (let i = 0; i < events.length; i++) {
    const timeout = setTimeout(() => {
      visibleEventsCount.value = i + 1
    }, i * 200) // 200ms entre chaque événement
    eventTimeouts.value.push(timeout)
  }
}

function startAutoSelection() {
  currentAutoMonth.value = 0
  selectMonth(currentAutoMonth.value)
  
  autoSelectInterval.value = setInterval(() => {
    currentAutoMonth.value++
    if (currentAutoMonth.value >= 12) {
      currentAutoMonth.value = 0
    }
    selectMonth(currentAutoMonth.value)
  }, 5000) // Changer de mois toutes les 5 secondes
}

function stopAutoSelection() {
  if (autoSelectInterval.value) {
    clearInterval(autoSelectInterval.value)
    autoSelectInterval.value = null
  }
  clearEventTimeouts()
}

onMounted(() => {
  startAutoSelection()
})

onUnmounted(() => {
  stopAutoSelection()
})

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.slide {
  padding: 16px;
  color: white;
  height: 100%;
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100vw;
  max-width: 100vw;
  overflow: hidden;
  box-sizing: border-box;
}

.slide h3 {
  margin: 0 0 16px 0;
  color: #fff;
  font-size: 1.8rem;
}

.stats-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  border-radius: 12px;
  margin: 16px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: fadeInUp 0.8s ease-out 0.5s both;
}

.stat-number {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 1.1rem;
  opacity: 0.9;
}

.content-container {
  display: flex;
  width: 100%;
  height: 100%;
  gap: 40px;
  align-items: flex-start;
}

.months-section {
  flex: 0 0 35%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.months-section h4 {
  color: #fff;
  margin-bottom: 20px;
  font-size: 1.4rem;
}

.months-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  width: 100%;
  max-width: 400px;
}

.month-card {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.month-card:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.month-card.selected {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.2);
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
}

.month-name {
  font-size: 0.9rem;
  font-weight: bold;
  margin-bottom: 8px;
  color: #fff;
}

.month-count {
  font-size: 1.8rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 4px;
}

.month-label {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.7);
}

.details-section {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.details-section h4 {
  color: #fff;
  margin: 0 0 20px 0;
  font-size: 1.4rem;
  text-align: center;
}

.month-details {
  max-height: 60vh;
  overflow-y: auto;
}

.events-count {
  font-size: 1.2rem;
  color: #667eea;
  margin-bottom: 20px;
  text-align: center;
  font-weight: bold;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #667eea;
  animation: slideInRight 0.5s ease-out both;
}

.event-title {
  font-size: 1rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 8px;
}

.event-date {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 4px;
}

.event-location {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
}

@keyframes fadeInUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(30px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>