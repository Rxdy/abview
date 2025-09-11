<template>
    <component :is="getIcon(icon)" class="weather-icon" />
</template>

<script setup>
import { defineProps } from "vue";

// Props
const props = defineProps({
    icon: {
        type: String,
        required: true,
    },
});

// Toutes les icônes colorées
const Sun = {
    template: `
    <svg width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="6" stroke="#FFD700" stroke-width="1.5"/>
      <path d="M12 2V1M12 23V22M20 12L21 12M1 12L2 12M20 4L19 5M4 20L5 19M20 20L19 19M4 4L5 5" stroke="#FFD700" stroke-width="1.5"/>
    </svg>
  `,
};

const Cloud = {
    template: `
    <svg width="24" height="24" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4C6 4 6 8 6 10C4.33333 10 1 11 1 15C1 19 4.33333 20 6 20H18C19.6667 20 23 19 23 15C23 11 19.6667 10 18 10C18 8 18 4 12 4Z" stroke="#FFFFFF" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>
  `,
};

const Rain = {
    template: `
    <svg width="24" height="24" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 14V16M12 20V22M8 18V20M16 18V20" stroke="#4FC3F7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M20 17.6073C21.4937 17.0221 23 15.6889 23 13C23 9 19.6667 8 18 8C18 6 18 2 12 2C6 2 6 6 6 8C4.33333 8 1 9 1 13C1 15.6889 2.50628 17.0221 4 17.6073" stroke="#BBB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,
};

const Thunder = {
    template: `
    <svg width="24" height="24" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.5 12L9 17H15L12.5 22" stroke="#FFD700" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M20 17.6073C21.4937 17.0221 23 15.6889 23 13C23 9 19.6667 8 18 8C18 6 18 2 12 2C6 2 6 6 6 8C4.33333 8 1 9 1 13C1 15.6889 2.50628 17.0221 4 17.6073" stroke="#BBB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,
};

const PartlyCloudy = {
    template: `
    <svg width="24" height="24" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="19" cy="5" r="3" stroke="#FFD700" stroke-width="1.5"/>
      <path d="M6 13C4.33333 13 1 14 1 18C1 22 4.33333 23 6 23H18C19.6667 23 23 22 23 18C23 14 19.6667 13 18 13" stroke="#BBB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,
};

// Map des icônes
const getIcon = (name) =>
    ({
        sun: Sun,
        cloud: Cloud,
        rain: Rain,
        thunder: Thunder,
        partlyCloudy: PartlyCloudy,
    }[name] || Cloud);
</script>

<style scoped>
.weather-icon {
    width: 35px;
    height: 35px;
}
</style>
