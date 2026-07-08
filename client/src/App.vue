<script setup lang="ts">
import { RouterView } from 'vue-router';
import Header from './components/Header.vue';
import Footer from './components/Footer.vue';
import AnnualRecapWrapper from './components/AnnualRecapWrapper.vue';
import BirthdayEffect from './components/BirthdayEffect.vue';
import { useThemeStore } from './stores/themeStore';
import { useWeatherStore } from './stores/weatherStore';
import { onMounted } from 'vue';

const themeStore = useThemeStore();
const weatherStore = useWeatherStore();

onMounted(() => {
  weatherStore.fetchWeather();

  if (import.meta.env.DEV) {
    // DEBUG: Raccourci clavier pour logs
    document.addEventListener('keydown', (e) => {
      if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        console.log('🔥 LOGS MANUELS déclenchés par Ctrl+L');
        // Debug code removed - Vue 3 doesn't expose __vue__ property
        console.log('Dashboard element found, but debug logging disabled');
      }
    });

    // DEBUG: Raccourci clavier pour le recap annuel
    document.addEventListener('keydown', (e) => {
      if (e.key === 'r' && e.ctrlKey && e.altKey) {
        e.preventDefault();
        console.log('🎉 RECAP ANNUEL déclenché par Ctrl+Alt+R');
        if ((window as any).showAnnualRecap) {
          (window as any).showAnnualRecap();
        }
      }
    });

    // DEBUG: Raccourcis pour contrôler les slides du recap
    document.addEventListener('keydown', (e) => {
      // Flèche droite pour slide suivante
      if (e.key === 'ArrowRight' && e.altKey) {
        e.preventDefault();
        if ((window as any).nextSlide) {
          (window as any).nextSlide();
        }
      }
      // Flèche gauche pour slide précédente
      if (e.key === 'ArrowLeft' && e.altKey) {
        e.preventDefault();
        if ((window as any).prevSlide) {
          (window as any).prevSlide();
        }
      }
      // Chiffres 1-5 pour aller directement à une slide
      if (e.key >= '1' && e.key <= '5' && e.altKey) {
        e.preventDefault();
        const slideNumber = parseInt(e.key) - 1;
        if ((window as any).goToSlide) {
          (window as any).goToSlide(slideNumber);
        }
      }
      // S pour status
      if (e.key === 's' && e.altKey) {
        e.preventDefault();
        if ((window as any).recapStatus) {
          (window as any).recapStatus();
        }
      }
    });

    // DEBUG: Raccourci clavier pour les anniversaires
    document.addEventListener('keydown', (e) => {
      if (e.key === 'b' && e.ctrlKey && e.altKey) {
        e.preventDefault();
        console.log('🎂 EFFET ANNIVERSAIRE déclenché par Ctrl+Alt+B');
        console.log('🎂 Test mode: dispatching birthday-detected event...');
        
        // Déclencher l'effet d'anniversaire global en mode test
        const birthdayEvent = new CustomEvent('birthday-detected', {
          detail: { person: 'Test Person', testMode: true }
        });
        document.dispatchEvent(birthdayEvent);
        
        console.log('🎂 Event dispatched, checking if BirthdayEffect is listening...');
      }
    });
    
    // Raccourci pour arrêter l'effet d'anniversaire
    document.addEventListener('keydown', (e) => {
      if (e.key === 'b' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        console.log('🛑 ARRÊT EFFET ANNIVERSAIRE par Ctrl+Shift+B');
        if ((window as any).stopBirthdayEffect) {
          (window as any).stopBirthdayEffect();
        }
      }
    });
  }
});
</script>

<template>
  <div class="app" :class="{ 'light-theme': !themeStore.isDark }">
    <Header />
    <main class="content">
      <RouterView />
    </main>
    <Footer />
    <AnnualRecapWrapper />
    <BirthdayEffect />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  cursor: none; /* Masquer le curseur pour affichage sans périphérique */
}

.content {
  flex: 1;
  background-color: var(--color-background);
  overflow: hidden;
  padding-bottom: 0.5rem;
  box-sizing: border-box;
  transition: opacity 0.3s ease, filter 0.3s ease;
}

</style>
