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
                if (isScrollable) this.scrollLoop(container, i);
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
            const board = this.$refs.tasksBoard.querySelector(".tasks-columns");
            const step = 2;
            const delay = 16;

            if (this.taskColumns.length <= 6) return; // pas besoin de scroll horizontal si peu de colonnes

            const firstColIndex = 0;

            // Attendre que le DOM ait fini de rendre tous les post-it avec leur largeur et rotation
            await this.$nextTick();
            await this.wait(50, "H: wait post-it render");

            // Attendre que la boucle verticale de la première colonne soit connue
            while (
                this.columnScrollable[firstColIndex] &&
                this.verticalCycleTimes[firstColIndex] === undefined
            ) {
                await this.wait(50, "H: polling cycle vertical col 0");
            }

            // Si la première colonne n'est pas scrollable, on attend 10 secondes
            if (!this.columnScrollable[firstColIndex]) {
                await this.wait(
                    10000,
                    "H: init première colonne non-scrollable"
                );
            } else {
                await this.wait(
                    this.verticalCycleTimes[firstColIndex],
                    "H: init cycle vertical réel col 0"
                );
            }

            let direction = "right";

            while (true) {
                if (board.scrollWidth <= board.clientWidth) return; // plus de scroll possible

                if (direction === "right") {
                    const target = board.scrollWidth - board.clientWidth;
                    await this.scrollBoard(board, target, step, delay);

                    const lastIndex = this.taskColumns.length - 1;
                    if (this.columnScrollable[lastIndex]) {
                        // attendre la fin de la boucle verticale si scrollable
                        const cycleTime =
                            this.verticalCycleTimes[lastIndex] ?? 5000;
                        await this.wait(
                            cycleTime,
                            `H: attendre cycle vertical col ${lastIndex}`
                        );
                    } else {
                        await this.wait(
                            10000,
                            "H: pause à droite (dernière non-scrollable)"
                        );
                    }

                    direction = "left";
                } else {
                    const target = 0;
                    await this.scrollBoard(board, target, step, delay);

                    // attendre que la première colonne soit en haut si scrollable
                    if (this.columnScrollable[firstColIndex]) {
                        const cycleTime =
                            this.verticalCycleTimes[firstColIndex] ?? 5000;
                        await this.wait(
                            cycleTime,
                            `H: attendre cycle vertical col 0`
                        );
                    } else {
                        await this.wait(
                            10000,
                            "H: pause à gauche (première non-scrollable)"
                        );
                    }

                    direction = "right";
                }
            }
        },
        scrollBoard(board, target, step, delay) {
            return new Promise((resolve) => {
                const interval = setInterval(() => {
                    if (board.scrollLeft < target) {
                        board.scrollLeft += step;
                        if (board.scrollLeft >= target) {
                            clearInterval(interval);
                            resolve();
                        }
                    } else if (board.scrollLeft > target) {
                        board.scrollLeft -= step;
                        if (board.scrollLeft <= target) {
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
                    if (this.taskColumns.length > 6)
                        this.horizontalScrollLoop();
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
    height: 95%;
    display: flex;
    flex-direction: column;
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
    height: 90%;
    width: 30%;
    position: relative;
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);
    border: 1px solid #ccc;
    color: #000 !important; /* Forcer tout le texte de la colonne en noir */
    padding: 1%;
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
    gap: 1rem;
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
    padding: 0.5rem;
    flex-shrink: 0;
    width: 90%;
    margin: 0 auto;
    color: #000 !important; /* Forcer texte des cartes en noir */
}
.task-card.completed {
    text-decoration: line-through;
    opacity: 0.7;
}
.task-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.task-checkbox {
    width: 1.2rem;
    height: 1.2rem;
    cursor: pointer;
    background-color: var(--checkbox-bg, #fff);
    border: 2px solid var(--checkbox-border, #000);
    border-radius: 4px;
    appearance: none;
    -webkit-appearance: none;
    transition: background-color 0.3s ease, border-color 0.3s ease;
}
.task-checkbox:checked {
    background-color: var(--checkbox-bg-checked, #4caf50);
    border-color: var(--checkbox-bg-checked, #4caf50);
    position: relative;
}
.task-checkbox:checked::after {
    content: "✔";
    color: #fff;
    font-size: 0.9rem;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}
.task-notes {
    font-size: 0.6rem;
    color: #000 !important; /* Notes en noir */
    margin-top: 0.2rem;
    padding-left: 0.5rem;
    word-break: break-word;
}
.task-title {
    font-size: 1rem;
    font-weight: bold;
    color: #000 !important; /* Titre en noir */
}
.task-due {
    font-size: 0.8rem;
    opacity: 0.9;
    margin-left: auto;
    color: #000 !important; /* Date en noir */
}
</style>
```
