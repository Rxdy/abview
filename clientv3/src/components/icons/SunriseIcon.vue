<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    :class="iconClass"
  >
    <circle cx="12" cy="12" r="5" fill="yellow" />
    <path d="M12 2V4" stroke="yellow" stroke-width="2" stroke-linecap="round" />
    <path d="M12 20V22" stroke="yellow" stroke-width="2" stroke-linecap="round" />
    <path d="M4.93 4.93L6.34 6.34" stroke="yellow" stroke-width="2" stroke-linecap="round" />
    <path d="M17.66 17.66L19.07 19.07" stroke="yellow" stroke-width="2" stroke-linecap="round" />
    <path d="M2 12H4" stroke="yellow" stroke-width="2" stroke-linecap="round" />
    <path d="M20 12H22" stroke="yellow" stroke-width="2" stroke-linecap="round" />
    <path d="M6.34 17.66L4.93 19.07" stroke="yellow" stroke-width="2" stroke-linecap="round" />
    <path d="M19.07 6.34L17.66 4.93" stroke="yellow" stroke-width="2" stroke-linecap="round" />
  </svg>
</template>

<script>
export default {
  name: "SunriseIcon",
  props: {
    iconClass: {
      type: String,
      default: "",
    },
  },
};
</script>