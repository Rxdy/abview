<template>
  <div class="slide tasks-slide">
    <h3>📊 Productivité de l'année</h3>

    <!-- Section principale : Statistiques globales -->
    <div class="tasks-main-section">
      <div class="global-stats-card">
        <div class="stats-header">
          <div class="stat-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
          </div>
          <div class="stats-data">
            <div class="success-rate">{{ globalSuccessRate }}%</div>
            <div class="success-label">Taux de réussite global</div>
            <div class="success-description">{{ totalTasksCompleted }}/{{ totalTasksCreated }} tâches terminées</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Layout en colonnes pour toute la page -->
    <div class="tasks-columns">
      <!-- Colonne 1: Statistiques principales -->
      <div class="tasks-column">
        <div class="tasks-section">
          <h4>🎯 Vue d'ensemble</h4>
          <div class="main-stats-grid">
            <div class="stat-card primary">
              <div class="stat-icon created">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div class="stat-data">
                <div class="stat-value">{{ totalTasksCreated }}</div>
                <div class="stat-label">Tâches créées</div>
                <div class="stat-source">{{ totalTasksCreated > 0 ? 'Données réelles' : 'Données de test' }}</div>
              </div>
            </div>

            <div class="stat-card primary">
              <div class="stat-icon completed">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
              <div class="stat-data">
                <div class="stat-value">{{ totalTasksCompleted }}</div>
                <div class="stat-label">Tâches terminées</div>
                <div class="stat-source">{{ totalTasksCompleted > 0 ? 'Données réelles' : 'Données de test' }}</div>
              </div>
            </div>

            <div class="stat-card primary">
              <div class="stat-icon pending">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </div>
              <div class="stat-data">
                <div class="stat-value">{{ totalTasksCreated - totalTasksCompleted }}</div>
                <div class="stat-label">Tâches en attente</div>
                <div class="stat-source">À compléter</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Colonne 2: Statistiques par liste -->
      <div class="tasks-column">
        <div class="tasks-section">
          <h4>📋 Par liste</h4>
          <div class="lists-stats-grid">
            <div v-for="list in tasksByList" :key="list.listId" class="list-stat-card">
              <div class="list-header">
                <div class="list-name" :style="{ color: getListColor(list.listTitle) }">
                  {{ list.listTitle }}
                </div>
                <div class="list-success-rate">{{ Math.round((list.completed / list.created) * 100) }}%</div>
              </div>
              <div class="list-details">
                <div class="detail-item">
                  <span class="detail-value">{{ list.created }}</span>
                  <span class="detail-label">créées</span>
                </div>
                <div class="detail-item">
                  <span class="detail-value">{{ list.completed }}</span>
                  <span class="detail-label">terminées</span>
                </div>
                <div class="detail-item">
                  <span class="detail-value">{{ list.created - list.completed }}</span>
                  <span class="detail-label">en attente</span>
                </div>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${(list.completed / list.created) * 100}%`, backgroundColor: getListColor(list.listTitle) }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Colonne 3: Statistiques simples -->
      <div class="tasks-column">
        <div class="tasks-section">
          <h4>📊 Résumé</h4>
          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-icon">🎯</div>
              <div class="summary-content">
                <div class="summary-value">{{ averageTasksPerDay }}/jour</div>
                <div class="summary-label">Tâches créées</div>
              </div>
            </div>

            <div class="summary-card">
              <div class="summary-icon">✅</div>
              <div class="summary-content">
                <div class="summary-value">{{ averageCompletedPerDay }}/jour</div>
                <div class="summary-label">Tâches terminées</div>
              </div>
            </div>

            <div class="summary-card">
              <div class="summary-icon">📈</div>
              <div class="summary-content">
                <div class="summary-value">{{ activeListsCount }}</div>
                <div class="summary-label">Listes actives</div>
              </div>
            </div>

            <div class="summary-card">
              <div class="summary-icon">🏆</div>
              <div class="summary-content">
                <div class="summary-value">{{ bestList?.listTitle || 'Aucune' }}</div>
                <div class="summary-label">Meilleure liste</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  totalTasksCreated: number
  totalTasksCompleted: number
  tasksByList: any[]
}

const props = defineProps<Props>()

// Taux de réussite global
const globalSuccessRate = computed(() => {
  if (props.totalTasksCreated === 0) return 0
  return Math.round((props.totalTasksCompleted / props.totalTasksCreated) * 100)
})

// Moyennes par jour (approximation basée sur 365 jours)
const averageTasksPerDay = computed(() => {
  return Math.round(props.totalTasksCreated / 365 * 10) / 10
})

const averageCompletedPerDay = computed(() => {
  return Math.round(props.totalTasksCompleted / 365 * 10) / 10
})

// Meilleure liste (plus haut taux de réussite)
const bestList = computed(() => {
  if (!props.tasksByList.length) return null
  return props.tasksByList.reduce((best, current) => {
    const bestRate = best.completed / best.created
    const currentRate = current.completed / current.created
    return currentRate > bestRate ? current : best
  })
})

// Liste la plus productive (plus de tâches terminées)
const mostProductiveList = computed(() => {
  if (!props.tasksByList.length) return null
  return props.tasksByList.reduce((most, current) => {
    return current.completed > most.completed ? current : most
  })
})

// Nombre de listes actives (avec au moins une tâche)
const activeListsCount = computed(() => {
  return props.tasksByList.filter(list => list.created > 0).length
})

function getListColor(listTitle: string): string {
  const colorMap: { [key: string]: string } = {
    'Rudy': '#9b59b6',
    'Julie': '#3498db',
    'Luis': '#e74c3c',
    'Courses': '#27ae60',
    'Général': '#f39c12',
    'Travail': '#e74c3c',
    'Perso': '#27ae60',
    'Idées': '#f39c12',
    'Projets': '#9b59b6',
    'Santé': '#e91e63',
    'Finance': '#607d8b',
    'Loisirs': '#ff9800',
    'Famille': '#4caf50',
    'Voyages': '#00bcd4',
    'Études': '#673ab7'
  }
  return colorMap[listTitle] || '#666'
}
</script>

<style scoped>
.tasks-slide {
  padding: 10px;
  color: white;
  height: 100%;
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  width: 100vw;
  max-width: 100vw;
}

.tasks-slide h3 {
  text-align: center;
  font-size: 1.5rem;
  margin-bottom: 0;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.tasks-main-section {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.global-stats-card {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  max-width: 600px;
  width: 100%;
}

.stats-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.stat-icon {
  margin-right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffd700;
  flex-shrink: 0;
}

.stats-data {
  flex: 1;
}

.success-rate {
  font-size: 2.4rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 4px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.success-label {
  font-size: 1.1rem;
  color: #e0e0e0;
  margin-bottom: 8px;
}

.success-description {
  font-size: 1rem;
  color: #b0b0b0;
  font-style: italic;
}

.tasks-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  width: 100%;
  margin-top: 10px;
}

.tasks-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tasks-section h4 {
  text-align: center;
  font-size: 1.8rem;
  margin-bottom: 20px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.main-stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  width: 100%;
}

.stat-card.primary {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  backdrop-filter: blur(5px);
  min-width: 0;
  box-sizing: border-box;
}

.stat-card.primary:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.12);
}

.stat-icon.created {
  color: #4fc3f7;
  margin-right: 16px;
  flex-shrink: 0;
}

.stat-icon.completed {
  color: #81c784;
  margin-right: 16px;
  flex-shrink: 0;
}

.stat-icon.pending {
  color: #ff9800;
  margin-right: 16px;
  flex-shrink: 0;
}

.stat-data {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.stat-label {
  font-size: 0.9rem;
  color: #e0e0e0;
  margin-bottom: 2px;
}

.stat-source {
  font-size: 0.75rem;
  color: #a0a0a0;
  font-style: italic;
}

.lists-stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  width: 100%;
}

.list-stat-card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: transform 0.3s ease;
  backdrop-filter: blur(5px);
}

.list-stat-card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.12);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.list-name {
  font-size: 1.1rem;
  font-weight: 600;
  flex: 1;
  margin-right: 12px;
}

.list-success-rate {
  font-size: 1.2rem;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.list-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.detail-item {
  text-align: center;
}

.detail-value {
  display: block;
  font-size: 1.1rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 2px;
}

.detail-label {
  font-size: 0.7rem;
  color: #e0e0e0;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  width: 100%;
}

.summary-card {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: transform 0.3s ease;
  backdrop-filter: blur(5px);
}

.summary-card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.12);
}

.summary-icon {
  font-size: 1.5rem;
  margin-right: 16px;
  min-width: 40px;
  text-align: center;
}

.summary-content {
  flex: 1;
}

.summary-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.summary-label {
  font-size: 0.85rem;
  color: #e0e0e0;
}

/* Responsive design */
@media (max-width: 1200px) {
  .tasks-columns {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 18px;
  }
}

@media (max-width: 768px) {
  .tasks-slide {
    padding: 8px;
    gap: 12px;
  }

  .tasks-slide h3 {
    font-size: 1.3rem;
  }

  .global-stats-card {
    padding: 16px;
    flex-direction: column;
    text-align: center;
  }

  .stat-icon {
    margin-right: 0;
    margin-bottom: 12px;
  }

  .success-rate {
    font-size: 2rem;
  }

  .tasks-columns {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .list-details {
    grid-template-columns: repeat(2, 1fr);
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .tasks-slide h3 {
    font-size: 1.2rem;
  }

  .success-rate {
    font-size: 1.8rem;
  }

  .stat-value {
    font-size: 1.4rem;
  }

  .list-details {
    grid-template-columns: 1fr;
  }
}
</style>