<template>
    <div v-if="isLoading" class="loading-screen">
        <div class="loading-container">
            <!-- Logo ou icône -->
            <div class="loading-logo">
                <div class="logo-icon">📱</div>
                <h1>AbView</h1>
                <div class="version">v1.3.5</div>
            </div>

            <!-- Loader animé -->
            <div class="loading-spinner">
                <div class="spinner"></div>
            </div>

            <!-- Barre de progression -->
            <div class="progress-container">
                <div class="progress-bar" :style="{ width: progress + '%' }"></div>
            </div>

            <!-- Message de chargement -->
            <div class="loading-message">
                <p class="message-text">{{ currentMessage }}</p>
                <p class="sub-message">{{ currentSubMessage }}</p>
            </div>

            <!-- Indicateur de progression -->
            <div class="progress-indicator">
                {{ Math.round(progress) }}%
            </div>
        </div>
    </div>
</template>

<script>
import { getApiUrl } from "../utils/dateUtils";

export default {
    name: "LoadingScreen",
    data() {
        return {
            isLoading: true,
            progress: 0,
            currentMessage: "",
            currentSubMessage: "",
            loadingSteps: [
                {
                    message: "Initialisation du système",
                    subMessages: [
                        "Chargement des configurations...",
                        "Préparation de l'interface...",
                        "Vérification des paramètres..."
                    ],
                    duration: 1500,
                    progress: 5
                },
                {
                    message: "Connexion aux services",
                    subMessages: [
                        "Établissement de la liaison avec l'API...",
                        "Handshake en cours...",
                        "Authentification des services..."
                    ],
                    duration: 2000,
                    progress: 15,
                    action: "checkApi"
                },
                {
                    message: "Chargement du module météo",
                    subMessages: [
                        "Récupération des prévisions OpenWeather...",
                        "Analyse des conditions atmosphériques...",
                        "Calcul des heures de lever/coucher du soleil..."
                    ],
                    duration: 2500,
                    progress: 35,
                    action: "loadWeather"
                },
                {
                    message: "Chargement du module calendrier",
                    subMessages: [
                        "Synchronisation avec Google Calendar...",
                        "Récupération des événements à venir...",
                        "Organisation de votre planning..."
                    ],
                    duration: 2500,
                    progress: 55,
                    action: "loadCalendar"
                },
                {
                    message: "Chargement du module tâches",
                    subMessages: [
                        "Récupération de vos todos...",
                        "Organisation des priorités...",
                        "Tri par date d'échéance..."
                    ],
                    duration: 2000,
                    progress: 75,
                    action: "loadTasks"
                },
                {
                    message: "Configuration des notifications",
                    subMessages: [
                        "Préparation des alertes sonores...",
                        "Test du système audio...",
                        "Activation des rappels intelligents..."
                    ],
                    duration: 1500,
                    progress: 85
                },
                {
                    message: "Paramétrage du thème",
                    subMessages: [
                        "Adaptation aux conditions lumineuses...",
                        "Application du mode jour/nuit...",
                        "Ajustement des contrastes..."
                    ],
                    duration: 1000,
                    progress: 92
                },
                {
                    message: "Finalisation",
                    subMessages: [
                        "Derniers ajustements visuels...",
                        "Optimisation des performances...",
                        "Vérification finale..."
                    ],
                    duration: 1000,
                    progress: 98
                },
                {
                    message: "Prêt !",
                    subMessages: [
                        "Bienvenue dans votre tableau de bord intelligent",
                        "Tout est prêt, bonne journée !",
                        "AbView à votre service !"
                    ],
                    duration: 800,
                    progress: 100
                }
            ],
            currentStep: 0,
            subMessageIndex: 0,
            subMessageInterval: null,
            apiData: {
                weather: null,
                calendar: null,
                tasks: null
            }
        };
    },
    mounted() {
        this.startLoading();
    },
    beforeUnmount() {
        if (this.subMessageInterval) {
            clearInterval(this.subMessageInterval);
        }
    },
    methods: {
        async startLoading() {
            this.currentStep = 0;
            this.progress = 0;
            
            for (let i = 0; i < this.loadingSteps.length; i++) {
                this.currentStep = i;
                await this.processStep(this.loadingSteps[i]);
            }
            
            this.finishLoading();
        },
        
        async processStep(step) {
            this.currentMessage = step.message;
            this.subMessageIndex = 0;
            this.currentSubMessage = step.subMessages[0];
            
            // Rotation des sous-messages
            const subMessageDuration = step.duration / step.subMessages.length;
            let subMessageCount = 0;
            
            this.subMessageInterval = setInterval(() => {
                subMessageCount++;
                if (subMessageCount < step.subMessages.length) {
                    this.subMessageIndex = subMessageCount;
                    this.currentSubMessage = step.subMessages[this.subMessageIndex];
                }
            }, subMessageDuration);
            
            // Animation fluide de la progression
            const startProgress = this.progress;
            const targetProgress = step.progress;
            const progressIncrement = (targetProgress - startProgress) / (step.duration / 50);
            
            const progressInterval = setInterval(() => {
                if (this.progress < targetProgress) {
                    this.progress = Math.min(this.progress + progressIncrement, targetProgress);
                }
            }, 50);
            
            // Exécuter l'action associée si elle existe
            if (step.action) {
                try {
                    await this[step.action]();
                } catch (error) {
                    console.warn(`Erreur lors de ${step.action}:`, error);
                    // On continue quand même, les modules rechargeront
                }
            }
            
            // Attendre la durée de l'étape
            await this.delay(step.duration);
            
            // Nettoyer les intervalles
            clearInterval(this.subMessageInterval);
            clearInterval(progressInterval);
            this.progress = targetProgress;
        },
        
        async checkApi() {
            try {
                const response = await fetch(getApiUrl("/"));
                if (response.ok) {
                    console.log("[Loading] API accessible");
                }
            } catch (error) {
                console.warn("[Loading] API non accessible, les modules réessaieront");
            }
        },
        
        async loadWeather() {
            try {
                const response = await fetch(getApiUrl("/weather"));
                if (response.ok) {
                    this.apiData.weather = await response.json();
                    console.log("[Loading] Météo chargée");
                }
            } catch (error) {
                console.warn("[Loading] Météo non chargée, le module réessaiera");
            }
        },
        
        async loadCalendar() {
            try {
                const response = await fetch(getApiUrl("/calendar"));
                if (response.ok) {
                    this.apiData.calendar = await response.json();
                    console.log("[Loading] Calendrier chargé");
                }
            } catch (error) {
                console.warn("[Loading] Calendrier non chargé, le module réessaiera");
            }
        },
        
        async loadTasks() {
            try {
                const response = await fetch(getApiUrl("/tasks"));
                if (response.ok) {
                    this.apiData.tasks = await response.json();
                    console.log("[Loading] Tâches chargées");
                }
            } catch (error) {
                console.warn("[Loading] Tâches non chargées, le module réessaiera");
            }
        },
        
        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },
        
        finishLoading() {
            this.progress = 100;
            // Petit délai pour voir le 100%
            setTimeout(() => {
                this.isLoading = false;
                this.$emit('loading-complete', this.apiData);
            }, 500);
        }
    }
};
</script>

<style scoped>
.loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.loading-container {
    text-align: center;
    color: white;
    max-width: 500px;
    padding: 2rem;
}

.loading-logo {
    margin-bottom: 4rem;
}

.logo-icon {
    font-size: 6rem;
    margin-bottom: 1.5rem;
    /* Animation supprimée */
}

@keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
    }
    40% {
        transform: translateY(-10px);
    }
    60% {
        transform: translateY(-5px);
    }
}

.loading-logo h1 {
    font-size: 4rem;
    font-weight: bold;
    margin: 0.5rem 0;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.version {
    font-size: 1.5rem;
    opacity: 0.8;
    font-weight: 300;
}

.loading-spinner {
    margin: 3rem 0;
}

.spinner {
    width: 80px;
    height: 80px;
    border: 6px solid rgba(255, 255, 255, 0.3);
    border-top: 6px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.progress-container {
    width: 100%;
    height: 12px;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    margin: 3rem 0;
    overflow: hidden;
}

.progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #4CAF50, #45a049);
    border-radius: 6px;
    transition: width 0.5s ease;
    box-shadow: 0 0 15px rgba(76, 175, 80, 0.5);
}

.loading-message {
    margin: 3rem 0;
    min-height: 6rem; /* Hauteur fixe pour éviter le mouvement */
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.message-text {
    font-size: 2.2rem;
    font-weight: 600;
    margin: 0.5rem 0;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}

.sub-message {
    font-size: 1.4rem;
    opacity: 0.9;
    margin: 0.5rem 0;
    font-style: italic;
}

.progress-indicator {
    font-size: 1.8rem;
    font-weight: bold;
    margin-top: 2rem;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}

/* Animation d'entrée pour les messages */
.message-text, .sub-message {
    animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>