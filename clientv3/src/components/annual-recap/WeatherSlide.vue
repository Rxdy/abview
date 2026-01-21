<template>
  <div class="slide weather-slide">
    <h3>🌤️ Le climat de {{ pastYear }}</h3>

    <!-- Section principale : Moyenne annuelle -->
    <div class="weather-main-section">
      <div class="average-temp-card">
        <div class="temp-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div class="temp-data">
          <div class="temp-value">{{ Math.round(averageTemp) }}°C</div>
          <div class="temp-label">Température moyenne annuelle</div>
          <div class="temp-description">{{ weatherDescription }}</div>
        </div>
      </div>
    </div>

    <!-- Layout en colonnes pour toute la page -->
    <div class="weather-columns">
      <!-- Colonne 1: Records -->
      <div class="weather-column">
        <div class="weather-section">
          <h4>📊 Records de l'année</h4>
          <div class="records-grid">
            <!-- Record froid -->
            <div class="record-card cold">
              <div class="record-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div class="record-data">
                <div class="record-value">{{ coldestTemp }}°C</div>
                <div class="record-label">Jour le plus froid</div>
                <div class="record-date">{{ coldestDate ? formatDate(coldestDate) : 'Hiver' }}</div>
                <div class="record-feels">Ressenti: {{ coldestFeels }}°C</div>
              </div>
            </div>

            <!-- Record chaud -->
            <div class="record-card hot">
              <div class="record-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div class="record-data">
                <div class="record-value">{{ hottestTemp }}°C</div>
                <div class="record-label">Jour le plus chaud</div>
                <div class="record-date">{{ hottestDate ? formatDate(hottestDate) : 'Été' }}</div>
                <div class="record-feels">Ressenti: {{ hottestFeels }}°C</div>
              </div>
            </div>

            <!-- Record pluie -->
            <div class="record-card rain">
              <div class="record-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div class="record-data">
                <div class="record-value">{{ maxPrecip }}mm</div>
                <div class="record-label">Journée la plus pluvieuse</div>
                <div class="record-date">{{ maxPrecipDate ? formatDate(maxPrecipDate) : 'Automne' }}</div>
                <div class="record-condition">{{ maxPrecipDesc || 'Pluie' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Colonne 2: Statistiques météo détaillées -->
      <div class="weather-column">
        <div class="weather-section">
          <h4>📈 Statistiques détaillées</h4>
          <div class="detailed-stats-grid">
            <!-- Températures -->
            <div class="stat-group">
              <h5>🌡️ Températures</h5>
              <div class="stat-item">
                <div class="stat-icon temp">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div class="stat-data">
                  <div class="stat-value">{{ Math.round(averageTemp) }}°C</div>
                  <div class="stat-label">Moyenne</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon temp-min">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div class="stat-data">
                  <div class="stat-value">{{ coldestTemp }}°C</div>
                  <div class="stat-label">Minimum</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon temp-max">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div class="stat-data">
                  <div class="stat-value">{{ hottestTemp }}°C</div>
                  <div class="stat-label">Maximum</div>
                </div>
              </div>
            </div>

            <!-- Humidité -->
            <div class="stat-group">
              <h5>💧 Humidité</h5>
              <div class="stat-item">
                <div class="stat-icon humidity">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div class="stat-data">
                  <div class="stat-value">{{ averageHumidity }}%</div>
                  <div class="stat-label">Moyenne</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon humidity-min">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div class="stat-data">
                  <div class="stat-value">{{ minHumidity }}%</div>
                  <div class="stat-label">Minimum</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon humidity-max">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div class="stat-data">
                  <div class="stat-value">{{ maxHumidity }}%</div>
                  <div class="stat-label">Maximum</div>
                </div>
              </div>
            </div>

            <!-- Vent -->
            <div class="stat-group">
              <h5>🌬️ Vent</h5>
              <div class="stat-item">
                <div class="stat-icon wind">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div class="stat-data">
                  <div class="stat-value">{{ averageWindSpeed }} km/h</div>
                  <div class="stat-label">Vitesse moyenne</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon wind-gust">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div class="stat-data">
                  <div class="stat-value">{{ maxWindGust }} km/h</div>
                  <div class="stat-label">Rafale max</div>
                </div>
              </div>
            </div>

            <!-- Soleil -->
            <div class="stat-group">
              <h5>☀️ Soleil</h5>
              <div class="stat-item">
                <div class="stat-icon sunrise">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div class="stat-data">
                  <div class="stat-value">{{ averageSunrise }}</div>
                  <div class="stat-label">Lever moyen</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon sunset">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div class="stat-data">
                  <div class="stat-value">{{ averageSunset }}</div>
                  <div class="stat-label">Coucher moyen</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon sunny">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm-12.37 0c.39.39.39 1.03 0 1.41L4.93 19.5c-.39.39-1.03.39-1.41 0-.39-.39-.39-1.03 0-1.41l1.06-1.06c.39-.39 1.03-.39 1.41 0zM18.36 4.58l-1.06 1.06c-.39.39-1.03.39-1.41 0s-.39-1.03 0-1.41l1.06-1.06c.39-.39 1.03-.39 1.41 0 .39.39.39 1.03 0 1.41z"/>
                  </svg>
                </div>
                <div class="stat-data">
                  <div class="stat-value">{{ sunnyDays }}</div>
                  <div class="stat-label">Jours ensoleillés</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Colonne 3: Conditions générales -->
      <div class="weather-column">
        <div class="weather-section">
          <h4>🌍 Conditions générales</h4>
          <div class="general-stats-grid">
            <div class="stat-item large">
              <div class="stat-icon rainy">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div class="stat-data">
                <div class="stat-value">{{ rainyDays }}</div>
                <div class="stat-label">Jours de pluie</div>
              </div>
            </div>

            <div class="stat-item large">
              <div class="stat-icon total">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                </svg>
              </div>
              <div class="stat-data">
                <div class="stat-value">{{ weatherStats?.days?.length || 1 }}</div>
                <div class="stat-label">Jours enregistrés</div>
              </div>
            </div>

            <div class="stat-item large">
              <div class="stat-icon comfort">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div class="stat-data">
                <div class="stat-value">{{ averageFeelsLike }}°C</div>
                <div class="stat-label">Ressenti moyen</div>
              </div>
            </div>

            <div class="stat-item large">
              <div class="stat-icon precip">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div class="stat-data">
                <div class="stat-value">{{ totalPrecip }}mm</div>
                <div class="stat-label">Précipitations totales</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Day {
  date: string
  tempMin: number
  tempMax: number
  feelsLike: number
  humidity: number
  windSpeed: number
  windGust: number
  precip: number
  description: string
  sunrise?: string
  sunset?: string
}

interface WeatherStats {
  days: Day[]
}

interface Props {
  pastYear: number
  averageTemp: number
  sunnyDays: number
  rainyDays: number
  weatherDescription: string
  weatherStats: WeatherStats | null
  isFullscreen: boolean
}

const props = defineProps<Props>()

function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// Calculer les records à partir des vraies données
const coldestTemp = computed(() => {
  if (!props.weatherStats?.days?.length) return Math.round(props.averageTemp - 8)
  const coldest = props.weatherStats.days.reduce((min: Day, day: Day) => 
    day.tempMin < min.tempMin ? day : min
  )
  return Math.round(coldest.tempMin)
})

const coldestDate = computed(() => {
  if (!props.weatherStats?.days?.length) return null
  const coldest = props.weatherStats.days.reduce((min: Day, day: Day) => 
    day.tempMin < min.tempMin ? day : min
  )
  return coldest.date
})

const coldestFeels = computed(() => {
  if (!props.weatherStats?.days?.length) return Math.round(props.averageTemp - 10)
  const coldest = props.weatherStats.days.reduce((min: Day, day: Day) => 
    day.tempMin < min.tempMin ? day : min
  )
  return Math.round(coldest.feelsLike)
})

const hottestTemp = computed(() => {
  if (!props.weatherStats?.days?.length) return Math.round(props.averageTemp + 12)
  const hottest = props.weatherStats.days.reduce((max: Day, day: Day) => 
    day.tempMax > max.tempMax ? day : max
  )
  return Math.round(hottest.tempMax)
})

const hottestDate = computed(() => {
  if (!props.weatherStats?.days?.length) return null
  const hottest = props.weatherStats.days.reduce((max: Day, day: Day) => 
    day.tempMax > max.tempMax ? day : max
  )
  return hottest.date
})

const hottestFeels = computed(() => {
  if (!props.weatherStats?.days?.length) return Math.round(props.averageTemp + 15)
  const hottest = props.weatherStats.days.reduce((max: Day, day: Day) => 
    day.tempMax > max.tempMax ? day : max
  )
  return Math.round(hottest.feelsLike)
})

const maxPrecip = computed(() => {
  if (!props.weatherStats?.days?.length) return 0
  const rainiest = props.weatherStats.days.reduce((max: Day, day: Day) => 
    day.precip > max.precip ? day : max
  )
  return Math.round(rainiest.precip)
})

const maxPrecipDate = computed(() => {
  if (!props.weatherStats?.days?.length) return null
  const rainiest = props.weatherStats.days.reduce((max: Day, day: Day) => 
    day.precip > max.precip ? day : max
  )
  return rainiest.precip > 0 ? rainiest.date : null
})

const maxPrecipDesc = computed(() => {
  if (!props.weatherStats?.days?.length) return 'Aucune pluie'
  const rainiest = props.weatherStats.days.reduce((max: Day, day: Day) => 
    day.precip > max.precip ? day : max
  )
  return rainiest.precip > 0 ? rainiest.description : 'Aucune pluie'
})

// Nouveaux calculs pour les paramètres détaillés
const averageHumidity = computed(() => {
  if (!props.weatherStats?.days?.length) return 60
  const total = props.weatherStats.days.reduce((sum: number, day: Day) => sum + day.humidity, 0)
  return Math.round(total / props.weatherStats.days.length)
})

const minHumidity = computed(() => {
  if (!props.weatherStats?.days?.length) return 40
  return Math.min(...props.weatherStats.days.map((day: Day) => day.humidity))
})

const maxHumidity = computed(() => {
  if (!props.weatherStats?.days?.length) return 80
  return Math.max(...props.weatherStats.days.map((day: Day) => day.humidity))
})

const averageWindSpeed = computed(() => {
  if (!props.weatherStats?.days?.length) return 10
  const total = props.weatherStats.days.reduce((sum: number, day: Day) => sum + day.windSpeed, 0)
  return Math.round(total / props.weatherStats.days.length)
})

const maxWindGust = computed(() => {
  if (!props.weatherStats?.days?.length) return 20
  return Math.max(...props.weatherStats.days.map((day: Day) => day.windGust))
})

const averageSunrise = computed(() => {
  if (!props.weatherStats?.days?.length) return '07:30'
  // Pour simplifier, prenons le lever du soleil du dernier jour enregistré
  const lastDay = props.weatherStats.days[props.weatherStats.days.length - 1]
  return lastDay?.sunrise || '07:30'
})

const averageSunset = computed(() => {
  if (!props.weatherStats?.days?.length) return '18:30'
  // Pour simplifier, prenons le coucher du soleil du dernier jour enregistré
  const lastDay = props.weatherStats.days[props.weatherStats.days.length - 1]
  return lastDay?.sunset || '18:30'
})

const averageFeelsLike = computed(() => {
  if (!props.weatherStats?.days?.length) return Math.round(props.averageTemp)
  const total = props.weatherStats.days.reduce((sum: number, day: Day) => sum + day.feelsLike, 0)
  return Math.round(total / props.weatherStats.days.length)
})

const totalPrecip = computed(() => {
  if (!props.weatherStats?.days?.length) return 0
  return Math.round(props.weatherStats.days.reduce((sum: number, day: Day) => sum + day.precip, 0))
})
</script>

<style scoped>
.weather-slide {
  padding: 10px;
  color: white;
  height: 100%;
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  width: 100vw;
  max-width: 100vw;
}

.weather-slide h3 {
  text-align: center;
  font-size: 1.4rem;
  margin-bottom: 0;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.weather-main-section {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.average-temp-card {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  max-width: 500px;
  width: 100%;
}

.temp-icon {
  margin-right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffd700;
}

.temp-data {
  flex: 1;
}

.temp-value {
  font-size: 2.4rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 4px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.temp-label {
  font-size: 1.1rem;
  color: #e0e0e0;
  margin-bottom: 8px;
}

.temp-description {
  font-size: 1rem;
  color: #b0b0b0;
  font-style: italic;
}

.weather-section {
  margin-bottom: 24px;
}

.weather-section h4 {
  text-align: center;
  font-size: 1.8rem;
  margin-bottom: 20px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.records-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 15px;
  max-width: 100%;
  margin: 0 auto;
  padding: 0 8px;
  box-sizing: border-box;
}

.record-card {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  backdrop-filter: blur(5px);
  min-width: 0;
  box-sizing: border-box;
}

.record-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.15);
}

.record-card.cold {
  border-left: 4px solid #4fc3f7;
}

.record-card.hot {
  border-left: 4px solid #ff7043;
}

.record-card.rain {
  border-left: 4px solid #42a5f5;
}

.record-icon {
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.record-card.cold .record-icon {
  color: #4fc3f7;
}

.record-card.hot .record-icon {
  color: #ff7043;
}

.record-card.rain .record-icon {
  color: #42a5f5;
}

.record-data {
  flex: 1;
  min-width: 0;
}

.record-value {
  font-size: 1.4rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.record-label {
  font-size: 0.9rem;
  color: #e0e0e0;
  margin-bottom: 2px;
}

.record-date {
  font-size: 0.8rem;
  color: #b0b0b0;
  margin-bottom: 4px;
}

.record-feels, .record-condition {
  font-size: 0.75rem;
  color: #a0a0a0;
  font-style: italic;
}

.forecast-section {
  margin-bottom: 15px;
}

.forecast-section h4 {
  text-align: center;
  font-size: 1.2rem;
  margin-bottom: 8px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.forecast-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.forecast-card {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  backdrop-filter: blur(5px);
  min-width: 0;
  box-sizing: border-box;
}

.forecast-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.12);
}

.forecast-icon {
  margin-right: 10px;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.forecast-data {
  flex: 1;
  min-width: 0;
}

.forecast-temp {
  font-size: 1.2rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 2px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.forecast-label {
  font-size: 0.75rem;
  color: #e0e0e0;
  margin-bottom: 2px;
}

.forecast-desc {
  font-size: 0.65rem;
  color: #b0b0b0;
  font-style: italic;
}

.weather-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
  width: 100%;
  margin-top: 8px;
  max-width: 100%;
}

.weather-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detailed-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  width: 100%;
}

.stat-group {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(5px);
}

.stat-group h5 {
  text-align: center;
  font-size: 1rem;
  margin-bottom: 12px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  font-weight: 600;
}

.stat-group .stat-item {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.2s ease;
}

.stat-group .stat-item:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.1);
}

.stat-group .stat-item:last-child {
  margin-bottom: 0;
}

.stat-group .stat-icon {
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
}

.stat-group .stat-icon.temp {
  color: #ff7043;
}

.stat-group .stat-icon.temp-min {
  color: #4fc3f7;
}

.stat-group .stat-icon.temp-max {
  color: #ff5722;
}

.stat-group .stat-icon.humidity {
  color: #42a5f5;
}

.stat-group .stat-icon.humidity-min {
  color: #90caf9;
}

.stat-group .stat-icon.humidity-max {
  color: #1976d2;
}

.stat-group .stat-icon.wind {
  color: #81c784;
}

.stat-group .stat-icon.wind-gust {
  color: #4caf50;
}

.stat-group .stat-icon.sunrise {
  color: #ffd700;
}

.stat-group .stat-icon.sunset {
  color: #ff9800;
}

.stat-group .stat-icon.sunny {
  color: #ffd700;
}

.stat-group .stat-data {
  flex: 1;
  min-width: 0;
}

.stat-group .stat-value {
  font-size: 1.1rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 2px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.stat-group .stat-label {
  font-size: 0.8rem;
  color: #e0e0e0;
}

.general-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 15px;
  width: 100%;
}

.general-stats-grid .stat-item.large {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  backdrop-filter: blur(5px);
  min-width: 0;
  box-sizing: border-box;
}

.general-stats-grid .stat-item.large:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.12);
}

.general-stats-grid .stat-icon {
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.general-stats-grid .stat-icon.rainy {
  color: #42a5f5;
}

.general-stats-grid .stat-icon.total {
  color: #81c784;
}

.general-stats-grid .stat-icon.comfort {
  color: #ff9800;
}

.general-stats-grid .stat-icon.precip {
  color: #2196f3;
}

.general-stats-grid .stat-data {
  flex: 1;
}

.general-stats-grid .stat-value {
  font-size: 1.4rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.general-stats-grid .stat-label {
  font-size: 0.9rem;
  color: #e0e0e0;
}

/* Responsive design */
@media (max-width: 1200px) {
  .weather-columns {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 18px;
  }
}

@media (max-width: 768px) {
  .weather-slide {
    padding: 8px;
    gap: 12px;
  }

  .weather-slide h3 {
    font-size: 1.3rem;
  }

  .average-temp-card {
    padding: 16px;
    flex-direction: column;
    text-align: center;
  }

  .temp-icon {
    margin-right: 0;
    margin-bottom: 12px;
  }

  .temp-value {
    font-size: 2rem;
  }

  .weather-columns {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .records-grid {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 0 4px;
  }

  .record-card {
    padding: 12px;
    border-radius: 10px;
  }

  .record-value {
    font-size: 1.2rem;
  }

  .detailed-stats-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .stat-group {
    padding: 12px;
  }

  .general-stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .general-stats-grid .stat-item.large {
    padding: 12px;
  }

  .general-stats-grid .stat-value {
    font-size: 1rem;
  }

  .forecast-section h4 {
    font-size: 1.1rem;
  }

  .forecast-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }

  .forecast-card {
    padding: 8px;
  }

  .forecast-icon {
    font-size: 1.3rem;
    margin-right: 6px;
  }

  .forecast-temp {
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .weather-slide h3 {
    font-size: 1.2rem;
  }

  .temp-value {
    font-size: 1.8rem;
  }

  .record-value {
    font-size: 1.2rem;
  }

  .general-stats-grid {
    grid-template-columns: 1fr;
  }

  .general-stats-grid .stat-value {
    font-size: 1rem;
  }

  .stat-group .stat-value {
    font-size: 1rem;
  }

  .forecast-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .forecast-card {
    padding: 6px;
  }

  .forecast-icon {
    font-size: 1.1rem;
  }

  .forecast-temp {
    font-size: 1rem;
  }
}
</style>