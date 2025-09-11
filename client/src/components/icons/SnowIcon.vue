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
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            ></path>
        </g>
        <!-- Flocons -->
        <g :stroke="snowColor">
            <path
                d="M6 16L8 18M8 16L6 18"
                stroke-width="1"
                stroke-linecap="round"
            />
            <!-- Gauche, sous le nuage -->
            <path
                d="M10 19L12 21M12 19L10 21"
                stroke-width="1"
                stroke-linecap="round"
            />
            <!-- Centre-gauche, plus bas -->
            <path
                d="M14 16L16 18M16 16L14 18"
                stroke-width="1"
                stroke-linecap="round"
            />
            <!-- Centre-droit -->
            <path
                d="M18 19L20 21M20 19L18 21"
                stroke-width="1"
                stroke-linecap="round"
            />
            <!-- Droit, sous le nuage, plus bas -->
        </g>
    </svg>
</template>

<script setup>
defineProps({
    cloudColor: {
        type: String,
        default: "#666666", // Gris foncé pour le nuage
    },
    snowColor: {
        type: String,
        default: "#e0f7fa", // Bleu clair pour les flocons
    },
});
</script>
