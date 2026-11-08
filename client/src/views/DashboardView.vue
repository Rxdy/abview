<template>
  <div class="dashboard" :style="{ '--colonnes': GRILLE.colonnes, '--lignes': GRILLE.lignes }">
    <div
      v-for="e in emplacements"
      :key="e.id"
      class="emplacement"
      :class="{ carte: e.carte }"
      :data-module="e.module"
      :style="e.style"
    >
      <!-- La météo est la seule à tourner dans son emplacement (voir useModuleRotation) -->
      <Transition v-if="e.module === 'meteo'" name="module-fade" mode="out-in">
        <component :is="e.composant" v-if="activeModule === 'weather'" :key="e.id" v-bind="e.props" />
      </Transition>
      <component :is="e.composant" v-else :key="e.id" :class="e.animation" v-bind="e.props" />
    </div>
    <NotificationModal
      :event="notificationsStore.currentNotification?.event"
      :type="notificationsStore.currentNotification?.type || ''"
      :isVisible="notificationsStore.isModalVisible"
      @close="notificationsStore.closeNotification"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import NotificationModal from '../components/NotificationModal.vue';
import { useNotificationsStore } from '../stores/notificationsStore';
import { useDashboardStore } from '../stores/dashboardStore';
import { useModuleRotation } from '../composables/useModuleRotation';
import { GRILLE } from '../modules/grille';
import { REGISTRE } from '../modules/registre';
import { rectangle } from '../modules/configuration';
import { COMPOSANTS } from '../modules/composants';

const notificationsStore = useNotificationsStore();
const dashboardStore = useDashboardStore();

const { activeKey: activeModule, progress } = useModuleRotation([
  { key: 'weather', duration: 25_000 },
]);

// Chaque placement de la configuration devient un emplacement de la grille (case de départ + taille de la variante).
const emplacements = computed(() =>
  dashboardStore.configuration.placements.flatMap((p) => {
    const r = rectangle(p);
    const composant = COMPOSANTS[p.module];
    if (!r || !composant) return [];
    return [
      {
        id: p.id,
        module: p.module,
        composant,
        carte: REGISTRE[p.module]?.carte,
        animation: REGISTRE[p.module]?.animation,
        props: p.module === 'meteo' ? { progress: progress.value, ...p.reglages } : p.reglages,
        style: { gridColumn: `${r.x} / span ${r.largeur}`, gridRow: `${r.y} / span ${r.hauteur}` },
      },
    ];
  })
);
</script>

<style scoped>
/* Grille de cases (voir modules/grille.ts) : chaque module occupe le rectangle de sa configuration. */
.dashboard {
  display: grid;
  grid-template-columns: repeat(var(--colonnes), minmax(0, 1fr));
  grid-template-rows: repeat(var(--lignes), minmax(0, 1fr));
  height: 100%;
  gap: var(--page-gap);
}

.emplacement {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

/* Module posé sur une carte (la météo) ; les autres dessinent leurs propres cartes. */
.emplacement.carte {
  background: var(--c-surface);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.emplacement > * {
  height: 100%;
  width: 100%;
}

/* Module rotation transition */
.module-fade-enter-active,
.module-fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.module-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.module-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>