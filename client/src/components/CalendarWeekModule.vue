```vue
<template>
    <div class="calendar-module">
        <!-- Header : mise à jour -->
        <div v-if="lastUpdate" class="calendar-header">
            <div class="last-update">
                Mise à jour : {{ formatLastUpdate(lastUpdate) }}
            </div>
        </div>
        <!-- Message d'erreur si aucun événement -->
        <div v-if="fetchError" class="error-message">
            Erreur lors du chargement des événements. Vérifiez l'API ou
            réessayez.
        </div>
        <div class="calendar-week">
            <DayColumn
                v-for="day in next9Days"
                :key="day.date"
                :day="day"
                :is-today="isToday(day.date)"
                ref="dayColumns"
            />
        </div>

        <NotificationModal
            v-if="notificationModal.show"
            :event="notificationModal.currentEvent"
            :type="notificationModal.type"
            @close="closeNotificationModal"
        />
    </div>
</template>

<script setup>
import { ref } from "vue";
import DayColumn from "./DayColumn.vue";
import NotificationModal from "./NotificationModal.vue";
import { useCalendar } from "../composables/useCalendar";
import { useAutoScroll } from "../composables/useAutoScroll";
import { formatLastUpdate, isToday } from "../utils/dateUtils";

// Données réactives
const dayColumns = ref([]);

const {
    events,
    planningData,
    fetchError,
    lastUpdate,
    notificationModal,
    notificationQueue,
    isProcessingQueue,
    notifiedEventsOneHour,
    notifiedEventsThirtyMin,
    next9Days,
    fetchData,
    checkUpcomingEvents,
    processNotificationQueue,
    testNotification,
} = useCalendar();

// Expose testNotification globally for console testing
if (typeof window !== 'undefined') {
    window.testNotification = testNotification;
}

const { initAutoScroll, equalizeEventHeights } = useAutoScroll(dayColumns);

import { onMounted, onBeforeUnmount } from "vue";

onMounted(() => {
    console.log("Composant Calendar monté");
    fetchData()
        .then(() => {
            console.log("fetchData initial terminé avec succès");
            const fetchInterval = setInterval(() => {
                console.log("Exécution périodique de fetchData");
                fetchData().catch((err) => {
                    console.error("Erreur lors du fetchData périodique :", err);
                    fetchError.value = true;
                });
            }, 60 * 1000);
            const checkInterval = setInterval(() => {
                console.log("Vérification des événements à venir");
                checkUpcomingEvents();
            }, 10 * 1000);
            checkUpcomingEvents();
            equalizeEventHeights();
            initAutoScroll();
            console.log("Intervalles configurés avec succès");
        })
        .catch((err) => {
            console.error("Erreur lors du fetchData initial :", err);
            fetchError.value = true;
            setTimeout(() => {
                console.log(
                    "Tentative de récupération via fetchData après erreur"
                );
                fetchData();
            }, 1000);
        });
});

onBeforeUnmount(() => {
    dayColumns.value.forEach((col) => {
        const container = col.querySelector(".events");
        if (container) container.scrollTop = 0;
    });
});

const closeNotificationModal = () => {
    notificationModal.value.show = false;
    isProcessingQueue.value = false;
    setTimeout(() => {
        processNotificationQueue();
    }, 2000);
};
</script>

<style scoped>
.calendar-module {
    flex: 1;
    background: var(--module-bg, #e0e0e0);
    color: var(--color-text);
    padding: 0.5%;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    height: 95%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
.calendar-header {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 8px;
    padding-bottom: 5px;
    border-bottom: 1px solid var(--task-border-color);
    background: var(--module-bg, #e0e0e0);
}
.last-update {
    font-size: 12px;
    color: var(--color-text);
    text-align: center;
    width: 100%;
}
.calendar-week {
    display: flex;
    flex-direction: row;
    width: 100%;
    background-color: var(--module-bg, #e0e0e0);
    color: var(--color-text);
    border-radius: 10px;
    padding: 0.5rem;
    box-sizing: border-box;
    height: 94%;
}
.error-message {
    color: red;
    text-align: center;
    margin: 10px 0;
    font-size: 1rem;
}
</style>
```
