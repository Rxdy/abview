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
        <path
            d="M12 4C6 4 6 8 6 10C4.33333 10 1 11 1 15C1 19 4.33333 20 6 20H18C19.6667 20 23 19 23 15C23 11 19.6667 10 18 10C18 8 18 4 12 4Z"
            :stroke="cloudColor"
            :fill="cloudColor"
            stroke-width="1.5"
            stroke-linejoin="round"
        />

        <!-- Pluie alignée avec la base du nuage -->
        <g :stroke="dropsColor" stroke-width="1.2" stroke-linecap="round">
            <path d="M5 19V21" />
            <!-- normale -->
            <path d="M8 19.5V21.5" />
            <!-- un peu plus basse -->
            <path d="M11 19V21" />
            <!-- normale -->
            <path d="M14 19.5V21.5" />
            <!-- un peu plus basse -->
            <path d="M17 19V21" />
            <!-- normale -->
        </g>
    </svg>
</template>

<script setup>
defineProps({
    cloudColor: { type: String, default: "#666666" },
    dropsColor: { type: String, default: "#2196F3" },
});
</script>
