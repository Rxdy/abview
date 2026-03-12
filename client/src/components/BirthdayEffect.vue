  <template>
  <div v-if="isVisible" class="birthday-overlay" @click="hide">
    <!-- Confettis animés lents sur toute la largeur -->
    <div class="confetti" v-for="i in 200" :key="i"
         :style="{
           left: Math.random() * 100 + '%',
           animationDelay: Math.random() * 8 + 's',
           backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#a8e6cf', '#ffd3a5', '#ffaaa5', '#dcedc8', '#ff8a80', '#80d6ff', '#ffd180', '#ccff90', '#f48fb1'][Math.floor(Math.random() * 15)]
         }"></div>

    <!-- Ballons qui montent du bas -->
    <div class="balloon" v-for="i in 25" :key="'balloon-' + i"
         :style="{
           left: Math.random() * 100 + '%',
           animationDelay: Math.random() * 10 + 's',
           fontSize: (Math.random() * 2 + 1) + 'rem'
         }">
      🎈
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';

const isVisible = ref(false);
let currentBirthdayPerson = '';
let currentBirthdayDate = ''; // Nouvelle variable pour stocker la date de départ
let birthdayTimeout: number | null = null;
let isTestMode = false;

// Fonction pour déclencher l'animation
const showBirthdayEffect = (person: string = 'Quelqu\'un', testMode: boolean = false) => {
  console.log('🎂 showBirthdayEffect CALLED with person:', person, 'testMode:', testMode);
  
  // Extraire le nom de la personne (au cas où elle contient déjà une date)
  const cleanPerson = person.split('|')[0];
  
  // Ne définir la date que si c'est la première fois (pas une répétition)
  if (!currentBirthdayPerson || testMode) {
    const today = new Date();
    currentBirthdayDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    console.log('🎂 Setting birthday date to:', currentBirthdayDate);
  }
  
  // Stocker seulement le nom de la personne
  currentBirthdayPerson = cleanPerson || 'Quelqu\'un';
  
  isTestMode = testMode;
  isVisible.value = true;
  console.log('🎂 Birthday effect is now VISIBLE for:', currentBirthdayPerson);
  
  // Nettoyer le timeout précédent
  if (birthdayTimeout) {
    clearTimeout(birthdayTimeout);
  }
  
  if (testMode) {
    // Mode test : durée courte (15 secondes) puis arrêt
    birthdayTimeout = setTimeout(() => {
      // console.log('🎂 Test mode: stopping birthday effect after 15 seconds');
      stopBirthdayEffect();
    }, 15000);
  } else {
    // Mode réel : durée visible de 1 minute puis masquage (mais répétition continue)
    birthdayTimeout = setTimeout(() => {
      // console.log('🎂 Real mode: hiding birthday effect after 1 minute, but will repeat in 10 minutes');
      isVisible.value = false; // Masquer l'effet visuellement
      
      // Programmer la prochaine répétition dans 10 minutes
      birthdayTimeout = setTimeout(() => {
        // Vérifier si c'est encore aujourd'hui et s'il y a encore des anniversaires
        const today = new Date();
        const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
        
        console.log('🎂 Checking if still birthday day for:', currentBirthdayPerson, 'on', todayStr, 'started on:', currentBirthdayDate);
        
        // Vérifier que c'est encore le même jour
        const isSameDay = currentBirthdayDate === todayStr;
        
        console.log('🎂 BIRTHDAY CHECK:', {
          currentBirthdayPerson,
          currentBirthdayDate,
          todayStr,
          isSameDay,
          isTestMode,
          shouldContinue: currentBirthdayPerson && !isTestMode && isSameDay
        });
        
        // Pour le mode réel, on continue tant qu'il y a une personne définie ET que c'est le même jour
        if (currentBirthdayPerson && !isTestMode && isSameDay) {
          console.log('🎂 Continuing birthday effect for 10 more minutes');
          showBirthdayEffect(currentBirthdayPerson, false);
        } else {
          console.log('🎂 STOPPING birthday effect - day changed or no more birthdays');
          stopBirthdayEffect();
        }
      }, 600000); // 10 minutes = 600000 millisecondes
    }, 60000); // 1 minute = 60000 millisecondes
  }
};

// Fonction pour masquer
const hide = () => {
  isVisible.value = false;
};

// Fonction pour arrêter complètement l'effet d'anniversaire
const stopBirthdayEffect = () => {
  console.log('🎂 STOPPING birthday effect for:', currentBirthdayPerson, 'testMode:', isTestMode);
  isVisible.value = false;
  currentBirthdayPerson = '';
  currentBirthdayDate = '';
  isTestMode = false;
  if (birthdayTimeout) {
    clearTimeout(birthdayTimeout);
    birthdayTimeout = null;
  }
};

// Exposer les fonctions globalement
if (typeof window !== 'undefined') {
  (window as any).showBirthdayEffect = showBirthdayEffect;
  (window as any).stopBirthdayEffect = stopBirthdayEffect;
  // Exposer aussi les variables pour vérification
  Object.defineProperty(window, 'currentBirthdayPerson', {
    get: () => currentBirthdayPerson,
    enumerable: true
  });
  Object.defineProperty(window, 'currentBirthdayDate', {
    get: () => currentBirthdayDate,
    enumerable: true
  });
}

onMounted(() => {
  // console.log('🎂 BirthdayEffect component mounted and listening for events');
  
  // Écouter les événements d'anniversaire depuis le calendrier
  document.addEventListener('birthday-detected', (event: any) => {
    // console.log('🎂 BirthdayEffect received birthday-detected event:', event.detail);
    
    if (event.detail && event.detail.person) {
      const testMode = event.detail.testMode || false;
      // console.log('🎂 Showing birthday effect for:', event.detail.person, 'testMode:', testMode);
      showBirthdayEffect(event.detail.person, testMode);
    } else {
      // console.log('🎂 Event received but no person detail found');
    }
  });
});
</script>

<style scoped>
.birthday-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.05);
  z-index: 9999;
  pointer-events: none;
  animation: fadeIn 0.5s ease-out;
}

.confetti {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: fallSlow 8s linear infinite;
  pointer-events: none;
  top: -10px;
}

.confetti:nth-child(odd) {
  animation-duration: 10s;
}

.confetti:nth-child(3n) {
  animation-duration: 12s;
}

.confetti:nth-child(5n) {
  width: 12px;
  height: 12px;
}

.balloon {
  position: absolute;
  font-size: 2rem;
  animation: rise 6s ease-out infinite;
  pointer-events: none;
  bottom: -50px;
  z-index: 10000;
}

.balloon:nth-child(odd) {
  animation-duration: 8s;
}

.balloon:nth-child(3n) {
  animation-duration: 10s;
}

.balloon:nth-child(1) { animation-delay: 0s; }
.balloon:nth-child(2) { animation-delay: 0.5s; }
.balloon:nth-child(3) { animation-delay: 1s; }
.balloon:nth-child(4) { animation-delay: 1.5s; }
.balloon:nth-child(5) { animation-delay: 2s; }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fallSlow {
  0% {
    transform: translateY(-20px) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

@keyframes rise {
  0% {
    transform: translateY(0px) scale(0.8);
    opacity: 0;
  }
  10% {
    opacity: 1;
    transform: scale(1);
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-120vh) scale(1.2) rotate(5deg);
    opacity: 0;
  }
}
</style>