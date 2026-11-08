<template>
  <div class="veille">
    <PhotosModule :variante="disposition" />
  </div>
</template>

<script setup lang="ts">
import PhotosModule from '../components/PhotosModule.vue'
import { VEILLE } from '../modules/dispositionsPhotos'

/**
 * Mode veille : toute la page devient un mur de cadres photo (2 à 5 photos). Le capteur de présence le
 * déclenchera ; en attendant, la page /veille permet de le voir. /veille?dispo=cinq choisit la disposition.
 */
const demandee = new URLSearchParams(window.location.search).get('dispo') ?? ''
const disposition = (VEILLE as readonly string[]).includes(demandee) ? demandee : 'quatre'
</script>

<style scoped>
.veille {
  position: fixed;
  inset: 0;
  z-index: 100;
  cursor: none;
  background: var(--c-bg);
}
.veille > * {
  border-radius: 0;
}
</style>
