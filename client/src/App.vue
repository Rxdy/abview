<template>
    <!-- Écran de chargement -->
    <LoadingScreen @loading-complete="onLoadingComplete" />

    <!-- Écran noir quand l'écran doit être éteint (affiché même pendant le chargement) -->
    <div v-if="screenOff" class="screen-off" @click="wakeUpScreen"></div>

    <!-- Application principale (masquée pendant le chargement) -->
    <div v-if="!isLoading && !screenOff" :class="themeClass" class="app-content">

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
    computed: {
        themeClass() {
            return document.body.classList.contains('dark-mode') ? '' : 'light-theme';
        }
    },
    created() {
        // Vérifier immédiatement si l'écran doit être éteint au démarrage
        this.checkScreenOff();
    },
    mounted() {
        console.log('🔥🔥🔥 APP MOUNTED - DEBUT 🔥🔥🔥');
        console.log('isLoading:', this.isLoading);
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
        
        // DEBUG: Raccourci clavier pour logs
        document.addEventListener('keydown', (e) => {
            if (e.key === 'l' && e.ctrlKey) {
                e.preventDefault();
                console.log('🔥 LOGS MANUELS déclenchés par Ctrl+L');
                this.logAllDimensions();
            }
        });
        
        // DEBUG: Forcer les logs après montage
        console.log('⏰ Configuration du setTimeout pour logs dans 2s');
        setTimeout(() => {
            console.log('⏰⏰⏰ TIMEOUT DECLENCHE - Appel de logAllDimensions');
            console.log('isLoading dans timeout:', this.isLoading);
            this.logAllDimensions();
        }, 2000);
        console.log('✅ setTimeout configuré, fin de mounted()');
    },
    beforeUnmount() {
        window.removeEventListener("resize", this.setViewportHeight);
        if (this.themeTimeout) clearTimeout(this.themeTimeout);
        if (this.themeCheckInterval) clearInterval(this.themeCheckInterval);
        if (this.screenCheckInterval) clearInterval(this.screenCheckInterval);
    },
    methods: {
        onLoadingComplete() {
            console.log('🎉🎉🎉 onLoadingComplete APPELE 🎉🎉🎉');
            this.isLoading = false;
            console.log('isLoading mis à false');
            logger.system.info('Écran de chargement terminé, application prête');
            
            // DEBUG: Log des dimensions APRÈS chargement complet
            console.log('⏰ Configuration setTimeout dans onLoadingComplete');
            setTimeout(() => {
                console.log('⏰⏰⏰ TIMEOUT onLoadingComplete DECLENCHE');
                this.logAllDimensions();
            }, 1000);
        },
        setViewportHeight() {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty("--vh", `${vh}px`);
        },
        updateDarkMode(sunTimes) {
            // Theme sun times updated
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

            // Theme check completed

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
        logAllDimensions() {
            console.log('═══════════════════════════════════════════════════════');
            console.log('🚀🚀🚀 DEBUT DE logAllDimensions() 🚀🚀🚀');
            console.log('═══════════════════════════════════════════════════════');
            console.log('📐 DEBUG DIMENSIONS - ANALYSE COMPLÈTE');
            console.log('═══════════════════════════════════════════════════════');
            
            // Taille de l'écran
            const screenHeight = window.innerHeight;
            const screenWidth = window.innerWidth;
            console.log('🖥️  ÉCRAN:');
            console.log(`   Hauteur: ${screenHeight}px`);
            console.log(`   Largeur: ${screenWidth}px`);
            console.log('');
            
            // App container
            const app = document.querySelector('#app');
            if (app) {
                const appRect = app.getBoundingClientRect();
                console.log('📦 APP CONTAINER:');
                console.log(`   Hauteur: ${appRect.height}px`);
                console.log(`   Computed height: ${window.getComputedStyle(app).height}`);
                console.log(`   Débordement: ${appRect.height > screenHeight ? '❌ OUI (' + (appRect.height - screenHeight) + 'px)' : '✅ NON'}`);
                console.log('');
            }
            
            // Header
            const header = document.querySelector('header');
            if (header) {
                const headerRect = header.getBoundingClientRect();
                console.log('📌 HEADER:');
                console.log(`   Hauteur: ${headerRect.height}px`);
                console.log(`   Computed height: ${window.getComputedStyle(header).height}`);
                console.log(`   % écran: ${((headerRect.height / screenHeight) * 100).toFixed(2)}%`);
                console.log('');
            }
            
            // Main
            const main = document.querySelector('.main-content');
            if (main) {
                const mainRect = main.getBoundingClientRect();
                console.log('📄 MAIN CONTENT:');
                console.log(`   Hauteur: ${mainRect.height}px`);
                console.log(`   Computed height: ${window.getComputedStyle(main).height}`);
                console.log(`   % écran: ${((mainRect.height / screenHeight) * 100).toFixed(2)}%`);
                console.log(`   ScrollHeight: ${main.scrollHeight}px`);
                console.log(`   Débordement interne: ${main.scrollHeight > mainRect.height ? '❌ OUI (' + (main.scrollHeight - mainRect.height) + 'px)' : '✅ NON'}`);
                console.log('');
            }
            
            // Footer
            const footer = document.querySelector('footer');
            if (footer) {
                const footerRect = footer.getBoundingClientRect();
                console.log('📍 FOOTER:');
                console.log(`   Hauteur: ${footerRect.height}px`);
                console.log(`   Computed height: ${window.getComputedStyle(footer).height}`);
                console.log(`   % écran: ${((footerRect.height / screenHeight) * 100).toFixed(2)}%`);
                console.log(`   Position top: ${footerRect.top}px`);
                console.log(`   Visible: ${footerRect.top < screenHeight ? '✅ OUI' : '❌ NON (hors écran de ' + (footerRect.top - screenHeight) + 'px)'}`);
                console.log('');
            }
            
            // Top row (calendrier)
            const topRow = document.querySelector('.top-row');
            if (topRow) {
                const topRect = topRow.getBoundingClientRect();
                console.log('📅 TOP ROW (Calendrier):');
                console.log(`   Hauteur: ${topRect.height}px`);
                console.log(`   Computed height: ${window.getComputedStyle(topRow).height}`);
                console.log('');
            }
            
            // Calendar module
            const calendar = document.querySelector('.calendar-module');
            if (calendar) {
                const calRect = calendar.getBoundingClientRect();
                console.log('📆 CALENDAR MODULE:');
                console.log(`   Hauteur: ${calRect.height}px`);
                console.log(`   Computed height: ${window.getComputedStyle(calendar).height}`);
                console.log(`   ScrollHeight: ${calendar.scrollHeight}px`);
                console.log(`   Débordement: ${calendar.scrollHeight > calRect.height ? '⚠️  OUI (' + (calendar.scrollHeight - calRect.height) + 'px)' : '✅ NON'}`);
                console.log('');
            }
            
            // Bottom row
            const bottomRow = document.querySelector('.bottom-row');
            if (bottomRow) {
                const bottomRect = bottomRow.getBoundingClientRect();
                console.log('📊 BOTTOM ROW (Météo + Tâches):');
                console.log(`   Hauteur: ${bottomRect.height}px`);
                console.log(`   Computed height: ${window.getComputedStyle(bottomRow).height}`);
                console.log('');
            }
            
            // Weather module
            const weather = document.querySelector('.weather-module');
            if (weather) {
                const weatherRect = weather.getBoundingClientRect();
                console.log('🌤️  WEATHER MODULE:');
                console.log(`   Hauteur: ${weatherRect.height}px`);
                console.log(`   Computed height: ${window.getComputedStyle(weather).height}`);
                console.log(`   ScrollHeight: ${weather.scrollHeight}px`);
                console.log(`   Débordement: ${weather.scrollHeight > weatherRect.height ? '⚠️  OUI (' + (weather.scrollHeight - weatherRect.height) + 'px)' : '✅ NON'}`);
                console.log('');
            }
            
            // Tasks module
            const tasks = document.querySelector('.tasks-board');
            if (tasks) {
                const tasksRect = tasks.getBoundingClientRect();
                console.log('📝 TASKS MODULE:');
                console.log(`   Hauteur: ${tasksRect.height}px`);
                console.log(`   Computed height: ${window.getComputedStyle(tasks).height}`);
                console.log(`   ScrollHeight: ${tasks.scrollHeight}px`);
                console.log(`   Débordement: ${tasks.scrollHeight > tasksRect.height ? '⚠️  OUI (' + (tasks.scrollHeight - tasksRect.height) + 'px)' : '✅ NON'}`);
                console.log('');
            }
            
            // Calcul total
            console.log('═══════════════════════════════════════════════════════');
            console.log('🧮 CALCUL TOTAL:');
            const headerH = header ? header.getBoundingClientRect().height : 0;
            const mainH = main ? main.getBoundingClientRect().height : 0;
            const footerH = footer ? footer.getBoundingClientRect().height : 0;
            const total = headerH + mainH + footerH;
            console.log(`   Header: ${headerH.toFixed(2)}px`);
            console.log(`   Main: ${mainH.toFixed(2)}px`);
            console.log(`   Footer: ${footerH.toFixed(2)}px`);
            console.log(`   ─────────────────────`);
            console.log(`   TOTAL: ${total.toFixed(2)}px`);
            console.log(`   Écran: ${screenHeight}px`);
            console.log(`   Différence: ${(total - screenHeight).toFixed(2)}px ${total > screenHeight ? '❌ DÉBORDEMENT' : '✅ OK'}`);
            console.log('═══════════════════════════════════════════════════════');
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
    height: 100vh;
    background-color: var(--color-bg);
    color: var(--color-text);
    transition: background-color 0.3s ease, color 0.3s ease;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
}

header {
    height: 47px !important;
    max-height: 47px !important;
    min-height: 47px !important;
    flex: none !important;
    box-sizing: border-box;
}

.main-content {
    height: 848px !important;
    max-height: 848px !important;
    min-height: 848px !important;
    flex: none !important;
    overflow: hidden;
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-sizing: border-box;
}

footer {
    height: 47px !important;
    max-height: 47px !important;
    min-height: 47px !important;
    flex: none !important;
    box-sizing: border-box;
}

/* Ligne du haut : calendrier */
.top-row {
    display: flex;
    width: 100%;
    height: 420px !important;
    max-height: 420px !important;
    min-height: 420px !important;
    flex: none !important;
}

.top-row > .calendar-module {
    height: 100%;
    overflow: hidden;
}

/* Ligne du bas : météo + tâches */
.bottom-row {
    display: flex;
    gap: 8px;
    width: 100%;
    height: 416px !important;
    max-height: 416px !important;
    min-height: 416px !important;
    flex: none !important;
}

/* Météo en bas à gauche */
.bottom-row > .weather-module {
    height: 100%;
    overflow: hidden;
}

/* Tâches à droite */
.bottom-row > .tasks-board {
    height: 100%;
    overflow: hidden;
}
</style>
