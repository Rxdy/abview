<template>
    <div class="weather-kiosk">
        <!-- Header : mise à jour -->
        <div class="weather-header">
            <div class="update">Mise à jour : {{ formatTime(lastUpdate) }}</div>
        </div>

        <!-- Météo actuelle -->
        <div class="current" v-if="isLoaded">
            <!-- Colonne gauche -->
            <div class="current-left">
                <div class="day-name-current">
                    {{ currentDay }}
                    {{ current.datetime?.slice(0, 5).replace(":", "h") }}
                </div>
                <div class="main-temp">
                    <component
                        :is="getIconComponent(current.icon)"
                        class="weather-icon"
                        :class="`icon-${current.icon}`"
                    />
                    <div class="temp-value">
                        {{ Math.round(current.temperature) }}°
                    </div>
                </div>
                <div class="sun-times">
                    <div class="sun-item">
                        <SunriseIcon class="sun-icon-svg" />
                        <span class="sun-time">{{
                            formatTime(current.sunrise)
                        }}</span>
                    </div>
                    <div class="sun-item">
                        <SunsetIcon class="sun-icon-svg" />
                        <span class="sun-time">{{
                            formatTime(current.sunset)
                        }}</span>
                    </div>
                </div>
            </div>

            <!-- Colonne droite -->
            <div class="right-col">
                <div class="detail">
                    Ressenti : {{ Math.round(current.feelsLike) }}°
                </div>
                <div class="detail">
                    Vent : {{ Math.round(current.windSpeed) }} km/h
                    <component :is="Wind" class="small-icon" />
                </div>
                <div class="detail">
                    Indice UV :
                    {{ current.uvIndex }}
                    <component :is="UVIcon" class="small-icon" />
                </div>
            </div>

            <div class="right-col">
                <div class="detail">
                    Humidité : {{ Math.round(current.humidity) }}%
                    <component :is="Humidity" class="small-icon" />
                </div>
                <div class="detail">
                    Visibilité : {{ current.visibility }} km
                </div>
                <div class="detail">
                    Couvert :
                    {{ Math.round(current.cloudCover) }}%
                    <component :is="CloudIcon" class="small-icon" />
                </div>
            </div>
        </div>

        <!-- Forecast -->
        <div class="forecast-compact" v-if="isLoaded">
            <div
                v-for="(day, index) in nextForecast"
                :key="index"
                class="forecast-day"
            >
                <div class="day-name">{{ formatDayUpper(day.date) }}</div>
                <component
                    :is="getIconComponent(day.icon)"
                    class="forecast-icon"
                    :class="`icon-${day.icon}`"
                />
                <div class="day-temp">
                    {{ Math.round(day.tempMin) }}° /
                    {{ Math.round(day.tempMax) }}°
                </div>
                <div class="day-rain" :class="{ low: day.precipProb < 50 }">
                    {{ Math.round(day.precipProb) }}%
                </div>
            </div>
        </div>

        <!-- États de chargement / erreur -->
        <div v-else-if="error" class="status error">{{ error }}</div>
        <div v-else class="status loading">...</div>

        <!-- Barre de progression du refresh -->
        <div class="progress-bar">
            <div class="progress-fill" :style="{ width: weatherProgress + '%' }"></div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { getApiUrl } from "../utils/dateUtils";
import RainIcon from "@/components/icons/RainIcon.vue";
import HeavyRain from "@/components/icons/HeavyRain.vue";
import CloudyIcon from "@/components/icons/CloudyIcon.vue";
import DropIcon from "@/components/icons/DropIcon.vue";
import WindIcon from "@/components/icons/WindIcon.vue";
import PartlyCloudyDayIcon from "@/components/icons/PartlyCloudyDayIcon.vue";
import ClearDayIcon from "@/components/icons/ClearDayIcon.vue";
import SunriseIcon from "@/components/icons/SunriseIcon.vue";
import SunsetIcon from "@/components/icons/SunsetIcon.vue";
import HailIcon from "@/components/icons/HailIcon.vue";
import SnowIcon from "@/components/icons/SnowIcon.vue";
import ThunderIcon from "@/components/icons/ThunderIcon.vue";

const emit = defineEmits(['sun-times']);

const current = ref({});
const forecast = ref([]);
const lastUpdate = ref("");
const isLoaded = ref(false);
const error = ref("");
let refreshTimer = null;
let dayTimer = null;
let progressTimer = null;
const lastFetchTime = ref(Date.now());
const currentTime = ref(Date.now());

// Mettre à jour currentTime chaque seconde pour la barre de progression
progressTimer = setInterval(() => {
    currentTime.value = Date.now();
}, 1000);

// Jour actuel (mis à jour toutes les minutes)
const currentDay = ref("");

const CloudIcon = CloudyIcon;
const UVIcon = ClearDayIcon;
const Humidity = DropIcon;
const Wind = WindIcon;

// Icônes météo
const getIconComponent = (icon) =>
    ({
        rain: RainIcon,
        "heavy-rain": HeavyRain,
        "partly-cloudy-day": PartlyCloudyDayIcon,
        cloudy: CloudyIcon,
        snow: SnowIcon,
        hail: HailIcon,
        thunder: ThunderIcon,
        thunderstorm: ThunderIcon,
        "clear-day": ClearDayIcon,
    }[icon] || CloudyIcon);

// Format jour abrégé
const formatDayUpper = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date)) return "";
    let day = new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(
        date
    );
    return day.charAt(0).toUpperCase() + day.slice(1);
};

// Format heure
const formatTime = (timeStr) => {
    if (!timeStr) return "-";
    const [hStr, mStr] = timeStr.split(":");
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m)) return "-";

    return `${h.toString().padStart(2, "0")}h${m
        .toString()
        .padStart(2, "0")}`;
};

// Mise à jour du jour actuel
const updateCurrentDay = () => {
    const today = new Date();
    const day = new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(today);
    currentDay.value = day.charAt(0).toUpperCase() + day.slice(1);
};

// Forecast sans le jour actuel (5 jours au lieu de 6)
const nextForecast = computed(() => forecast.value.slice(1, 6));

// Barre de progression (refresh toutes les 5 minutes)
const weatherProgress = computed(() => {
    const refreshInterval = 5 * 60 * 1000; // 5 minutes en ms
    const timeSinceLast = currentTime.value - lastFetchTime.value;
    const progress = (timeSinceLast / refreshInterval) * 100;
    return Math.min(progress, 100);
});

// Fetch météo
const fetchWeather = async () => {
    try {
        const response = await fetch(getApiUrl("/weather"));
        if (!response.ok) throw new Error("Erreur");
        const data = await response.json();
        const w = data.weather ?? {};

        current.value = w.current ?? {};
        forecast.value = Array.isArray(w.forecast) ? w.forecast : [];
        
        // Émettre les heures de lever/coucher du soleil pour le thème
        if (current.value.sunrise && current.value.sunset) {
            // S'assurer que le format est HH:MM (pas HH:MM:SS)
            const formatSunTime = (timeStr) => {
                if (!timeStr) return null;
                const parts = timeStr.split(':');
                return `${parts[0]}:${parts[1]}`;
            };
            
            const sunTimes = {
                sunrise: formatSunTime(current.value.sunrise),
                sunset: formatSunTime(current.value.sunset)
            };
            
            console.log('[Weather] Émission sun-times:', sunTimes);
            emit('sun-times', sunTimes);
        }
        
        // Parse lastUpdate as Date and format in local time
        if (w.lastUpdate) {
            const updateDate = new Date(w.lastUpdate);
            const hours = updateDate.getHours().toString().padStart(2, "0");
            const minutes = updateDate.getMinutes().toString().padStart(2, "0");
            const seconds = updateDate.getSeconds().toString().padStart(2, "0");
            lastUpdate.value = `${hours}:${minutes}:${seconds}`;
        } else {
            lastUpdate.value = "";
        }
        
        isLoaded.value = true;
        error.value = "";
        lastFetchTime.value = Date.now();
    } catch (err) {
        error.value = "Erreur de chargement météo";
        isLoaded.value = false;
    }
};

onMounted(() => {
    updateCurrentDay(); // Met à jour immédiatement
    fetchWeather();
    dayTimer = setInterval(updateCurrentDay, 60 * 1000); // Met à jour le jour toutes les minutes

    // Calculer le délai pour la prochaine mise à jour alignée sur les 5 minutes
    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const nextUpdateMinutes = Math.ceil((minutes + 1) / 5) * 5 % 60; // prochain multiple de 5
    const delayMs = ((nextUpdateMinutes - minutes) * 60 - seconds) * 1000;
    if (delayMs > 0) {
        setTimeout(() => {
            fetchWeather();
            refreshTimer = setInterval(fetchWeather, 5 * 60 * 1000);
        }, delayMs);
    } else {
        refreshTimer = setInterval(fetchWeather, 5 * 60 * 1000);
    }
});

onUnmounted(() => {
    if (refreshTimer) clearInterval(refreshTimer);
    if (dayTimer) clearInterval(dayTimer);
    if (progressTimer) clearInterval(progressTimer);
});
</script>

<style scoped>
.weather-kiosk {
    height: 100%;
    background: var(--module-bg);
    color: var(--color-text);
    padding: 0.5%;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    display: flex;
    flex-direction: column;
    font-size: 11px;
    min-height: 0;
}

.weather-header {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 8px;
    padding-bottom: 5px;
    border-bottom: 1px solid var(--task-border-color);
}

.update {
    font-size: 12px;
    color: var(--color-text);
    text-align: center;
    width: 100%;
}

/* Bloc météo actuelle */
.current {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    height: 35%;
    padding: 1% 8px;
    background: var(--module-card-bg);
    border-radius: 6px;
    margin: auto 0%;
    box-sizing: border-box;
    overflow: hidden;
}

.current-left {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    align-items: flex-start;
    margin: 0% 3%;
    justify-content: space-between;
}

.current-right {
    display: flex;
    gap: 15px;
    flex: 1;
    justify-content: space-between;
    margin: auto 3%;
}

.right-col {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 11px;
    flex: 1;
    align-items: center;
    justify-content: center;
}

.day-name-current {
    font-weight: bold;
    font-size: 1rem;
    color: var(--color-text); /* Accent */
}

.main-temp {
    display: flex;
    align-items: center;
    gap: 6px;
}

.weather-icon {
    width: 1rem;
    height: 1rem;
}

.temp-value {
    font-size: 0.75rem;
    font-weight: bold;
    color: var(--color-text);
}

.sun-times {
    display: flex;
    gap: 15px;
    margin-top: 0px;
}

.sun-item {
    display: flex;
    align-items: center;
    gap: 5px;
}

.sun-icon {
    font-size: 1rem; /* Taille augmentée pour les icônes de lever/coucher */
}

.sun-icon-svg {
    width: 1rem;
    height: 1rem;
    color: var(--color-text);
}

.sun-time {
    font-size: 0.75rem;
    font-weight: bold;
    color: var(--color-text); /* Lever/coucher soleil */
}

.detail {
    font-size: 15px;
    color: var(--color-text); /* reste lisible clair/sombre */
}

.gust {
    font-size: 10px;
    color: #888;
    margin-left: 3px;
}

/* Prévisions compactes */
.forecast-compact {
    display: flex;
    justify-content: space-between;
    gap: 4px;
    margin: auto 0%;
    height: 40%;
}

.forecast-day {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1%;
    background: var(--module-card-bg);
    border-radius: 5px;
    min-width: 45px;
    flex: 1;
}

.day-name {
    font-weight: bold;
    font-size: 10px;
    margin-bottom: 3px;
    color: var(--color-text);
}

.forecast-icon {
    width: 35px;
    height: 35px;
    margin: 2px 0;
}

.day-temp {
    font-size: 11px;
    font-weight: bold;
    color: var(--color-text);
    margin: 1px 0;
}

.day-rain {
    font-size: 11px;
    color: var(--planning-color); /* pluie (bleu clair) */
}
.day-rain.low {
    color: #888;
}

.small-icon {
    width: 14px;
    height: 14px;
    vertical-align: middle;
}

.progress-bar {
    width: 100%;
    height: 5px;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
    margin-top: 10px;
    overflow: hidden;
}
.progress-fill {
    height: 100%;
    background-color: var(--color-accent, #007bff);
    transition: width 1s linear;
    border-radius: 2px;
}

/* États de chargement / erreur */
.status {
    text-align: center;
    padding: 20px;
    font-size: 16px;
}
.error {
    color: #ff4444;
}
.loading {
    color: var(--planning-color);
}
</style>
