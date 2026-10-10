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
      <!-- Météo actuelle : température à gauche, détails en grille 2 colonnes à droite -->
      <div class="current-weather">
        <div class="current-quick">
          <div class="current-main">
            <div class="weather-icon-wrapper" :class="getWeatherIconClass(weatherStore.weather.current?.conditions)">
              <component :is="getWeatherIcon(weatherStore.weather.current?.conditions)" class="weather-icon" />
            </div>
            <div class="temp num">{{ Math.round(weatherStore.weather.current?.temperature || 0) }}°</div>
          </div>
          <div class="condition">{{ translateCondition(weatherStore.weather.current?.conditions) }}</div>
          <div class="time">{{ languageStore.t('updated') }} {{ weatherStore.weather.current?.datetime || 'N/A' }}</div>
        </div>
        <div class="details">
          <div>{{ languageStore.t('feelsLike') }} <b class="num">{{ Math.round(weatherStore.weather.current?.feelsLike || 0) }}°</b></div>
          <div>{{ languageStore.t('humidity') }} <b class="num">{{ Math.round(weatherStore.weather.current?.humidity || 0) }} %</b></div>
          <div>{{ languageStore.t('wind') }} <b class="num">{{ Math.round(weatherStore.weather.current?.windSpeed || 0) }} km/h {{ getWindDirection(weatherStore.weather.current?.windDirection || 0) }}</b></div>
          <div>{{ languageStore.t('clouds') }} <b class="num">{{ Math.round(weatherStore.weather.current?.cloudCover || 0) }} %</b></div>
          <div class="sun-item"><SunriseIcon class="sun-icon" /> <b class="num">{{ (weatherStore.weather.current?.sunrise || '').substring(0, 5) }}</b></div>
          <div class="sun-item"><MoonIcon class="sun-icon" /> <b class="num">{{ (weatherStore.weather.current?.sunset || '').substring(0, 5) }}</b></div>
          <div class="uv">
            {{ languageStore.t('uvIndex') }}
            <span class="uv-circle num" :style="{ backgroundColor: getUvColor(Math.round(weatherStore.weather.current?.uvIndex || 0)) }">
              {{ Math.round(weatherStore.weather.current?.uvIndex || 0) }}
            </span>
            <b>{{ getUvLabel(Math.round(weatherStore.weather.current?.uvIndex || 0)) }}</b>
          </div>
        </div>
      </div>

      <!-- Prévisions 4 jours, en ligne -->
      <div class="forecast">
        <div v-for="(day, index) in forecastDays" :key="index" class="forecast-day">
          <div class="day-name">{{ day.day }}</div>
          <component :is="getWeatherIcon(day.description)" class="forecast-icon" />
          <div class="day-temp num">{{ Math.round(day.tempMax) }}° <span>{{ Math.round(day.tempMin) }}°</span></div>
          <div class="day-condition">{{ translateCondition(day.description) }}</div>
        </div>
      </div>
    </div>
    <div class="module-progress-bar">
      <div class="module-progress-fill" :style="{ width: ($props.progress ?? 100) + '%' }"></div>
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

defineProps<{ progress?: number }>();

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

  return weatherStore.weather.forecast.slice(1, 5).map((day: any, index: number) => ({
    day: index === 0 ? languageStore.t('tomorrow') : new Date(day.date).toLocaleDateString(languageStore.language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short' }),
    tempMin: day.tempMin,
    tempMax: day.tempMax,
    description: day.description,
    icon: day.icon,
  }));
});

const getUvColor = (uvIndex: number) => {
  if (uvIndex <= 2) return '#2e8a3e';
  if (uvIndex <= 5) return '#b8860b';
  if (uvIndex <= 7) return '#d9640b';
  if (uvIndex <= 10) return '#c62828';
  return '#7b1fa2';
};

const getUvLabel = (uvIndex: number) => {
  if (uvIndex <= 2) return 'Faible';
  if (uvIndex <= 5) return 'Modéré';
  if (uvIndex <= 7) return 'Élevé';
  if (uvIndex <= 10) return 'Très élevé';
  return 'Extrême';
};

const getTempColor = (temp: number) => {
  if (temp <= -10) return '#0033cc'; // Très froid
  if (temp <= 0) return '#3366ff'; // Froid
  if (temp <= 10) return '#33b3ff'; // Frais
  if (temp <= 20) return '#ffcc33'; // Doux / léger
  if (temp <= 30) return '#ff8c00'; // Chaud
  if (temp <= 40) return '#ff3300'; // Très chaud
  return '#cc0000'; // Canicule
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
  height: 100%;
  min-height: 0;
  padding: calc(14 * var(--px)) var(--space-4) calc(8 * var(--px));
  color: var(--c-text);
}

.weather-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.current-weather {
  display: flex;
  gap: calc(10 * var(--px));
}

.current-quick {
  flex-shrink: 0;
  width: calc(118 * var(--px));
  display: flex;
  flex-direction: column;
  gap: calc(2 * var(--px));
}

.current-main {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* Les nuages des icônes sont blancs : invisibles sur la carte blanche du mode jour. */
.weather-icon,
.forecast-icon,
.weather-icon :deep([fill="white"]),
.forecast-icon :deep([fill="white"]) {
  fill: var(--c-nuage);
}

.weather-icon {
  width: calc(40 * var(--px));
  height: calc(40 * var(--px));
}

.temp {
  font-size: var(--fs-xxl);
  font-weight: 700;
  line-height: 1;
}

.condition {
  font-size: var(--fs-md);
  font-weight: 700;
}

.time {
  font-size: calc(12 * var(--px));
  color: var(--c-muted);
}

.details {
  flex: 1;
  display: grid;
  grid-template-columns: auto auto;
  justify-content: space-between;
  align-content: start;
  gap: var(--space-1) calc(10 * var(--px));
  font-size: var(--fs-sm);
  color: var(--c-muted);
  white-space: nowrap;
}

.details b {
  color: var(--c-text);
  font-weight: 700;
}

.sun-item,
.uv {
  display: flex;
  align-items: center;
  gap: calc(6 * var(--px));
}

.sun-icon {
  width: calc(16 * var(--px));
  height: calc(16 * var(--px));
}

.uv-circle {
  width: calc(18 * var(--px));
  height: calc(18 * var(--px));
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: var(--fs-xs);
  font-weight: 800;
}

.forecast {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: calc(6 * var(--px));
  border-top: 1px solid var(--c-line);
  padding-top: calc(10 * var(--px));
}

.forecast-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(2 * var(--px));
  min-width: 0;
}

.day-name {
  font-size: calc(12 * var(--px));
  font-weight: 700;
  color: var(--c-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.forecast-icon {
  width: calc(26 * var(--px));
  height: calc(26 * var(--px));
}

.day-temp {
  font-size: var(--fs-md);
  font-weight: 800;
}

.day-temp span {
  color: var(--c-muted);
  font-weight: 600;
}

.day-condition {
  font-size: var(--fs-xs);
  color: var(--c-muted);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

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

.module-progress-bar {
  width: 100%;
  height: 3px;
  background: var(--c-line);
  border-radius: 2px;
  overflow: hidden;
  flex-shrink: 0;
  margin-top: auto;
}

.module-progress-fill {
  height: 100%;
  background: var(--c-accent);
  border-radius: 2px;
  transition: width 0.1s linear;
}
</style>