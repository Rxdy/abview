/**
 * Système de logging structuré pour AbView
 * Logs quotidiens par catégorie avec rotation automatique
 */

class Logger {
    constructor() {
        this.categories = {
            theme: 'theme',
            api: 'api',
            error: 'error',
            scroll: 'scroll',
            audio: 'audio',
            system: 'system'
        };
        this.maxDays = 7; // Garder 7 jours de logs
        this.init();
    }

    init() {
        // Nettoyer les anciens logs au démarrage
        this.cleanupOldLogs();
        // Nettoyer tous les jours à minuit
        setInterval(() => {
            const now = new Date();
            if (now.getHours() === 0 && now.getMinutes() === 0) {
                this.cleanupOldLogs();
            }
        }, 60 * 1000); // Vérifier chaque minute
    }

    getLogFileName(category) {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        return `abview-${category}-${today}.log`;
    }

    log(category, level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            category,
            message,
            data: data ? JSON.stringify(data) : null
        };

        const logLine = JSON.stringify(logEntry) + '\n';

        // Console pour développement
        console.log(`[${category.toUpperCase()}] ${level.toUpperCase()}: ${message}`, data || '');

        // Sauvegarde dans localStorage (fallback si pas de serveur)
        try {
            const fileName = this.getLogFileName(category);
            const existingLogs = localStorage.getItem(fileName) || '';
            localStorage.setItem(fileName, existingLogs + logLine);
        } catch (e) {
            console.warn('Erreur sauvegarde log:', e);
        }

        // Envoi au serveur si disponible (optionnel)
        this.sendToServer(logEntry);
    }

    info(category, message, data = null) {
        this.log(category, 'info', message, data);
    }

    warn(category, message, data = null) {
        this.log(category, 'warn', message, data);
    }

    error(category, message, data = null) {
        this.log(category, 'error', message, data);
    }

    debug(category, message, data = null) {
        this.log(category, 'debug', message, data);
    }

    sendToServer(logEntry) {
        // Optionnel: envoyer les logs critiques au serveur
        if (logEntry.level === 'ERROR' && navigator.onLine) {
            try {
                fetch('/api/logs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(logEntry)
                }).catch(() => {}); // Silent fail
            } catch (e) {
                // Ignore les erreurs réseau
            }
        }
    }

    cleanupOldLogs() {
        try {
            const keys = Object.keys(localStorage);
            const logKeys = keys.filter(key => key.startsWith('abview-') && key.endsWith('.log'));

            logKeys.forEach(key => {
                const dateMatch = key.match(/abview-\w+-(\d{4}-\d{2}-\d{2})\.log/);
                if (dateMatch) {
                    const logDate = new Date(dateMatch[1]);
                    const daysDiff = (Date.now() - logDate.getTime()) / (1000 * 60 * 60 * 24);

                    if (daysDiff > this.maxDays) {
                        localStorage.removeItem(key);
                        this.info('system', `Log file cleaned up: ${key}`);
                    }
                }
            });
        } catch (e) {
            console.warn('Erreur nettoyage logs:', e);
        }
    }

    getLogs(category, days = 1) {
        try {
            const logs = [];
            for (let i = 0; i < days; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const fileName = `abview-${category}-${dateStr}.log`;

                const logData = localStorage.getItem(fileName);
                if (logData) {
                    const lines = logData.trim().split('\n');
                    logs.push(...lines.map(line => JSON.parse(line)));
                }
            }
            return logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        } catch (e) {
            console.warn('Erreur récupération logs:', e);
            return [];
        }
    }
}

// Instance globale
const logger = new Logger();

// Exports pour utilisation
export default logger;
export const log = {
    theme: (level, message, data) => logger.log('theme', level, message, data),
    api: (level, message, data) => logger.log('api', level, message, data),
    error: (level, message, data) => logger.log('error', level, message, data),
    scroll: (level, message, data) => logger.log('scroll', level, message, data),
    audio: (level, message, data) => logger.log('audio', level, message, data),
    system: (level, message, data) => logger.log('system', level, message, data)
};