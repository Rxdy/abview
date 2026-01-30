<template>
  <div class="slide celebration-slide">
    <div class="celebration">
      <div class="fireworks">***</div>
      <h2 class="celebration-title">Bonne année {{ currentYear }} !</h2>
      <p class="celebration-subtitle">Voici un petit retour sur l'année {{ pastYear }}</p>
      <div class="new-year-message">
        <p class="celebration-message">Que cette nouvelle année vous apporte</p>
        <p class="celebration-message">joie, succès et accomplissements !</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  currentYear: number
  pastYear: number
}

defineProps<Props>()
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
  justify-content: center;
  gap: 20px;
  width: 100vw;
  max-width: 100vw;
  overflow: hidden;
  box-sizing: border-box;
}
.celebration {
  animation: bounce 2s ease-in-out;
}

.fireworks, .confetti {
  font-size: 3rem;
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
}

.celebration-title {
  font-size: 4rem;
  margin: 20px 0;
  text-align: center;
  text-align: center;
  color: #fff;
}

.celebration-subtitle {
  font-size: 2.5rem;
  margin: 16px 0;
  text-align: center;
  color: #e0e0e0;
}

.celebration-message {
  font-size: 2rem;
  margin: 12px 0;
  text-align: center;
  color: #e0e0e0;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
</style>