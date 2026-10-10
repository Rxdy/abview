<template>
  <header class="header">
    <div class="logo">
      <img class="logo-img" src="/abview-logo.png" alt="" />
      <h1>AbView</h1>
    </div>
    <DateTimeModule />
    <h2 class="foyer">{{ dashboardStore.name }}</h2>
  </header>
</template>

<script setup lang="ts">
import DateTimeModule from './DateTimeModule.vue';
import { useDashboardStore } from '../stores/dashboardStore';

const dashboardStore = useDashboardStore();
</script>

<style scoped>
/* Trois colonnes : logo à gauche, pilule date/heure centrée, nom du foyer à droite. */
.header {
  flex-shrink: 0;
  height: var(--header-h);
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  color: var(--c-text);
}

.logo {
  display: flex;
  align-items: center;
  gap: calc(10 * var(--px));
}

.logo-img {
  width: calc(44 * var(--px));
  height: calc(44 * var(--px));
  object-fit: contain;
}

.logo h1 {
  font-size: var(--fs-lg);
  font-weight: 800;
}

.foyer {
  justify-self: end;
  font-size: calc(20 * var(--px));
  font-weight: 800;
}
</style>
