<template>
    <div
        class="event-card"
        :class="{
            planning: event.isPlanning && event.colorType === 'planning',
            'garde-alternee': event.colorType === 'garde-alternee',
            birthday: event.colorType === 'birthday',
            rugby: event.colorType === 'rugby',
            default: !event.isPlanning && event.colorType === 'event',
            jaune: event.colorType === 'jaune',
            noire: event.colorType === 'noire',
        }"
    >
        <div class="event-header">
            <div class="event-title">{{ event.title }}</div>
            <div class="event-time" v-if="event.startTime">
                {{ event.startTime
                }}<span v-if="event.endTime"> - {{ event.endTime }}</span>
            </div>
        </div>
        <div
            v-if="event.colorType === 'jaune' || event.colorType === 'noire'"
            class="color-badge"
            :class="event.colorType"
        >
            {{ event.colorType === "jaune" ? "Jaune" : "Noire" }}
        </div>
        <div class="event-shift" v-if="event.shift">{{ event.shift }}</div>
        <div
            class="event-description"
            v-if="event.description"
            v-html="truncateHtml(event.description, 200)"
        ></div>
        <div v-if="event.location" class="event-location">
            📍 {{ shortLocation(event.location) }}
        </div>
    </div>
</template>

<script setup>
import { truncateHtml, shortLocation } from "../utils/textUtils";

defineProps({
    event: {
        type: Object,
        required: true,
    },
});
</script>

<style scoped>
.event-card {
    background-color: var(--module-card-bg, #ccc);
    padding: 0.4rem;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    color: var(--color-text);
}
.event-card.planning {
    border-left: 4px solid var(--planning-color, #2196f3);
}
.event-card.garde-alternee {
    border-left: 4px solid var(--garde-alternee-color, #4682b4);
}
.event-card.default {
    border-left: 4px solid var(--event-color, #4caf50);
}
.event-card.birthday {
    border-left: 4px solid var(--birthday-color, #e91e63);
}
.event-card.rugby {
    border-left: 4px solid var(--rugby-color, #f28c38);
}
.event-card.jaune {
    border-left: 4px solid #ffeb3b; /* Jaune */
}
.event-card.noire {
    border-left: 4px solid #424242; /* Noire */
}
.event-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
}
.event-title {
    font-weight: bold;
    font-size: 0.8rem;
    flex: 1;
    word-break: break-word;
}
.color-badge {
    font-size: 0.8rem;
    color: var(--planning-color, #2196f3); /* Même couleur que event-shift */
    background-color: var(--module-bg); /* Même fond que event-shift */
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    margin-top: 0.25rem;
    display: inline-block;
}
.color-badge.jaune {
    background-color: #ffeb3b; /* Fond jaune */
    color: #000; /* Texte noir pour contraste */
}
.color-badge.noire {
    background-color: #424242; /* Fond gris foncé */
    color: #fff; /* Texte blanc pour contraste */
}
.event-time {
    font-size: 0.7rem;
    color: var(--color-text);
    white-space: nowrap;
    font-weight: bold;
}
.event-shift {
    font-size: 0.8rem;
    color: var(--planning-color, #2196f3);
    background-color: var(--module-bg);
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    margin-top: 0.25rem;
    display: inline-block;
}
.event-description {
    font-size: 0.8rem;
    margin-top: 0.25rem;
}
.event-location {
    font-size: 0.85rem;
    margin-top: 0.25rem;
}
</style>
