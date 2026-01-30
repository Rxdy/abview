<template>
  <div class="weather">
    <!-- Loading State -->
    <div v-if="weatherStore.loading" class="skeleton">
      <div class="skeleton-current">
        <div class="skeleton-icon"></div>
        <div class="skeleton-temp"></div>
        <div class="skeleton-time"></div>
        <div class="skeleton-sun">
          <div class="skeleton-sun-item"></div>
          <div class="skeleton-sun-item"></div>
        </div>
      </div>
      <div class="skeleton-details">
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
      </div>
      <div class="skeleton-forecast">
        <div v-for="i in 5" :key="i" class="skeleton-forecast-day">
          <div class="skeleton-forecast-icon"></div>
          <div class="skeleton-forecast-text"></div>
          <div class="skeleton-forecast-text"></div>
          <div class="skeleton-forecast-text"></div>
        </div>
      </div>
    </div>

    <!-- Error States -->
    <ErrorDisplay
      v-else-if="weatherStore.error"
      type="network"
    />

    <!-- No Data State -->
    <ErrorDisplay
      v-else-if="!weatherStore.weather"
      type="no-data"
    />

    <!-- Weather Content -->
    <div v-else class="weather-content">
      <!-- Météo actuelle -->
      <div class="current-weather">
        <div class="current-quick">
          <div class="current-main">
            <div class="weather-icon-wrapper" :class="getWeatherIconClass(weatherStore.weather.current?.conditions)">
              <component :is="getWeatherIcon(weatherStore.weather.current?.conditions)" class="weather-icon" />
            </div>
            <div class="temp" :style="{ color: getTempColor(weatherStore.weather.current?.temperature || 0) }">{{ Math.round(weatherStore.weather.current?.temperature || 0) }}°C</div>
          </div>
          <div class="time">{{ languageStore.t('updated') }}: {{ weatherStore.weather.current?.datetime || 'N/A' }}</div>
          <div class="sun-times">
            <div class="sun-item">
              <SunriseIcon class="sun-icon" />
              <span>{{ (weatherStore.weather.current?.sunrise || '').substring(0, 5) }}</span>
            </div>
            <div class="sun-item">
              <MoonIcon class="sun-icon" />
              <span>{{ (weatherStore.weather.current?.sunset || '').substring(0, 5) }}</span>
            </div>
          </div>
        </div>
        <div class="current-details">
          <div class="details">
            <span>{{ languageStore.t('feelsLike') }}: {{ Math.round(weatherStore.weather.current?.feelsLike || 0) }}°C</span>
            <span>{{ languageStore.t('humidity') }}: {{ Math.round(weatherStore.weather.current?.humidity || 0) }}%</span>
            <span>{{ languageStore.t('wind') }}: {{ Math.round(weatherStore.weather.current?.windSpeed || 0) }} km/h {{ getWindDirection(weatherStore.weather.current?.windDirection || 0) }}</span>
            <span>{{ languageStore.t('clouds') }}: {{ Math.round(weatherStore.weather.current?.cloudCover || 0) }}%</span>
            <div class="uv-full-width">
              {{ languageStore.t('uvIndex') }}:
              <div class="uv-display">
                <div class="uv-circle" :style="{ backgroundColor: getUvColor(Math.round(weatherStore.weather.current?.uvIndex || 0)) }">
                  {{ Math.round(weatherStore.weather.current?.uvIndex || 0) }}
                </div>
                <div class="uv-label">{{ getUvLabel(Math.round(weatherStore.weather.current?.uvIndex || 0)) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Prévisions 4 jours -->
      <div class="forecast">
        <div v-for="(day, index) in forecastDays" :key="index" class="forecast-day">
          <component :is="getWeatherIcon(day.description)" class="forecast-icon" />
          <div class="day-name">{{ day.day }}</div>
          <div class="day-temp">
            <span :style="{ color: getTempColor(day.tempMin) }">{{ Math.round(day.tempMin) }}°C</span> /
            <span :style="{ color: getTempColor(day.tempMax) }">{{ Math.round(day.tempMax) }}°C</span>
          </div>
          <div class="day-condition">{{ translateCondition(day.description) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useWeatherStore } from '../stores/weatherStore';
import { useLanguageStore } from '../stores/languageStore';
import { useThemeStore } from '../stores/themeStore';
import ErrorDisplay from './ErrorDisplay.vue';
import ClearDayIcon from './icons/ClearDayIcon.vue';
import CloudyIcon from './icons/CloudyIcon.vue';
import PartlyCloudyDayIcon from './icons/PartlyCloudyDayIcon.vue';
import RainIcon from './icons/RainIcon.vue';
import HeavyRain from './icons/HeavyRain.vue';
import SnowIcon from './icons/SnowIcon.vue';
import HailIcon from './icons/HailIcon.vue';
import ThunderIcon from './icons/ThunderIcon.vue';
import WindIcon from './icons/WindIcon.vue';
import SunriseIcon from './icons/SunriseIcon.vue';
import SunsetIcon from './icons/SunsetIcon.vue';
import MoonIcon from './icons/MoonIcon.vue';

const weatherStore = useWeatherStore();
const languageStore = useLanguageStore();
const themeStore = useThemeStore();

const emit = defineEmits(['sun-times']);

onMounted(async () => {
  await languageStore.loadLanguage();
  weatherStore.fetchWeather();
  weatherStore.startPolling();
});

// Watch for weather data changes to emit sun times
watch(() => weatherStore.weather?.current, (current) => {
  if (current?.sunrise && current?.sunset) {
    const formatSunTime = (timeStr: string) => {
      if (!timeStr) return '07:00'; // Default sunrise
      const parts = timeStr.split(':');
      return `${parts[0]}:${parts[1]}`;
    };
    
    const sunTimes = {
      sunrise: formatSunTime(current.sunrise) || '07:00',
      sunset: formatSunTime(current.sunset) || '17:30'
    };
    
    // console.log('WeatherModule: Emitting sun times to theme store:', sunTimes);
    themeStore.updateSunTimes(sunTimes);
    
    // Update theme immediately when we get real sun times
    themeStore.updateThemeBasedOnTime();
  }
}, { immediate: true });

const forecastDays = computed(() => {
  if (!weatherStore.weather?.forecast) return [];

  return weatherStore.weather.forecast.slice(1, 6).map((day: any, index: number) => ({
    day: index === 0 ? languageStore.t('tomorrow') : new Date(day.date).toLocaleDateString(languageStore.language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short' }),
    tempMin: day.tempMin,
    tempMax: day.tempMax,
    description: day.description,
    icon: day.icon,
  }));
});

const getUvColor = (uvIndex: number) => {
  if (uvIndex <= 2) return 'green';
  if (uvIndex <= 5) return 'yellow';
  if (uvIndex <= 7) return 'orange';
  if (uvIndex <= 10) return 'red';
  return 'purple';
};

const getUvLabel = (uvIndex: number) => {
  if (uvIndex <= 2) return 'Faible';
  if (uvIndex <= 5) return 'Modéré';
  if (uvIndex <= 7) return 'Élevé';
  if (uvIndex <= 10) return 'Très élevé';
  return 'Extrême';
};

const getTempColor = (temp: number) => {
  if (temp <= 0) return '#0000ff'; // Bleu froid
  if (temp <= 15) return '#0080ff';
  if (temp <= 25) return '#ffa500'; // Orange
  return '#ff0000'; // Rouge chaud
};

const getWindDirection = (degrees: number) => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

const translateCondition = (condition: string) => {
  if (!condition) return '';

  // Split by comma first, then by common separators
  const commaParts = condition.split(',').map(p => p.trim());
  const allParts: string[] = [];

  commaParts.forEach(part => {
    const subParts = part.split(/\s+(with|and)\s+/i).filter(p => p && !/^(with|and)$/i.test(p));
    allParts.push(...subParts);
  });

  const translatedParts = allParts.map(part => {
    const cond = part.toLowerCase();
    if (cond.includes('clear')) return 'Clair';
    if (cond.includes('partly cloudy')) return 'Partiellement nuageux';
    if (cond.includes('cloudy') || cond.includes('overcast')) return 'Nuageux';
    if (cond.includes('heavy rain') || cond.includes('strong rain')) return 'Forte pluie';
    if (cond.includes('light rain')) return 'Pluie légère';
    if (cond.includes('rain')) return 'Pluie';
    if (cond.includes('snow')) return 'Neige';
    if (cond.includes('hail')) return 'Grêle';
    if (cond.includes('thunder') || cond.includes('storm')) return 'Orage';
    if (cond.includes('wind')) return 'Vent';
    if (cond.includes('fog')) return 'Brouillard';
    if (cond.includes('mist')) return 'Brume';
    // Default
    return part;
  });

  return translatedParts.join(', ');
};

const getWeatherIcon = (conditions: string) => {
  if (!conditions) return ClearDayIcon;

  // Take the first condition from comma-separated list
  const firstCondition = conditions.split(',')[0]?.trim().toLowerCase() || '';

  if (firstCondition.includes('clear')) return ClearDayIcon;

  if (firstCondition.includes('clear')) return ClearDayIcon;
  if (firstCondition.includes('partly cloudy')) return PartlyCloudyDayIcon;
  if (firstCondition.includes('cloudy') || firstCondition.includes('overcast')) return CloudyIcon;
  if (firstCondition.includes('heavy rain') || firstCondition.includes('strong rain')) return HeavyRain;
  if (firstCondition.includes('light rain')) return RainIcon;
  if (firstCondition.includes('rain')) return RainIcon;
  if (firstCondition.includes('snow')) return SnowIcon;
  if (firstCondition.includes('hail')) return HailIcon;
  if (firstCondition.includes('thunder') || firstCondition.includes('storm')) return ThunderIcon;
  if (firstCondition.includes('wind')) return WindIcon;
  if (firstCondition.includes('fog')) return CloudyIcon;
  if (firstCondition.includes('mist')) return CloudyIcon;

  // Default
  return ClearDayIcon;
};

const getWeatherIconClass = (conditions: string) => {
  if (!conditions) return '';

  const cond = conditions.toLowerCase();

  if (cond.includes('clear')) return 'rotate-slow';
  if (cond.includes('wind')) return 'oscillate';
  if (cond.includes('rain')) return 'pulse-rain';
  if (cond.includes('snow')) return 'float-snow';
  if (cond.includes('thunder')) return 'flash-thunder';
  if (cond.includes('cloudy') || cond.includes('overcast')) return 'float-cloud';

  return '';
};
</script>

<style scoped>
.weather {
  display: flex;
  flex-direction: column;
  color: var(--color-primary);
  box-sizing: border-box;
  padding: 0.5rem;
  height: 100%;
  min-height: 0;
}

.weather-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.current-weather {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  background: var(--color-surface);
  border-radius: 8px;
  padding: 0.5rem;
}

.light-theme .current-weather {
  background: rgba(0, 0, 0, 0.1);
}

.current-quick {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.current-main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.current-details {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.weather-icon {
  width: 3rem;
  height: 3rem;
}

.temp {
  font-size: 2rem;
  font-weight: bold;
}

.time {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.sun-times {
  display: flex;
  justify-content: space-around;
  width: 100%;
  font-size: 0.8rem;
}

.sun-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.sun-icon {
  width: 1rem;
  height: 1rem;
}

.details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  font-size: 0.7rem;
  text-align: center;
}

.forecast {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background: var(--color-gray);
  border-radius: 8px;
  padding: 0.25rem;
}

.forecast-day {
  display: grid;
  grid-template-columns: auto 1fr auto 2fr;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-surface);
  border-radius: 8px;
  padding: 0.25rem;
}

.light-theme .forecast-day {
  background: rgba(0, 0, 0, 0.1);
}

.forecast-icon {
  width: 2rem;
  height: 2rem;
}

.day-name {
  font-size: 0.9rem;
  font-weight: bold;
}

.day-temp {
  font-size: 1rem;
  font-weight: bold;
  text-align: center;
}

.day-condition {
  font-size: 0.8rem;
  text-transform: capitalize;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-height: 200px;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.loading-text {
  font-size: 0.9rem;
  color: var(--color-secondary);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.uv-legend {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.uv-full-width {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  font-size: 0.7rem;
  text-align: center;
}

.uv-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.uv-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 0.8rem;
}

.uv-label {
  font-size: 0.7rem;
  font-weight: bold;
}

/* Weather Icon Animations */
.weather-icon-wrapper.rotate-slow {
  animation: rotate-slow 20s linear infinite;
}

.weather-icon-wrapper.oscillate {
  animation: oscillate 3s ease-in-out infinite;
}

.weather-icon-wrapper.pulse-rain {
  animation: pulse-rain 2s ease-in-out infinite;
}

.weather-icon-wrapper.float-snow {
  animation: float-snow 4s ease-in-out infinite;
}

.weather-icon-wrapper.flash-thunder {
  animation: flash-thunder 1s ease-in-out infinite;
}

.weather-icon-wrapper.float-cloud {
  animation: float-cloud 4s ease-in-out infinite;
}

@keyframes rotate-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes oscillate {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

@keyframes pulse-rain {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes float-snow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@keyframes flash-thunder {
  0%, 100% { opacity: 1; filter: brightness(1); }
  50% { opacity: 0.8; filter: brightness(1.5); }
}

@keyframes float-cloud {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-5px) scale(1.1); }
}

/* Skeleton Loading */
.skeleton {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.skeleton-current {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  background: var(--color-surface);
  border-radius: 8px;
  padding: 0.5rem;
}

.skeleton-icon {
  width: 4rem;
  height: 4rem;
  background: var(--color-border);
  border-radius: 50%;
  margin: 0 auto;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-temp {
  width: 3rem;
  height: 2rem;
  background: var(--color-border);
  border-radius: 4px;
  margin: 0.5rem auto 0;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-time {
  width: 5rem;
  height: 1rem;
  background: var(--color-border);
  border-radius: 4px;
  margin: 0.5rem auto 0;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-sun {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.skeleton-sun-item {
  width: 3rem;
  height: 1rem;
  background: var(--color-border);
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-details {
  background: var(--color-surface);
  border-radius: 8px;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
}

.skeleton-line {
  height: 1rem;
  background: var(--color-border);
  border-radius: 4px;
  margin-bottom: 0.5rem;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-forecast {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.skeleton-forecast-day {
  flex: 1;
  background: var(--color-surface);
  border-radius: 8px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.skeleton-forecast-icon {
  width: 2rem;
  height: 2rem;
  background: var(--color-border);
  border-radius: 50%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-forecast-text {
  width: 4rem;
  height: 1rem;
  background: var(--color-border);
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}

.skeleton-icon,
.skeleton-temp,
.skeleton-time,
.skeleton-sun-item,
.skeleton-line,
.skeleton-forecast-icon,
.skeleton-forecast-text {
  background: linear-gradient(90deg, var(--color-border) 25%, rgba(255,255,255,0.1) 50%, var(--color-border) 75%);
  background-size: 200px 100%;
}
</style>