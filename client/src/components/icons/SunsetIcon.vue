<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    :class="iconClass"
  >
    <!-- Soleil couchant -->
    <circle cx="12" cy="12" r="4" fill="currentColor"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 6.34L4.93 4.93M19.07 19.07l1.41 1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <!-- Rayons du soleil -->
    <path d="M12 6V4M12 20v-2M6 12H4M20 12h-2M7.05 7.05L5.64 5.64M18.36 18.36l1.41 1.41M7.05 16.95l-1.41 1.41M18.36 5.64l1.41-1.41" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
</template>

<script>
export default {
  name: "SunsetIcon",
  props: {
    iconClass: {
      type: String,
      default: "",
    },
  },
};
</script>