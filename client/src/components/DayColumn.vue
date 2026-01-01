```vue
<template>
    <div class="day-column">
        <div class="day-header" :class="{ today: isToday }">
            {{ formatDayName(day.date) }} {{ formatDate(day.date) }}
        </div>
        <div class="events">
            <EventCard
                v-for="event in day.events"
                :key="event.id"
                :event="event"
            />
            <div v-if="!day.events.length" class="no-event">—</div>
        </div>
    </div>
</template>

<script setup>
import EventCard from "./EventCard.vue";
import { formatDayName, formatDate } from "../utils/dateUtils";

defineProps({
    day: {
        type: Object,
        required: true,
    },
    isToday: {
        type: Boolean,
        required: true,
    },
});
</script>

<style scoped>
.day-column {
    flex: 1;
    border-right: 1px solid #4b5563;
    padding: 0.5%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
}
.day-column:last-child {
    border-right: none;
}
.day-header {
    text-align: center;
    margin-bottom: 5%;
    color: var(--color-text);
    font-weight: bold;
    font-size: clamp(0.8rem, 1.6vh, 1.3rem);
}
.day-header.today {
    background: #334155;
    color: white;
    border-radius: 6px;
    padding: 0.2rem 0;
}
.events {
    display: flex;
    flex-direction: column;
    gap: clamp(0.3rem, 0.8vh, 0.6rem);
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    height: 400px;
}
.events::-webkit-scrollbar {
    display: none;
}
.no-event {
    text-align: center;
    font-style: italic;
    color: var(--color-text);
    font-size: clamp(0.8rem, 1.5vh, 1.2rem);
}
</style>
```
