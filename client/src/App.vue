<template>
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
</template>

<script>
import HeaderBar from "./components/HeaderBar.vue";
import FooterBar from "./components/FooterBar.vue";
import WeatherModule from "./components/WeatherModule.vue";
import CalendarModule from "./components/CalendarWeekModule.vue";
import TasksBoard from "./components/tasksModule.vue";

export default {
    name: "App",
    components: {
        HeaderBar,
        FooterBar,
        WeatherModule,
        CalendarModule,
        TasksBoard,
    },
    data() {
        return {
            sunTimes: {
                sunrise: "06:00",
                sunset: "18:00",
            },
            themeTimeout: null,
        };
    },
    mounted() {
        this.setViewportHeight();
        window.addEventListener("resize", this.setViewportHeight);
        this.applyDayNightMode();
    },
    beforeUnmount() {
        window.removeEventListener("resize", this.setViewportHeight);
        if (this.themeTimeout) clearTimeout(this.themeTimeout);
    },
    methods: {
        setViewportHeight() {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty("--vh", `${vh}px`);
        },
        updateDarkMode(sunTimes) {
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

            if (
                currentTimeInMinutes < sunriseTimeInMinutes ||
                currentTimeInMinutes >= sunsetTimeInMinutes
            ) {
                document.body.classList.add("dark-mode");
            } else {
                document.body.classList.remove("dark-mode");
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
    },
};
</script>

<style>
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
    flex: 0 0 45%;
    max-width: 50%;
    overflow: hidden;
}

/* Tâches à droite */
.bottom-row > .tasks-board {
    flex: 1;
    overflow-y: auto;
    padding: 0.5%;
}
</style>
