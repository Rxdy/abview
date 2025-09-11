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
                        <span class="sun-icon">🌅</span>
                        <span class="sun-time">{{
                            formatTime(current.sunrise)
                        }}</span>
                    </div>
                    <div class="sun-item">
                        <span class="sun-icon">🌇</span>
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
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import RainIcon from "@/components/icons/RainIcon.vue";
import HeavyRain from "@/components/icons/HeavyRain.vue";
import CloudyIcon from "@/components/icons/CloudyIcon.vue";
import DropIcon from "@/components/icons/DropIcon.vue";
import WindIcon from "@/components/icons/WindIcon.vue";
import PartlyCloudyDayIcon from "@/components/icons/PartlyCloudyDayIcon.vue";
import ClearDayIcon from "@/components/icons/ClearDayIcon.vue";
import SnowIcon from "@/components/icons/SnowIcon.vue";
import ThunderIcon from "@/components/icons/ThunderIcon.vue";

const current = ref({});
const forecast = ref([]);
const lastUpdate = ref("");
const isLoaded = ref(false);
const error = ref("");
let refreshTimer = null;

const CloudIcon = CloudyIcon;
const UVIcon = ClearDayIcon;
const Humidity = DropIcon;
const Wind = WindIcon;

// Icônes météo
const getIconComponent = (icon) =>
    ({
        rain: RainIcon,
        "partly-cloudy-day": PartlyCloudyDayIcon,
        cloudy: CloudyIcon,
        snow: SnowIcon,
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

    // Ajouter 2h pour le fuseau UTC+2
    const totalH = (h + 2) % 24;

    return `${totalH.toString().padStart(2, "0")}h${m
        .toString()
        .padStart(2, "0")}`;
};

// Jour actuel
const currentDay = computed(() => {
    const today = new Date();
    const day = new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(
        today
    );
    return day.charAt(0).toUpperCase() + day.slice(1);
});

// Forecast sans le jour actuel
const nextForecast = computed(() => forecast.value.slice(1, 7));

// Fetch météo
const fetchWeather = async () => {
    try {
        const response = await fetch("http://127.0.0.1:3333/weather");
        if (!response.ok) throw new Error("Erreur");
        const data = await response.json();
        const w = data.weather ?? {};

        current.value = w.current ?? {};
        forecast.value = Array.isArray(w.forecast) ? w.forecast : [];
        lastUpdate.value = w.lastUpdate?.split("T")[1]?.split(".")[0] ?? "";
        isLoaded.value = true;
        error.value = "";
    } catch (err) {
        error.value = "Erreur de chargement météo";
        isLoaded.value = false;
    }
};

onMounted(() => {
    fetchWeather();
    refreshTimer = setInterval(fetchWeather, 1 * 30 * 1000);
});

onUnmounted(() => {
    if (refreshTimer) clearInterval(refreshTimer);
});
</script>

<style scoped>
.weather-kiosk {
    background: var(--module-bg);
    color: var(--color-text);
    padding: 0.5%;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    height: 95%;
    display: flex;
    flex-direction: column;
    font-size: 11px;
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
    height: 32%;
    padding: 8px;
    background: var(--module-card-bg);
    border-radius: 6px;
    margin: auto 0%;
}

.current-left {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    align-items: flex-start;
    margin: auto 3%;
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
    font-size: 18px;
    color: var(--color-text); /* Accent */
}

.main-temp {
    display: flex;
    align-items: center;
    gap: 6px;
}

.weather-icon {
    width: 28px;
    height: 28px;
}

.temp-value {
    font-size: 22px;
    font-weight: bold;
    color: var(--color-text);
}

.sun-times {
    display: flex;
    gap: 15px;
    margin-top: 4px;
}

.sun-item {
    display: flex;
    align-items: center;
    gap: 5px;
}

.sun-icon {
    font-size: 18px; /* Taille augmentée pour les icônes de lever/coucher */
}

.sun-time {
    font-size: 14px;
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
    height: 45%;
}

.forecast-day {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3%;
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
