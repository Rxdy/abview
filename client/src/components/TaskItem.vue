<template>
  <div
    class="task-item"
    :class="{ completed: task.status === 'completed', 'dark-bg': isDark }"
    :style="{ marginLeft: `calc(${task.level * 24} * var(--px))` }"
  >
    <div class="task-header">
      <input
        v-if="!hasChildren"
        type="checkbox"
        class="task-checkbox"
        :checked="task.status === 'completed'"
        disabled
      />
      <span class="task-title">{{ task.title }}</span>
      <span
        v-if="task.status !== 'completed' && task.due"
        class="task-due num"
      >
        {{ formatDate(task.due) }}
      </span>
    </div>
    <div v-if="task.notes" class="task-notes">
      <span>{{ task.notes }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Task {
  id: string
  title: string
  status: string
  due?: string | null
  completed?: string | null
  updated?: string | null
  notes?: string | null
  parent?: string | null
  level: number
  taskListTitle: string
}

interface Props {
  task: Task
  isDark: boolean
  hasChildren: boolean
  isCompleted: boolean
}

const props = defineProps<Props>()

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
</script>

<style scoped>
/* Ligne de tâche : case carrée de la couleur de la liste (--list-color), échéance en pastille. */
.task-item {
  color: var(--c-text);
}

.task-item.completed {
  opacity: 0.7;
}

.task-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
}

.task-title {
  flex: 1;
  min-width: 0;
  font-size: calc(13 * var(--px));
  font-weight: 600;
  line-height: 1.25;
}

.task-due {
  flex-shrink: 0;
  font-size: var(--fs-xs);
  font-weight: 800;
  padding: calc(1 * var(--px)) calc(7 * var(--px));
  border-radius: var(--radius-pill);
  background: var(--c-due-bg);
  color: var(--c-due-fg);
}

.task-notes {
  margin-top: calc(1 * var(--px));
  padding-left: calc(24 * var(--px));
  font-size: var(--fs-xs);
  color: var(--c-muted);
  line-height: 1.2;
  word-break: break-word;
}

.task-checkbox {
  flex-shrink: 0;
  width: calc(16 * var(--px));
  height: calc(16 * var(--px));
  margin-top: calc(1 * var(--px));
  /* un peu de la couleur du texte : visible même pour une liste foncée en mode nuit */
  border: 2px solid color-mix(in srgb, var(--list-color, var(--c-muted)) 70%, var(--c-text));
  border-radius: calc(6 * var(--px));
  background: transparent;
  appearance: none;
  -webkit-appearance: none;
  cursor: default;
}

.task-checkbox:checked {
  background-color: var(--list-color, #4caf50);
  position: relative;
}

.task-checkbox:checked::after {
  content: "✔";
  color: #fff;
  font-size: var(--fs-xs);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Tâche parente (avec sous-tâches) : pas de case, titre en gras */
.task-header:not(:has(.task-checkbox)) .task-title {
  font-weight: 800;
}
</style>
