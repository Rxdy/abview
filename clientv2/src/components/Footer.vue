<template>
  <footer class="footer">
    <div class="left">
      <span>&copy; {{ currentYear }} Abview. All rights reserved.</span>
    </div>
    <div class="center">
      <ProgressBar />
    </div>
    <div class="right">
      <span>v2.3.0</span>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ProgressBar from './ProgressBar.vue';

const currentYear = computed(() => new Date().getFullYear());
</script>

<style scoped>
.footer {
  background-color: var(--color-surface);
  padding: 0.25rem 0.5rem;
  color: var(--color-primary);
  height: 47px;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left,
.right {
  flex: 0 0 auto;
}

.center {
  flex: 1;
  display: flex;
  justify-content: center;
}
</style>