import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

const app = createApp(App);

// Gestionnaire d'erreurs global pour éviter les crashs silencieux
app.config.errorHandler = (err, instance, info) => {
    console.error('[Vue Error]', err);
    console.error('[Component]', instance);
    console.error('[Info]', info);
};

// Gestionnaire pour les erreurs non capturées
window.addEventListener('error', (event) => {
    console.error('[Global Error]', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Promise Rejection]', event.reason);
});

app.mount("#app");
