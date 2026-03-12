<template>
  <div class="slide user-stats-slide">
    <h3>Productivité par utilisateur</h3>
    <div class="user-stats-grid">
      <div v-for="user in topUsersByTasks" :key="user.user" class="user-stat-card">
        <div class="user-header">
          <div class="user-avatar" :style="{ backgroundColor: getListColor(user.user) }">
            {{ user.user.charAt(0) }}
          </div>
          <div class="user-name">{{ user.user }}</div>
        </div>
        <div class="user-stats">
          <div class="stat-item">
            <span class="stat-value">{{ user.totalCreated }}</span>
            <span class="stat-label">créées</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ user.totalCompleted }}</span>
            <span class="stat-label">terminées</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ user.completionRate }}%</span>
            <span class="stat-label">réussite</span>
          </div>
        </div>
      </div>
    </div>
    <div class="top-list-message">
      <p>Voici le classement de votre équipe !</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  topUsersByTasks: any[]
}

const props = defineProps<Props>()

function getListColor(userName: string): string {
  const colorMap: { [key: string]: string } = {
    'Rudy': '#3498db',
    'Julie': '#e74c3c',
    'Luis': '#27ae60',
    'Caroline': '#f39c12',
    'Courses': '#9b59b6',
    'Général': '#607d8b'
  }
  return colorMap[userName] || '#666'
}
</script>

<style scoped>
.slide {
  padding: 16px;
  color: white;
  height: 100%;
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100vw;
  max-width: 100vw;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
}

.slide h3 {
  margin: 0 0 16px 0;
  color: #fff;
  font-size: 1.8rem;
}

.user-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  width: 100%;
  margin: 24px 0;
  max-width: 900px;
}

.user-stat-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: fadeInUp 0.8s ease-out both;
  transition: transform 0.2s ease;
}

.user-stat-card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.15);
}

.user-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
  margin-right: 12px;
}

.user-name {
  color: #fff;
  font-size: 1.3rem;
  font-weight: 600;
}

.user-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.8rem;
  color: #e0e0e0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.top-list-message {
  text-align: center;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 12px;
  padding: 20px;
  margin-top: 24px;
}

.top-list-message p {
  margin: 0;
  font-size: 1.1rem;
  color: white;
  font-weight: 500;
}

@keyframes fadeInUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>