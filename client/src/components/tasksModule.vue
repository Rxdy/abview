```vue
<template>
    <div class="tasks-board" ref="tasksBoard">
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
                :ref="(el) => (taskColumns[index] = el)"
                :style="{
                    '--rotation': Math.random() * 6 - 3 + 'deg',
                    '--postit-bg': randomPostItColor(),
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
    </div>
</template>

<script>
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
            verticalCycleTimes: {},
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
            const sortedLists = Object.keys(grouped).sort((a, b) => {
                return grouped[b].length - grouped[a].length;
            });
            const sortedGrouped = {};
            sortedLists.forEach((listName) => {
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
        randomPostItColor() {
            const colors = [
                "#fff9a6",
                "#ffd1dc",
                "#c3f7d6",
                "#cce0ff",
                "#ffe6b3",
            ];
            return colors[Math.floor(Math.random() * colors.length)];
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
                const response = await fetch(
                    `http://127.0.0.1:3333/tasks/${task.id}`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ status: newStatus }),
                    }
                );
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
            }
        },
        startIndependentScroll() {
            this.columnTitles = [];
            this.columnScrollable = [];
            this.cycleWaiters = {};
            
            // Check if horizontal scroll is needed
            const board = this.$refs.tasksBoard.querySelector(".tasks-columns");
            const hasHorizontalOverflow = board.scrollWidth > board.clientWidth;
            
            for (let i = 0; i < this.taskColumns.length; i++) {
                const col = this.taskColumns[i];
                const title =
                    col.querySelector(".column-title")?.textContent?.trim() ??
                    `#${i}`;
                const container = col.querySelector(".tasks-container");
                const isScrollable =
                    container.scrollHeight > container.clientHeight;
                this.columnTitles[i] = title;
                this.columnScrollable[i] = isScrollable;
                this.cycleWaiters[i] = [];
                
                // Only start vertical scroll if horizontal overflow exists
                if (isScrollable && hasHorizontalOverflow) {
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
            const board = this.$refs.tasksBoard.querySelector(".tasks-columns");
            const step = 2;
            const delay = 16;

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

            // Attendre que le DOM ait fini de rendre tous les post-it avec leur largeur et rotation
            await this.$nextTick();
            console.log("✅ $nextTick terminé");
            await this.wait(50, "H: wait post-it render");
            console.log("✅ Attente 50ms terminée");

            // Attendre que la boucle verticale de la première colonne soit connue
            console.log("⏳ Attente cycle vertical première colonne...");
            while (
                this.columnScrollable[firstColIndex] &&
                this.verticalCycleTimes[firstColIndex] === undefined
            ) {
                await this.wait(50, "H: polling cycle vertical col 0");
                console.log("⏳ Polling cycle vertical col 0...");
            }

            // Si la première colonne n'est pas scrollable, on attend 10 secondes
            if (!this.columnScrollable[firstColIndex]) {
                console.log("⏸️ Première colonne non-scrollable, pause 10s");
                await this.wait(
                    10000,
                    "H: init première colonne non-scrollable"
                );
                console.log("✅ Pause 10s terminée");
            } else {
                console.log("⏸️ Attente cycle vertical première colonne:", this.verticalCycleTimes[firstColIndex], "ms");
                await this.wait(
                    this.verticalCycleTimes[firstColIndex],
                    "H: init cycle vertical réel col 0"
                );
                console.log("✅ Cycle vertical première colonne terminé");
            }

            // Boucle infinie pour le défilement horizontal
            let cycleCount = 0;
            while (true) {
                cycleCount++;
                console.log(`\n🔁 ===== CYCLE ${cycleCount} DÉBUT =====`);
                // Scroll vers la droite
                const target = board.scrollWidth - board.clientWidth;
                console.log("➡️ Scroll vers la droite, target:", target, "current:", board.scrollLeft);
                await this.scrollBoard(board, target, step, delay);
                console.log("✅ Arrivé à droite");

                const lastIndex = this.taskColumns.length - 1;
                console.log("📍 Dernière colonne:", lastIndex, "scrollable:", this.columnScrollable[lastIndex]);
                if (this.columnScrollable[lastIndex]) {
                    // attendre UNE boucle verticale complète (down+up)
                    console.log("⏳ Attente cycle vertical dernière colonne...");
                    await this.waitForNextVerticalCycle(lastIndex);
                    console.log("✅ Cycle vertical dernière colonne terminé");
                } else {
                    // Si pas scrollable, attendre 10 secondes
                    console.log("⏸️ Dernière colonne non-scrollable, pause 10s");
                    await this.wait(10000);
                    console.log("✅ Pause 10s terminée");
                }
                
                console.log("⬅️ Début du retour vers la gauche");

                
                // Scroll vers la gauche
                console.log("⬅️ Scroll vers la gauche, target: 0, current:", board.scrollLeft);
                await this.scrollBoard(board, 0, step, delay);
                console.log("✅ Retourné à gauche");

                // attendre UNE boucle verticale complète (down+up)
                if (this.columnScrollable[firstColIndex]) {
                    console.log("⏳ Attente cycle vertical première colonne...");
                    await this.waitForNextVerticalCycle(firstColIndex);
                    console.log("✅ Cycle vertical première colonne terminé");
                } else {
                    console.log("⏸️ Première colonne non-scrollable, pause 10s");
                    await this.wait(10000);
                    console.log("✅ Pause 10s terminée");
                }
                
                console.log(`🔁 ===== CYCLE ${cycleCount} FIN =====\n`);
                console.log("🔄 Redémarrage du cycle...");
                // La boucle while(true) reprend automatiquement
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
    },
    mounted() {
        fetch("http://127.0.0.1:3333/tasks")
            .then((res) => res.json())
            .then((data) => {
                this.tasks = data.tasks || [];
                this.lastUpdate = data.lastUpdate
                    ? new Date(data.lastUpdate)
                    : null;
                console.log("lastUpdate:", this.lastUpdate);
                this.$nextTick(() => {
                    this.startIndependentScroll();
                    // Wait a bit for columns to render before starting horizontal scroll
                    setTimeout(() => {
                        this.horizontalScrollLoop();
                    }, 100);
                });
            })
            .catch((err) => console.error(err));
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
    width: 30%;
    position: relative;
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);
    border: 1px solid #ccc;
    color: #000 !important; /* Forcer tout le texte de la colonne en noir */
    padding: 1%;
    box-sizing: border-box;
}
.column-title {
    font-weight: bold;
    text-align: center;
    margin-bottom: 0.5rem;
    flex-shrink: 0;
    color: #000 !important; /* Titre toujours noir */
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
```
