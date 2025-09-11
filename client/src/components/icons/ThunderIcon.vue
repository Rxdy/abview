<template>
    <svg
        width="24px"
        height="24px"
        stroke-width="1.5"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <!-- Nuage -->
        <g :stroke="cloudColor" :fill="cloudColor">
            <path
                d="M12 4C6 4 6 8 6 10C4.33333 10 1 11 1 15C1 19 4.33333 20 6 20H18C19.6667 20 23 19 23 15C23 11 19.6667 10 18 10C18 8 18 4 12 4Z"
                :stroke="cloudColor"
                stroke-width="1.5"
                stroke-linejoin="round"
            ></path>
        </g>
        <!-- Éclair -->
        <g :stroke="thunderColor" :fill="cloudColor">
            <path
                d="M12 13L9 18H14L11 23"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </g>
    </svg>
</template>

<script setup>
defineProps({
    cloudColor: {
        type: String,
        default: "#666666", // Gris foncé pour le nuage
    },
    thunderColor: {
        type: String,
        default: "#ffca28", // Jaune pour l'éclair
    },
});
</script>
