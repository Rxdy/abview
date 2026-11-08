<template>
  <div class="veille">
    <PhotosModule :variante="disposition" />
  </div>
</template>

<script setup lang="ts">
import PhotosModule from '../components/PhotosModule.vue'
import { VEILLE } from '../modules/dispositionsPhotos'

/**
 * Mode veille : toute la page devient un mur de cinq cadres photo (quatre portraits et un paysage). Le capteur
 * de présence le déclenchera ; en attendant, une commande (make veille-on) ou la page /apercu-veille le montrent.
 */
const disposition = VEILLE[0]
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
