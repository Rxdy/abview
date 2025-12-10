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
                    subMessage: "Chargement des configurations...",
                    duration: 500,
                    progress: 5
                },
                {
                    message: "Connexion aux services",
                    subMessage: "Établissement de la liaison avec l'API...",
                    duration: 800,
                    progress: 15
                },
                {
                    message: "Chargement du module calendrier",
                    subMessage: "Synchronisation avec Google Calendar...",
                    duration: 1000,
                    progress: 30
                },
                {
                    message: "Chargement du module météo",
                    subMessage: "Récupération des prévisions OpenWeather...",
                    duration: 800,
                    progress: 45
                },
                {
                    message: "Chargement du module tâches",
                    subMessage: "Organisation de vos todos...",
                    duration: 600,
                    progress: 60
                },
                {
                    message: "Configuration du système de notifications",
                    subMessage: "Préparation des alertes sonores...",
                    duration: 700,
                    progress: 75
                },
                {
                    message: "Paramétrage du thème",
                    subMessage: "Adaptation aux conditions lumineuses...",
                    duration: 500,
                    progress: 85
                },
                {
                    message: "Finalisation de l'interface",
                    subMessage: "Derniers ajustements visuels...",
                    duration: 400,
                    progress: 95
                },
                {
                    message: "Prêt !",
                    subMessage: "Bienvenue dans votre tableau de bord intelligent",
                    duration: 300,
                    progress: 100
                }
            ],
            currentStep: 0,
            stepInterval: null
        };
    },
    mounted() {
        this.startLoading();
    },
    methods: {
        startLoading() {
            this.currentStep = 0;
            this.progress = 0;
            this.updateMessage();

            this.stepInterval = setInterval(() => {
                this.currentStep++;
                if (this.currentStep >= this.loadingSteps.length) {
                    this.finishLoading();
                    return;
                }
                this.updateMessage();
            }, this.loadingSteps[this.currentStep].duration);
        },
        updateMessage() {
            const step = this.loadingSteps[this.currentStep];
            this.currentMessage = step.message;
            this.currentSubMessage = step.subMessage;
            this.progress = step.progress;
        },
        finishLoading() {
            clearInterval(this.stepInterval);
            this.progress = 100;
            // Petit délai avant de masquer pour voir le 100%
            setTimeout(() => {
                this.isLoading = false;
                this.$emit('loading-complete');
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
    margin-bottom: 3rem;
}

.logo-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: bounce 2s infinite;
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
    font-size: 2.5rem;
    font-weight: bold;
    margin: 0.5rem 0;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.version {
    font-size: 1rem;
    opacity: 0.8;
    font-weight: 300;
}

.loading-spinner {
    margin: 2rem 0;
}

.spinner {
    width: 60px;
    height: 60px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid white;
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
    height: 8px;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    margin: 2rem 0;
    overflow: hidden;
}

.progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #4CAF50, #45a049);
    border-radius: 4px;
    transition: width 0.5s ease;
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

.loading-message {
    margin: 2rem 0;
    min-height: 4rem;
}

.message-text {
    font-size: 1.4rem;
    font-weight: 600;
    margin: 0.5rem 0;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}

.sub-message {
    font-size: 1rem;
    opacity: 0.9;
    margin: 0.5rem 0;
    font-style: italic;
}

.progress-indicator {
    font-size: 1.2rem;
    font-weight: bold;
    margin-top: 1rem;
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