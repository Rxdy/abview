<template>
    <!-- Écran de chargement -->
    <LoadingScreen @loading-complete="onLoadingComplete" />

    <!-- Écran noir quand l'écran doit être éteint (affiché même pendant le chargement) -->
    <div v-if="screenOff" class="screen-off" @click="wakeUpScreen"></div>

    <!-- Application principale (masquée pendant le chargement) -->
    <div v-if="!isLoading && !screenOff" class="app-content">

        <HeaderBar />
        <main class="main-content">
            <!-- Ligne du haut : calendrier -->
            <div class="top-row">
                <CalendarModule class="calendar-module" />
            </div>

            <!-- Ligne du bas : météo (gauche) + tâches (droite) -->
            <div class="bottom-row">
                <WeatherModule class="weather-module" @sun-times="updateDarkMode" />
                <TasksBoard class="tasks-board" />
            </div>
        </main>
        <FooterBar />
    </div>
</template>

<script>
import HeaderBar from "./components/HeaderBar.vue";
import FooterBar from "./components/FooterBar.vue";
import WeatherModule from "./components/WeatherModule.vue";
import CalendarModule from "./components/CalendarWeekModule.vue";
import TasksBoard from "./components/tasksModule.vue";
import LoadingScreen from "./components/LoadingScreen.vue";
import logger from "./utils/logger.js";

export default {
    name: "App",
    components: {
        HeaderBar,
        FooterBar,
        WeatherModule,
        CalendarModule,
        TasksBoard,
        LoadingScreen,
    },
    data() {
        return {
            isLoading: true, // Commence en chargement
            sunTimes: {
                sunrise: "06:00",
                sunset: "18:00",
            },
            themeTimeout: null,
            // Configuration extinction écran (heures en format 24h) - via variables d'environnement
            screenOffStart: parseInt(import.meta.env.VITE_SCREEN_OFF_START) || 23,
            screenOffStartMinutes: parseInt(import.meta.env.VITE_SCREEN_OFF_START_MINUTES) || 0,
            screenOffEnd: parseInt(import.meta.env.VITE_SCREEN_OFF_END) || 7,
            screenOffEndMinutes: parseInt(import.meta.env.VITE_SCREEN_OFF_END_MINUTES) || 0,
            screenOff: false,
            screenCheckInterval: null,
            themeCheckInterval: null,
            screenSaverTimeout: null,
            screenSaverDelay: 5 * 60 * 1000, // 5 minutes d'inactivité
            lastActivity: Date.now(),
            manualWakeUp: false, // Si l'utilisateur a cliqué pour rallumer
        };
    },
    created() {
        // Vérifier immédiatement si l'écran doit être éteint au démarrage
        this.checkScreenOff();
    },
    mounted() {
        logger.system.info('Application démarrée');
        this.setViewportHeight();
        window.addEventListener("resize", this.setViewportHeight);
        this.applyDayNightMode();
        // Vérifier le thème toutes les minutes (sécurité en plus du timeout)
        this.themeCheckInterval = setInterval(() => this.applyDayNightMode(), 60000);
        // Vérifier l'état de l'écran toutes les minutes
        this.checkScreenOff();
        this.screenCheckInterval = setInterval(() => this.checkScreenOff(), 60000);
        
        // Écouteurs pour détecter l'activité
        this.setupActivityListeners();
        // Démarrer la veille écran
        this.startScreenSaver();
    },
    beforeUnmount() {
        window.removeEventListener("resize", this.setViewportHeight);
        if (this.themeTimeout) clearTimeout(this.themeTimeout);
        if (this.themeCheckInterval) clearInterval(this.themeCheckInterval);
        if (this.screenCheckInterval) clearInterval(this.screenCheckInterval);
    },
    methods: {
        onLoadingComplete() {
            this.isLoading = false;
            logger.system.info('Écran de chargement terminé, application prête');
        },
        setViewportHeight() {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty("--vh", `${vh}px`);
        },
        updateDarkMode(sunTimes) {
            console.log('[Theme] Mise à jour heures soleil:', sunTimes);
            this.sunTimes = {
                sunrise: sunTimes.sunrise || this.sunTimes.sunrise,
                sunset: sunTimes.sunset || this.sunTimes.sunset,
            };
            this.applyDayNightMode();
        },
        applyDayNightMode() {
            const now = new Date();
            const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

            const [sunriseHour, sunriseMinute] = this.sunTimes.sunrise
                .split(":")
                .map(Number);
            const [sunsetHour, sunsetMinute] = this.sunTimes.sunset
                .split(":")
                .map(Number);
            const sunriseTimeInMinutes = sunriseHour * 60 + sunriseMinute;
            const sunsetTimeInMinutes = sunsetHour * 60 + sunsetMinute;

            console.log(`[Theme] Vérification thème - Current: ${now.getHours()}:${now.getMinutes()} (${currentTimeInMinutes}min), Sunrise: ${this.sunTimes.sunrise} (${sunriseTimeInMinutes}min), Sunset: ${this.sunTimes.sunset} (${sunsetTimeInMinutes}min)`);

            const wasDark = document.body.classList.contains("dark-mode");
            if (
                currentTimeInMinutes < sunriseTimeInMinutes ||
                currentTimeInMinutes >= sunsetTimeInMinutes
            ) {
                document.body.classList.add("dark-mode");
                if (!wasDark) {
                    logger.theme.info('Thème changé: mode nuit activé', {
                        sunrise: this.sunTimes.sunrise,
                        sunset: this.sunTimes.sunset,
                        currentTime: now.toLocaleTimeString()
                    });
                }
            } else {
                document.body.classList.remove("dark-mode");
                if (wasDark) {
                    logger.theme.info('Thème changé: mode jour activé', {
                        sunrise: this.sunTimes.sunrise,
                        sunset: this.sunTimes.sunset,
                        currentTime: now.toLocaleTimeString()
                    });
                }
            }

            let nextChangeInMinutes;
            if (currentTimeInMinutes < sunriseTimeInMinutes) {
                nextChangeInMinutes =
                    sunriseTimeInMinutes - currentTimeInMinutes;
            } else if (currentTimeInMinutes < sunsetTimeInMinutes) {
                nextChangeInMinutes =
                    sunsetTimeInMinutes - currentTimeInMinutes;
            } else {
                nextChangeInMinutes =
                    24 * 60 - currentTimeInMinutes + sunriseTimeInMinutes;
            }

            if (this.themeTimeout) clearTimeout(this.themeTimeout);
            this.themeTimeout = setTimeout(
                this.applyDayNightMode,
                nextChangeInMinutes * 60 * 1000
            );
        },
        checkScreenOff() {
            const now = new Date();
            const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
            const startTimeInMinutes = this.screenOffStart * 60 + this.screenOffStartMinutes;
            const endTimeInMinutes = this.screenOffEnd * 60 + this.screenOffEndMinutes;
            
            logger.system.info('Vérification extinction écran programmée', {
                currentTime: `${now.getHours()}:${now.getMinutes()}`,
                currentMinutes: currentTimeInMinutes,
                offStart: `${this.screenOffStart}:${this.screenOffStartMinutes}`,
                offEnd: `${this.screenOffEnd}:${this.screenOffEndMinutes}`,
                startMinutes: startTimeInMinutes,
                endMinutes: endTimeInMinutes
            });
            
            // Si l'utilisateur a manuellement rallumé, ne pas rééteindre pendant 5 minutes
            if (this.manualWakeUp) {
                logger.system.info('Réveil manuel actif, extinction automatique ignorée');
                return;
            }
            
            // Vérifier si on est dans la plage d'extinction
            let shouldBeOff = false;
            if (startTimeInMinutes > endTimeInMinutes) {
                // Plage qui traverse minuit (ex: 23h -> 7h)
                shouldBeOff = currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes < endTimeInMinutes;
            } else {
                // Plage normale (ex: 14h00 -> 15h10)
                shouldBeOff = currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;
            }
            
            logger.system.info(`Écran devrait être éteint: ${shouldBeOff}`);
            this.screenOff = shouldBeOff;
        },
        wakeUpScreen() {
            logger.system.info('Écran réveillé manuellement par l\'utilisateur');
            // Permet de rallumer temporairement l'écran en cliquant
            this.screenOff = false;
            this.manualWakeUp = true;
            this.lastActivity = Date.now();
            // Réactiver l'extinction automatique après 5 minutes
            setTimeout(() => {
                this.manualWakeUp = false;
                this.checkScreenOff();
            }, 5 * 60 * 1000);
        },
        setupActivityListeners() {
            // Écouteurs pour détecter toute activité utilisateur
            const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
            events.forEach(event => {
                document.addEventListener(event, this.onUserActivity, true);
            });
        },
        onUserActivity() {
            this.lastActivity = Date.now();
            // Si l'écran était en veille, le réveiller
            if (this.screenOff) {
                logger.system.info('Activité utilisateur détectée, réveil de l\'écran');
                this.wakeUpScreen();
            }
        },
        startScreenSaver() {
            this.screenSaverTimeout = setTimeout(() => {
                if (!this.manualWakeUp && !this.screenOff) {
                    logger.system.info('Veille écran activée après inactivité', {
                        delay: this.screenSaverDelay / 1000 + 's'
                    });
                    this.screenOff = true;
                }
            }, this.screenSaverDelay);
        },
        resetScreenSaver() {
            if (this.screenSaverTimeout) {
                clearTimeout(this.screenSaverTimeout);
            }
            this.startScreenSaver();
        },
    },
};
</script>

<style>
/* Écran noir pour extinction automatique */
.screen-off {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: #000;
    z-index: 9999;
    cursor: pointer;
}

:root {
    --vh: 1vh;

    --color-bg: #f1f5f9;
    --color-text: #181818;

    --module-bg: #e0e0e0;
    --module-header-bg: #999;
    --module-header-text: #fff;
    --module-card-bg: #ccc;
    --task-border-color: #666;
    --checkbox-bg: #fff;
    --checkbox-border: #000;
    --checkbox-bg-checked: #4caf50;
    --checkbox-border-checked: #4caf50;
    --planning-color: #2196f3;
    --event-color: #4caf50;
    --birthday-color: #e91e63;
    --garde-alternee-color: #7046b4;
    --rugby-color: #f28c38;
}

/* Masquer complètement le curseur de souris */
* {
    cursor: none !important;
}

body.dark-mode {
    --color-bg: #181818;
    --color-text: #f1f5f9;

    --module-bg: #212121;
    --module-header-bg: #303030;
    --module-header-text: #fff;
    --module-card-bg: #303030;
    --task-border-color-dark: #999;
    --checkbox-bg-dark: #333;
    --checkbox-border-dark: #fff;
    --checkbox-bg-checked-dark: #4caf50;
    --checkbox-border-checked-dark: #4caf50;

    --planning-color: #2196f3;
    --event-color: #4caf50;
    --birthday-color: #e91e63;
    --garde-alternee-color: #7046b4;
    --rugby-color: #f28c38;
}

html,
body,
#app {
    margin: 0;
    height: 100%;
    background-color: var(--color-bg);
    color: var(--color-text);
    transition: background-color 0.3s ease, color 0.3s ease;
    box-sizing: border-box;
}

header {
    height: calc(var(--vh) * 4);
    box-sizing: border-box;
}

footer {
    height: calc(var(--vh) * 4);
    box-sizing: border-box;
}

.main-content {
    height: calc(var(--vh) * 92);
    overflow: hidden;
    padding: 0.85% 1%;
    display: flex;
    flex-direction: column;
    gap: 1%;
    box-sizing: border-box;
}

/* Ligne du haut : calendrier */
.top-row {
    display: flex;
    width: 100%;
    height: 60%;
}

.top-row > .calendar-module {
    flex: 1;
    max-height: 95%;
    overflow: hidden;
}

/* Ligne du bas : météo + tâches */
.bottom-row {
    display: flex;
    gap: 1%;
    width: 100%;
    height: 35vh;
}

/* Météo en bas à gauche */
.bottom-row > .weather-module {
    flex: 0 0 32%;
    max-width: 35%;
    overflow: hidden;
}

/* Tâches à droite */
.bottom-row > .tasks-board {
    flex: 1;
    overflow-y: auto;
    padding: 0.5%;
}
</style>
