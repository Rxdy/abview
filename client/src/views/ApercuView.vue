<template>
  <DashboardView v-if="pret" figee />
  <p v-else class="vide">Aucun aperçu à montrer : ouvrez-le depuis l’éditeur (« Voir le rendu »).</p>
  <span v-if="pret" class="etiquette">Aperçu — non enregistré</span>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DashboardView from './DashboardView.vue'
import { useDashboardStore } from '../stores/dashboardStore'
import { valider, type Configuration } from '../modules/configuration'
import { CLE_APERCU } from '../modules/apercu'

const pret = ref(false)

// L'éditeur dépose la disposition dans le stockage du navigateur ; cette page l'affiche en vrai, sans la
// remplacer par celle du serveur (DashboardView « figée »).
onMounted(() => {
  try {
    const brut = localStorage.getItem(CLE_APERCU)
    if (!brut) return
    const config = JSON.parse(brut) as Configuration
    if (!Array.isArray(config.placements) || valider(config).length) return
    useDashboardStore().configuration = config
    pret.value = true
  } catch {
    /* stockage indisponible ou contenu illisible : on affiche le message */
  }
})
</script>

<style scoped>
.vide { margin: 48px auto; text-align: center; color: var(--c-muted); }
.etiquette {
  position: fixed;
  right: 14px;
  bottom: 28px;
  z-index: 50;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--c-accent);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  pointer-events: none;
}
</style>
