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
        <!-- Ligne 1: Titre + Shift (Matin/Soir/Nuit) ou Titre + Badge couleur pour poubelle -->
        <div class="event-header">
            <div class="event-title">{{ event.title }}</div>
            <div class="event-shift" v-if="event.shift && !(event.colorType === 'jaune' || event.colorType === 'noire')">{{ event.shift }}</div>
            <div class="color-badge" v-if="event.colorType === 'jaune' || event.colorType === 'noire'" :class="event.colorType">
                {{ event.colorType === "jaune" ? "Jaune" : "Noire" }}
            </div>
        </div>
        
        <!-- Ligne 2: Heure -->
        <div class="event-time" v-if="event.startTime">
            {{ event.startTime }}<span v-if="event.endTime"> - {{ event.endTime }}</span>
        </div>
        
        <!-- Ligne 3: Description -->
        <div
            class="event-description"
            v-if="event.description"
            v-html="truncateHtml(event.description, 200)"
        ></div>
        
        <!-- Ligne 4: Location -->
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
    padding: clamp(0.3rem, 0.8vh, 0.6rem);
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
    align-items: center;
    gap: 0.5rem;
}
.event-title {
    font-weight: bold;
    font-size: clamp(0.9rem, 1.8vh, 1.4rem);
    flex: 1;
    word-break: break-word;
}
.event-shift {
    font-size: clamp(0.8rem, 1.5vh, 1.2rem);
    color: var(--planning-color, #2196f3);
    background-color: var(--module-bg);
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-weight: bold;
    white-space: nowrap;
}
.event-time {
    font-size: clamp(0.8rem, 1.6vh, 1.3rem);
    color: var(--color-text);
    font-weight: bold;
    margin-top: 0.15rem;
}
.color-badge {
    font-size: clamp(0.8rem, 1.5vh, 1.2rem);
    color: var(--planning-color, #2196f3);
    background-color: var(--module-bg);
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    margin-top: 0.25rem;
    display: inline-block;
}
.color-badge.jaune {
    background-color: #ffeb3b;
    color: #000;
}
.color-badge.noire {
    background-color: #424242;
    color: #fff;
}
.event-description {
    font-size: clamp(0.75rem, 1.4vh, 1.1rem);
    margin-top: 0.25rem;
}
.event-location {
    font-size: clamp(0.8rem, 1.5vh, 1.2rem);
    margin-top: 0.25rem;
}
</style>
