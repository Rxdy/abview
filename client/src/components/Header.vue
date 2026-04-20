<template>
  <header class="header">
    <div class="logo">
      <img alt="Logo" src="/abview-logo.png" width="40" height="40" />
      <h1>AbView</h1>
    </div>
    <div class="center">
      <DateTimeModule />
    </div>
    <div class="right">
      <h2>{{ dashboardStore.name }}</h2>
    </div>
  </header>
</template>

<script setup lang="ts">
import DateTimeModule from './DateTimeModule.vue';
import { useDashboardStore } from '../stores/dashboardStore';

const dashboardStore = useDashboardStore();
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background-color: var(--color-surface);
  color: var(--color-primary);
  height: 47px;
  flex-shrink: 0;
}

.light-theme .header {
  color: var(--color-primary);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 160px;
}

.right h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo h1 {
  font-size: 1.2rem;
  margin: 0;
}
</style>