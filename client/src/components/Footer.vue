<template>
  <footer class="footer">
    <div class="left">
      <span>&copy; {{ currentYear }} Abnd</span>
    </div>
    <div class="center">
      <ProgressBar />
    </div>
    <div class="right">
      <span class="num">v{{ version }}</span>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ProgressBar from './ProgressBar.vue';

const currentYear = computed(() => new Date().getFullYear());
const version = __APP_VERSION__;
</script>

<style scoped>
.footer {
  flex-shrink: 0;
  height: var(--footer-h);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: calc(11.5 * var(--px));
  font-weight: 600;
  color: var(--c-muted);
}

.left,
.right {
  flex: 0 0 auto;
}

.center {
  flex: 1;
  min-width: 0;
  display: flex;
}
</style>
