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
            <!-- Conteneur des colonnes -->
            <div class="tasks-columns">
            <div
                v-for="(tasks, listTitle, index) in sortedGroupedTasks"
                :key="listTitle"
                class="task-column"
                :class="{ 'dark-postit': isDarkPostIt(listTitle) }"
                :ref="(el) => (taskColumns[index] = el)"
                :style="{
                    '--rotation': Math.random() * 6 - 3 + 'deg',
                    '--postit-bg': getPostItColor(listTitle),
                }"
            >
                <div class="column-title">{{ listTitle }}</div>
                <div class="tasks-container">
                    <div
                        v-for="task in tasks"
                        :key="task.id"
                        class="task-card"
                        :class="{ completed: task.status === 'completed' }"
                    >
                        <div class="task-header">
                            <input
                                type="checkbox"
                                :checked="task.status === 'completed'"
                                @change="toggleTaskStatus(task)"
                                class="task-checkbox"
                            />
                            <span class="task-title">{{ task.title }}</span>
                            <span
                                v-if="task.status !== 'completed' && task.due"
                                class="task-due"
                            >
                                {{ formatDate(task.due) }}
                            </span>
                        </div>
                        <div v-if="task.notes" class="task-notes">
                            <span
                                >Notes : <em>{{ task.notes }}</em></span
                            >
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </template>
    </div>
</template>

<script>
import { getApiUrl } from "../utils/dateUtils";
import logger from "../utils/logger.js";

export default {
    name: "TasksBoard",
    data() {
        return {
            tasks: [],
            lastUpdate: null,
            sortedTasks: {},
            taskColumns: [],
            columnTitles: [],
            columnScrollable: [],
            cycleWaiters: {},
            loading: true,
            error: null,
            verticalCycleTimes: {},
            refreshInterval: null,
        };
    },
    computed: {
        groupedTasks() {
            const grouped = {};
            this.tasks.forEach((task) => {
                const listName = task.taskListTitle || "Sans titre";
                if (!grouped[listName]) grouped[listName] = [];
                grouped[listName].push(task);
            });
            return grouped;
        },
        sortedGroupedTasks() {
            const grouped = this.groupedTasks;
            // Trier par nombre de tâches (décroissant) : plus grand en premier
            const sortedLists = Object.keys(grouped).sort((a, b) => {
                return grouped[b].length - grouped[a].length;
            });

            // Réorganiser pour mettre les plus grandes listes au centre
            // Exemple avec [8,6,3,1,1] → [1,6,8,3,1] : petits aux bords, grands au centre
            const centeredLists = [];
            const leftSide = [];
            const rightSide = [];

            for (let i = 0; i < sortedLists.length; i++) {
                if (i === 0) {
                    // Le plus grand au centre
                    centeredLists.push(sortedLists[i]);
                } else if (i === 1) {
                    // Le deuxième plus grand à gauche du centre
                    leftSide.unshift(sortedLists[i]);
                } else if (i === 2) {
                    // Le troisième plus grand à droite du centre
                    rightSide.push(sortedLists[i]);
                } else {
                    // Les autres alternés aux extrémités
                    if (leftSide.length <= rightSide.length) {
                        leftSide.unshift(sortedLists[i]);
                    } else {
                        rightSide.push(sortedLists[i]);
                    }
                }
            }

            // Combiner : gauche + centre + droite
            const finalOrder = [...leftSide, ...centeredLists, ...rightSide];

            const sortedGrouped = {};
            finalOrder.forEach((listName) => {
                sortedGrouped[listName] = grouped[listName].sort((a, b) => {
                    const dateA = a.due ? new Date(a.due) : new Date(0);
                    const dateB = b.due ? new Date(b.due) : new Date(0);
                    return dateA - dateB;
                });
            });
            return sortedGrouped;
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
                console.error(
                    "Erreur lors de la mise à jour du statut de la tâche :",
                    error
                );
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
                    console.error(
                        "Erreur fallback lors de la mise à jour du statut de la tâche :",
                        fallbackError
                    );
                }
            }
        },
        startIndependentScroll() {
            this.columnTitles = [];
            this.columnScrollable = [];
            this.cycleWaiters = {};
            
            for (let i = 0; i < this.taskColumns.length; i++) {
                const col = this.taskColumns[i];
                if (!col) continue;
                
                const title =
                    col.querySelector(".column-title")?.textContent?.trim() ??
                    `#${i}`;
                const container = col.querySelector(".tasks-container");
                if (!container) continue;
                
                const isScrollable =
                    container.scrollHeight > container.clientHeight;
                this.columnTitles[i] = title;
                this.columnScrollable[i] = isScrollable;
                this.cycleWaiters[i] = [];
                
                // Toujours démarrer le scroll vertical si overflow vertical
                if (isScrollable) {
                    this.scrollLoop(container, i);
                }
            }
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
            const step = 1; // pixels par frame
            const delay = 16; // ms entre chaque frame (~60fps)
            let firstLoop = true;

            while (true) {
                const cycleStart = performance.now();

                // Scroll vers le bas
                await this.scrollOneDirection(container, "down", colIndex);

                // Pause en bas 5s
                await this.wait(
                    5000,
                    `V: pause bas col ${colIndex} "${title}"`
                );

                // Scroll vers le haut
                await this.scrollOneDirection(container, "up", colIndex);

                // Pause en haut 5s
                await this.wait(
                    5000,
                    `V: pause haut col ${colIndex} "${title}"`
                );

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
            const step = 1; // pixels par frame
            const delay = 16;
            return new Promise((resolve) => {
                const interval = setInterval(() => {
                    if (direction === "down") {
                        container.scrollTop += step;
                        if (
                            container.scrollTop >=
                            container.scrollHeight - container.clientHeight
                        ) {
                            clearInterval(interval);
                            resolve();
                        }
                    } else {
                        container.scrollTop -= step;
                        if (container.scrollTop <= 0) {
                            clearInterval(interval);
                            resolve();
                        }
                    }
                }, delay);
            });
        },
        wait(ms) {
            return new Promise((resolve) => setTimeout(() => resolve(), ms));
        },
        async horizontalScrollLoop() {
            console.log("🔄 horizontalScrollLoop DÉMARRÉ");
            const board = this.$refs.tasksBoard?.querySelector(".tasks-columns");
            
            if (!board) {
                console.error("❌ Board non trouvé, retry dans 500ms");
                setTimeout(() => this.horizontalScrollLoop(), 500);
                return;
            }
            
            const step = 2;
            const delay = 16;
            const DEFAULT_WAIT = 10000; // 10 secondes si pas d'overflow vertical

            // Attendre que le layout soit stable (important en prod)
            await this.wait(500);

            // Check if horizontal scroll is actually needed
            console.log("📏 Vérification scroll nécessaire:", {
                scrollWidth: board.scrollWidth,
                clientWidth: board.clientWidth,
                needsScroll: board.scrollWidth > board.clientWidth
            });
            
            if (board.scrollWidth <= board.clientWidth) {
                console.log("❌ Pas besoin de scroll horizontal, arrêt");
                return;
            }

            const firstColIndex = 0;
            const lastColIndex = this.taskColumns.length - 1;

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
                console.log("➡️ Scroll droite");
                await this.scrollBoard(board, target, step, delay);

                // Attente à droite (dernière liste)
                const rightWait = await getWaitTime(lastColIndex);
                console.log(`⏸️ Attente droite: ${rightWait}ms (colonne ${lastColIndex}, scrollable: ${this.columnScrollable[lastColIndex]})`);
                await this.wait(rightWait);
                
                // Scroll vers la gauche
                console.log("⬅️ Scroll gauche");
                await this.scrollBoard(board, 0, step, delay);

                // Attente à gauche (première liste)
                const leftWait = await getWaitTime(firstColIndex);
                console.log(`⏸️ Attente gauche: ${leftWait}ms (colonne 0, scrollable: ${this.columnScrollable[firstColIndex]})`);
                await this.wait(leftWait);
            }
        },
        scrollBoard(board, target, step, delay) {
            console.log("scrollBoard appelé - target:", target, "current:", board.scrollLeft);
            console.log("scrollBoard - scrollWidth:", board.scrollWidth, "clientWidth:", board.clientWidth);
            return new Promise((resolve) => {
                let iterations = 0;
                const maxIterations = 10000; // Sécurité pour éviter boucle infinie
                
                const interval = setInterval(() => {
                    iterations++;
                    
                    if (iterations > maxIterations) {
                        console.error("❌ scrollBoard timeout après", maxIterations, "itérations");
                        clearInterval(interval);
                        resolve();
                        return;
                    }
                    
                    const currentScroll = board.scrollLeft;
                    
                    if (currentScroll < target) {
                        board.scrollLeft += step;
                        const newScroll = board.scrollLeft;
                        
                        if (iterations % 50 === 0) {
                            console.log("➡️ Scrolling right, iteration:", iterations, "scroll:", newScroll);
                        }
                        
                        if (newScroll >= target || newScroll === currentScroll) {
                            console.log("✅ scrollBoard terminé (droite) - position:", newScroll, "iterations:", iterations);
                            clearInterval(interval);
                            resolve();
                        }
                    } else if (currentScroll > target) {
                        board.scrollLeft -= step;
                        const newScroll = board.scrollLeft;
                        
                        if (iterations % 50 === 0) {
                            console.log("⬅️ Scrolling left, iteration:", iterations, "scroll:", newScroll);
                        }
                        
                        if (newScroll <= target || newScroll === currentScroll) {
                            console.log("✅ scrollBoard terminé (gauche) - position:", newScroll, "iterations:", iterations);
                            clearInterval(interval);
                            resolve();
                        }
                    } else {
                        console.log("✅ scrollBoard terminé (déjà à target) - position:", currentScroll);
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
                    this.tasks = data.tasks || [];
                    this.lastUpdate = data.lastUpdate ? new Date(data.lastUpdate) : null;
                    logger.log('api', `Tasks API success: ${this.tasks.length} tasks loaded`);
                    this.loading = false;
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
                this.tasks = data.tasks || [];
                this.lastUpdate = data.lastUpdate ? new Date(data.lastUpdate) : null;
                logger.log('api', `Tasks refresh success: ${this.tasks.length} tasks updated`);
            } catch (err) {
                logger.log('error', `Tasks refresh failed: ${err.message}`);
            }
        },
    },
    mounted() {
        logger.log('system', 'Tasks module component mounted, starting loadTasks');
        logger.log('system', `Tasks API URL test: ${getApiUrl("/tasks")}`);
        this.loadTasks();
        
        // Rafraîchissement automatique toutes les 5 minutes
        this.refreshInterval = setInterval(() => {
            logger.log('system', 'Periodic tasks refresh started');
            this.refreshTasks();
        }, 5 * 60 * 1000);
    },
    beforeUnmount() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    },
};
</script>

<style scoped>
.tasks-board {
    background: var(--module-bg, #e0e0e0);
    color: var(--color-text);
    padding: 0.5%;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    height: 100%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow: hidden;
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
    gap: 0.8%;
    overflow-x: auto;
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
    transform: rotate(var(--rotation));
    border-radius: 10px;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    height: 100%;
    width: 23%;
    position: relative;
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);
    border: 1px solid #ccc;
    color: #000;
    padding: 1%;
    box-sizing: border-box;
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

</style>
