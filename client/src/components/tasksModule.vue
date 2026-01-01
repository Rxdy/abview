<template>
    <div class="tasks-board" ref="tasksBoard">
        <!-- Loading state -->
        <div v-if="loading" class="tasks-loading">
            <span>Chargement des tâches...</span>
        </div>
        <!-- Error state -->
        <div v-else-if="error" class="tasks-error">
            <span>{{ error }}</span>
        </div>
        <!-- Content -->
        <template v-else>
            <!-- Header : mise à jour -->
            <div v-if="lastUpdate" class="tasks-header">
                <div class="last-update">
                    Mise à jour : {{ formatLastUpdate(lastUpdate) }}
                </div>
            </div>
            <!-- Conteneur des listes -->
            <div class="tasks-columns">
                <TaskList
                    v-for="list in sortedLists"
                    :key="list.id"
                    :list="list"
                    @toggle-status="toggleTaskStatus"
                />
            </div>
        </template>

        <!-- Barre de progression du refresh -->
        <div class="progress-bar">
            <div class="progress-fill" :style="{ width: tasksProgress + '%' }"></div>
        </div>
    </div>
</template>

<script>
import { getApiUrl } from "../utils/dateUtils";
import logger from "../utils/logger.js";
import TaskList from './TaskList.vue'

export default {
    name: "TasksBoard",
    components: {
        TaskList,
    },
    data() {
        return {
            lists: [],
            lastUpdate: null,
            sortedTasks: {},
            taskColumns: new Map(), // Change to Map to avoid read-only issues
            columnTitles: [],
            columnScrollable: [],
            cycleWaiters: {},
            loading: true,
            error: null,
            verticalCycleTimes: {},
            scrollStates: [], // Track scroll state for each column
            savedScrollPositions: [], // Save positions during updates
            isScrollingActive: false,
            refreshInterval: null,
            lastFetchTime: Date.now(),
            currentTime: Date.now(),
            progressTimer: null,
        };
    },
    computed: {
        sortedLists() {
            return this.lists.sort((a, b) => b.tasks.length - a.tasks.length);
        },
        tasksProgress() {
            const refreshInterval = 5 * 60 * 1000; // 5 minutes
            const timeSinceLast = this.currentTime - this.lastFetchTime;
            return Math.min((timeSinceLast / refreshInterval) * 100, 100);
        },
    },
    methods: {
        formatLastUpdate(date) {
            if (!date) return "";
            const hours = String(date.getHours()).padStart(2, "0");
            const minutes = String(date.getMinutes()).padStart(2, "0");
            return `${hours}h${minutes}`;
        },
        getPostItColor(listTitle) {
            // Couleurs spécifiques par nom de liste
            const colorMap = {
                'Luis': '#004C99',      // Bleu FC Porto
                'Julie': '#ffd1dc',     // Rose
                'Courses': '#e74c3c',   // Rouge
                'Caroline': '#f39c12',  // Orange
                'Rudy': '#1e293b',      // Bleu header/footer
                'Général': '#9b59b6',   // Violet (complémentaire)
            };
            
            // Couleurs aléatoires pour les autres listes
            const randomColors = [
                "#fff9a6",  // Jaune
                "#ffd1dc",  // Rose
                "#c3f7d6",  // Vert
                "#cce0ff",  // Bleu clair
                "#ffe6b3",  // Orange clair
            ];
            
            // Chercher correspondance (insensible à la casse)
            const normalizedTitle = listTitle?.trim();
            for (const [name, color] of Object.entries(colorMap)) {
                if (normalizedTitle?.toLowerCase() === name.toLowerCase()) {
                    return color;
                }
            }
            
            // Couleur aléatoire pour les listes inconnues
            return randomColors[Math.floor(Math.random() * randomColors.length)];
        },
        isDarkPostIt(listTitle) {
            // Listes avec fond sombre qui nécessitent du texte blanc
            const darkLists = ['Luis', 'Rudy'];
            const normalizedTitle = listTitle?.trim()?.toLowerCase();
            return darkLists.some(name => normalizedTitle === name.toLowerCase());
        },
        getRotation(listTitle) {
            // Rotation consistante basée sur le titre de la liste
            let hash = 0;
            for (let i = 0; i < listTitle.length; i++) {
                hash = ((hash << 5) - hash) + listTitle.charCodeAt(i);
                hash = hash & hash; // Convertir en 32 bits
            }
            // Retourner une rotation entre -3 et 3 degrés
            return (Math.abs(hash) % 6) - 3;
        },
        formatDate(dateStr) {
            const d = new Date(dateStr);
            return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
        },
        ts() {
            const d = new Date();
            return `${d.toLocaleTimeString("fr-FR", {
                hour12: false,
            })}.${String(d.getMilliseconds()).padStart(3, "0")}`;
        },
        async toggleTaskStatus(task) {
            try {
                const newStatus =
                    task.status === "completed" ? "needsAction" : "completed";
                // Utiliser getApiUrl pour que ça fonctionne en prod et dev
                const apiUrl = getApiUrl("/tasks/" + task.id);
                
                const response = await fetch(apiUrl, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ status: newStatus }),
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                task.status = newStatus;
                task.completed =
                    newStatus === "completed" ? new Date().toISOString() : null;
                this.$forceUpdate();
            } catch (error) {
                // Erreur silencieuse
                // Fallback vers localhost si l'URL dynamique ne marche pas
                try {
                    const newStatus =
                        task.status === "completed" ? "needsAction" : "completed";
                    const fallbackUrl = "http://127.0.0.1:3333/tasks/" + task.id;
                    
                    const response = await fetch(fallbackUrl, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ status: newStatus }),
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    task.status = newStatus;
                    task.completed =
                        newStatus === "completed" ? new Date().toISOString() : null;
                    this.$forceUpdate();
                } catch (fallbackError) {
                    // Erreur silencieuse
                }
            }
        },
        setTaskColumnRef(el, index) {
            if (el) {
                this.taskColumns.set(index, el);
            } else {
                this.taskColumns.delete(index);
            }
        },
        preserveScrollPositions() {
            this.savedScrollPositions = [];
            this.taskColumns.forEach((col, i) => {
                const container = col?.querySelector(".tasks-container");
                if (container) {
                            this.savedScrollPositions[i] = container.scrollTop;
                }
            });

        },
        restoreScrollPositions() {
            this.$nextTick(() => {
                this.taskColumns.forEach((col, i) => {
                    const container = col?.querySelector(".tasks-container");
                    if (container && this.savedScrollPositions[i] !== undefined) {
                        container.scrollTop = this.savedScrollPositions[i];
                    }
                });
            });
        },
        startIndependentScroll() {
            
            // Prevent multiple scroll initialization
            if (this.isScrollingActive) {
                return;
            }
            
            this.isScrollingActive = true;
            
            // Wait for DOM to be ready
            this.$nextTick(() => {
                // taskColumns is now managed via setTaskColumnRef, no need to query
                
                
                this.columnTitles = [];
                this.columnScrollable = [];
                this.cycleWaiters = {};
                this.scrollStates = []; // Initialize scroll states
                
                this.taskColumns.forEach((col, i) => {
                    if (!col) {
                        return; // use return instead of continue in forEach
                    }
                    
                    const title =
                        col.querySelector(".column-title")?.textContent?.trim() ??
                        `#${i}`;
                    const container = col.querySelector(".tasks-container");
                    if (!container) {
                        return; // use return instead of continue in forEach
                    }
                    
                    const isScrollable =
                        container.scrollHeight > container.clientHeight;
                    
                    this.columnTitles[i] = title;
                    this.columnScrollable[i] = isScrollable;
                    this.cycleWaiters[i] = [];
                    this.scrollStates[i] = { active: false, interval: null };
                    
                    // Toujours démarrer le scroll vertical si overflow vertical
                    if (isScrollable && !this.scrollStates[i].active) {
                        
                        this.scrollStates[i].active = true;
                        this.scrollLoop(container, i);
                    } else if (!isScrollable) {
                        
                    }
                });
            });
        },
        waitForNextVerticalCycle(i) {
            return new Promise((resolve) => this.cycleWaiters[i].push(resolve));
        },
        notifyVerticalCycle(i) {
            const resolver = this.cycleWaiters[i].shift();
            if (resolver) resolver();
        },
        async scrollLoop(container, colIndex) {
            const title = this.columnTitles[colIndex] ?? `#${colIndex}`;
            let firstLoop = true;
            let cycleCount = 0;

            

            while (this.scrollStates[colIndex]?.active) {
                cycleCount++;
                const cycleStart = performance.now();
                

                // Check if still scrollable (content might have changed)
                const isStillScrollable = container.scrollHeight > container.clientHeight;
                if (!isStillScrollable) {
                    
                    this.scrollStates[colIndex].active = false;
                    break;
                }

                // Scroll vers le bas
                const maxScrollNow = container.scrollHeight - container.clientHeight;
                await this.scrollOneDirection(container, "down", colIndex);
                

                // Pause en bas 5s
                
                await this.wait(5000);

                // Check if still active before continuing
                if (!this.scrollStates[colIndex]?.active) {
                    
                    break;
                }

                // Scroll vers le haut
                
                await this.scrollOneDirection(container, "up", colIndex);
                

                // Pause en haut 5s
                
                await this.wait(5000);

                const cycleEnd = performance.now();
                const cycleTime = cycleEnd - cycleStart;
                

                // Stocker le temps de cycle pour synchronisation horizontal
                this.verticalCycleTimes[colIndex] = cycleTime;

                // Notifier les awaiters horizontaux
                this.notifyVerticalCycle(colIndex);

                if (firstLoop) firstLoop = false;
            }
            
            
        },
        scrollOneDirection(container, direction, colIndex) {
            const step = 1;
            const delay = 30;
            const title = this.columnTitles[colIndex] ?? `#${colIndex}`;
            const maxScroll = container.scrollHeight - container.clientHeight;
            console.log(`📜 Scroll ${direction} col ${colIndex} "${title}" - max=${maxScroll}, target=${direction === 'down' ? maxScroll : 0}`);
            
            return new Promise((resolve) => {
                let scrollPos = container.scrollTop;
                const directionMultiplier = direction === 'down' ? 1 : -1;
                
                const interval = setInterval(() => {
                    // Check if scroll is still active
                    if (!this.scrollStates[colIndex]?.active) {
                        clearInterval(interval);
                        resolve();
                        return;
                    }
                    
                    scrollPos += step * directionMultiplier;
                    container.scrollTop = scrollPos;
                    
                    if (direction === 'down' && scrollPos >= maxScroll) {
                        console.log(`✅ Scroll down terminé col ${colIndex} "${title}" - finalPos=${scrollPos}`);
                        clearInterval(interval);
                        resolve();
                    } else if (direction === 'up' && scrollPos <= 0) {
                        console.log(`✅ Scroll up terminé col ${colIndex} "${title}" - finalPos=${scrollPos}`);
                        clearInterval(interval);
                        resolve();
                    }
                }, delay);
                
                // Store interval reference for cleanup
                if (this.scrollStates[colIndex]) {
                    this.scrollStates[colIndex].interval = interval;
                }
            });
        },
        wait(ms) {
            return new Promise((resolve) => setTimeout(() => resolve(), ms));
        },
        async horizontalScrollLoop() {
            const board = this.$refs.tasksBoard?.querySelector(".tasks-columns");
            
            if (!board) {
                setTimeout(() => this.horizontalScrollLoop(), 500);
                return;
            }
            
            const step = 2;
            const delay = 16;
            const DEFAULT_WAIT = 10000; // 10 secondes si pas d'overflow vertical

            // Attendre que le layout soit stable (important en prod)
            await this.wait(500);

            // Check if horizontal scroll is actually needed
            if (board.scrollWidth <= board.clientWidth) {
                return;
            }

            // Compute numeric first/last indices from Map keys (supports Map used for refs)
            const keys = Array.from(this.taskColumns.keys())
                .map((k) => Number(k))
                .filter((n) => !Number.isNaN(n))
                .sort((a, b) => a - b);
            if (keys.length === 0) return;
            const firstColIndex = keys[0];
            const lastColIndex = keys[keys.length - 1];

            // Attendre que le DOM ait fini de rendre
            await this.$nextTick();
            await this.wait(50);

            // Fonction helper pour obtenir le temps d'attente d'une colonne
            const getWaitTime = async (colIndex) => {
                if (!this.columnScrollable[colIndex]) {
                    return DEFAULT_WAIT;
                }
                // Attendre que le cycle vertical soit mesuré
                while (this.verticalCycleTimes[colIndex] === undefined) {
                    await this.wait(50);
                }
                return this.verticalCycleTimes[colIndex];
            };

            // Attente initiale à gauche (première liste)
            const initialWait = await getWaitTime(firstColIndex);
            console.log(`⏸️ Attente initiale: ${initialWait}ms (colonne 0, scrollable: ${this.columnScrollable[firstColIndex]})`);
            await this.wait(initialWait);

            // Boucle infinie pour le défilement horizontal
            let cycleCount = 0;
            while (true) {
                cycleCount++;
                console.log(`\n🔁 ===== CYCLE ${cycleCount} =====`);
                
                // Scroll vers la droite
                const target = board.scrollWidth - board.clientWidth;
                await this.scrollBoard(board, target, step, delay);

                // Attente à droite (dernière liste)
                const rightWait = await getWaitTime(lastColIndex);
                await this.wait(rightWait);
                
                // Scroll vers la gauche
                await this.scrollBoard(board, 0, step, delay);

                // Attente à gauche (première liste)
                const leftWait = await getWaitTime(firstColIndex);
                await this.wait(leftWait);
            }
        },
        scrollBoard(board, target, step, delay) {
            return new Promise((resolve) => {
                let iterations = 0;
                const maxIterations = 10000; // Sécurité pour éviter boucle infinie
                
                const interval = setInterval(() => {
                    iterations++;
                    
                    if (iterations > maxIterations) {
                        clearInterval(interval);
                        resolve();
                        return;
                    }
                    
                    const currentScroll = board.scrollLeft;
                    
                    if (currentScroll < target) {
                        board.scrollLeft += step;
                        const newScroll = board.scrollLeft;
                        
                        if (newScroll >= target || newScroll === currentScroll) {
                            clearInterval(interval);
                            resolve();
                        }
                    } else if (currentScroll > target) {
                        board.scrollLeft -= step;
                        const newScroll = board.scrollLeft;
                        
                        if (newScroll <= target || newScroll === currentScroll) {
                            clearInterval(interval);
                            resolve();
                        }
                    } else {
                        clearInterval(interval);
                        resolve();
                    }
                }, delay);
            });
        },
        async loadTasks() {
            this.loading = true;
            this.error = null;
            const apiUrl = getApiUrl("/tasks");
            logger.log('api', `Fetching tasks from API: ${apiUrl}`);
            
            // Essayer plusieurs fois avec délai croissant
            const maxRetries = 5;
            let lastError = null;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    logger.log('api', `Tasks API attempt ${attempt}/${maxRetries}`);
                    const res = await fetch(apiUrl);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const data = await res.json();
                    this.lists = data.lists || [];
                    this.lastUpdate = data.lastUpdate ? new Date(data.lastUpdate) : null;
                    logger.log('api', `Tasks API success: ${this.tasks.length} tasks loaded`);
                    this.loading = false;
                    this.lastFetchTime = Date.now();
                    this.$nextTick(() => {
                        this.startIndependentScroll();
                        // Délai plus long pour que le CSS soit stable en prod
                        setTimeout(() => this.horizontalScrollLoop(), 1000);
                    });
                    return; // Succès, on sort
                } catch (err) {
                    logger.log('error', `Tasks API attempt ${attempt} failed: ${err.message}`);
                    lastError = err;
                    if (attempt < maxRetries) {
                        // Attendre avant de réessayer (2s, 4s, 6s, 8s)
                        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
                    }
                }
            }
            
            // Toutes les tentatives ont échoué
            logger.log('error', `Tasks API all attempts failed: ${lastError?.message}`);
            this.error = `Erreur après ${maxRetries} tentatives: ${lastError?.message}. API: ${apiUrl}`;
            this.loading = false;
        },
        async refreshTasks() {
            // Rafraîchissement silencieux sans recharger tout le composant
            const apiUrl = getApiUrl("/tasks");
            try {
                logger.log('api', 'Refreshing tasks from API');
                const res = await fetch(apiUrl);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const newLists = data.lists || [];
                // Ne mettre à jour que si les tâches ont changé
                if (JSON.stringify(newLists) !== JSON.stringify(this.lists)) {
                    this.lists = newLists;
                    this.lastUpdate = data.lastUpdate ? new Date(data.lastUpdate) : null;
                    logger.log('api', `Tasks refresh success: ${this.tasks.length} tasks updated`);
                } else {
                    logger.log('api', 'Tasks refresh: no changes');
                }
                this.lastFetchTime = Date.now();
            } catch (err) {
                logger.log('error', `Tasks refresh failed: ${err.message}`);
            }
        },
    },
    mounted() {
        logger.log('system', 'Tasks module component mounted, starting loadTasks');
        logger.log('system', `Tasks API URL test: ${getApiUrl("/tasks")}`);
        this.loadTasks();
        
        // Calculer le délai pour la prochaine mise à jour alignée sur les 5 minutes
        const now = new Date();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const nextUpdateMinutes = Math.ceil((minutes + 1) / 5) * 5 % 60;
        const delayMs = ((nextUpdateMinutes - minutes) * 60 - seconds) * 1000;
        if (delayMs > 0) {
            setTimeout(() => {
                logger.log('system', 'Periodic tasks refresh started');
                this.refreshTasks();
                this.refreshInterval = setInterval(() => {
                    logger.log('system', 'Periodic tasks refresh started');
                    this.refreshTasks();
                }, 5 * 60 * 1000);
            }, delayMs);
        } else {
            this.refreshInterval = setInterval(() => {
                logger.log('system', 'Periodic tasks refresh started');
                this.refreshTasks();
            }, 5 * 60 * 1000);
        }

        // Timer pour la barre de progression
        this.progressTimer = setInterval(() => {
            this.currentTime = Date.now();
        }, 1000);
    },
    beforeUnmount() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        if (this.progressTimer) {
            clearInterval(this.progressTimer);
        }
    },
};
</script>

<style scoped>
.tasks-board {
    height: 100%;
    background: var(--module-bg, #e0e0e0);
    color: var(--color-text);
    padding: 0.5%;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow: hidden;
    min-height: 0;
}
.tasks-loading,
.tasks-error {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    font-size: 1.2rem;
    color: var(--color-text);
}
.tasks-error {
    color: #ff6b6b;
    padding: 1rem;
    text-align: center;
    word-break: break-word;
}
.tasks-header {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 8px;
    padding-bottom: 5px;
    border-bottom: 1px solid var(--task-border-color);
    background: var(--module-bg, #e0e0e0);
}
.last-update {
    font-size: 12px;
    color: var(--color-text);
    text-align: center;
    width: 100%;
}
.tasks-columns {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow-y: auto;
    height: 100%;
    -ms-overflow-style: none;
    scrollbar-width: none;
    padding: 1%;
}
.tasks-columns::-webkit-scrollbar {
    display: none;
}
.task-column {
    background: var(--postit-bg);
    border-radius: 10px;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    height: auto;
    width: 100%;
    position: relative;
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);
    border: 1px solid #ccc;
    color: #000;
    padding: 1%;
    box-sizing: border-box;
    max-height: 50vh; /* Limit height for scroll */
}
.task-column.dark-postit {
    color: #fff;
    border-color: #555;
}
.task-column.dark-postit .column-title {
    color: #fff !important;
}
.task-column.dark-postit .task-card {
    background-color: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    color: #fff !important;
}
.task-column.dark-postit .task-title,
.task-column.dark-postit .task-due,
.task-column.dark-postit .task-notes {
    color: #fff !important;
}
.column-title {
    font-weight: bold;
    text-align: center;
    margin-bottom: 0.5rem;
    flex-shrink: 0;
    color: #000;
}
.tasks-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    overflow-y: auto;
    -ms-overflow-style: none;
    scrollbar-width: none;
}
.tasks-container::-webkit-scrollbar {
    display: none;
}
.task-card {
    background-color: rgba(255, 255, 255, 0.8);
    border: 1px solid #ccc;
    border-radius: 6px;
    padding: 0.25rem 0.3rem;
    flex-shrink: 0;
    width: 90%;
    margin: 0 auto;
    color: #000 !important; /* Forcer texte des cartes en noir */
    box-sizing: border-box;
    overflow: hidden;
    min-height: 1.8rem;
}
.task-card.completed {
    text-decoration: line-through;
    opacity: 0.7;
}
.task-header {
    display: flex;
    align-items: flex-start;
    gap: 0.4rem;
}
.task-checkbox {
    width: 0.95rem;
    height: 0.95rem;
    cursor: pointer;
    background-color: var(--checkbox-bg, #fff);
    border: 2px solid var(--checkbox-border, #000);
    border-radius: 4px;
    appearance: none;
    -webkit-appearance: none;
    transition: background-color 0.3s ease, border-color 0.3s ease;
    flex-shrink: 0;
    margin-top: 0.1rem;
}
.task-checkbox:checked {
    background-color: var(--checkbox-bg-checked, #4caf50);
    border-color: var(--checkbox-bg-checked, #4caf50);
    position: relative;
}
.task-checkbox:checked::after {
    content: "✔";
    color: #fff;
    font-size: 0.65rem;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}
.task-notes {
    font-size: 0.5rem;
    color: #000 !important; /* Notes en noir */
    margin-top: 0.1rem;
    padding-left: 0.25rem;
    word-break: break-word;
    line-height: 1.1;
}
.task-title {
    font-size: 0.75rem;
    font-weight: bold;
    color: #000 !important; /* Titre en noir */
    line-height: 1.15;
    flex: 1;
}
.task-due {
    font-size: 0.65rem;
    opacity: 0.9;
    margin-left: auto;
    color: #000 !important; /* Date en noir */
    white-space: nowrap;
    flex-shrink: 0;
}

/* Responsive */
@media (max-width: 768px) {
    .task-column {
        width: 45%;
        padding: 0.5%;
        height: 95%;
    }
    .task-card {
        width: 95%;
        padding: 0.2rem 0.25rem;
        min-height: 1.5rem;
    }
    .tasks-columns {
        gap: 1%;
        padding: 0.5%;
    }
    .tasks-container {
        gap: 0.3rem;
    }
    .task-header {
        gap: 0.3rem;
    }
    .task-title {
        font-size: 0.65rem;
        line-height: 1.1;
    }
    .task-notes {
        font-size: 0.4rem;
        line-height: 1;
        margin-top: 0.05rem;
        padding-left: 0.2rem;
    }
    .task-due {
        font-size: 0.55rem;
    }
    .task-checkbox {
        width: 0.8rem;
        height: 0.8rem;
        margin-top: 0.05rem;
    }
    .task-checkbox:checked::after {
        font-size: 0.55rem;
    }
}

.progress-bar {
    width: 100%;
    height: 5px;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
    margin-top: 10px;
    overflow: hidden;
}
.progress-fill {
    height: 100%;
    background-color: var(--color-accent, #007bff);
    transition: width 1s linear;
    border-radius: 2px;
}

</style>
