<template>
  <div
    class="task-item"
    :class="{ completed: task.status === 'completed', 'dark-bg': isDark }"
    :style="{ marginLeft: task.level * 20 + 'px' }"
  >
    <div class="task-header">
      <input
        type="checkbox"
        class="task-checkbox"
        :checked="task.status === 'completed'"
        disabled
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
.task-item {
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 0.25rem 0.3rem;
  color: #000;
  min-height: 1.8rem;
}

.task-item.completed {
  opacity: 0.7;
}

.task-item.dark-bg {
  background-color: #f0f0f0;
  border-color: rgba(255, 255, 255, 0.3);
  color: #000;
}

.task-header {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
}

.task-title {
  font-size: 0.75rem;
  font-weight: bold;
  color: #000;
  line-height: 1.15;
  flex: 1;
}

.task-due {
  font-size: 0.65rem;
  opacity: 0.9;
  margin-left: auto;
  color: #000;
}

.task-notes {
  font-size: 0.5rem;
  color: #000;
  margin-top: 0.1rem;
  padding-left: 1.4rem;
  word-break: break-word;
  line-height: 1.1;
}

.task-checkbox {
  width: 1rem;
  height: 1rem;
  cursor: default;
  background-color: var(--color-gray);
  border: 2px solid #000;
  border-radius: 50%;
  appearance: none;
  -webkit-appearance: none;
  transition: background-color 0.3s ease, border-color 0.3s ease;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.task-checkbox:checked {
  background-color: #4caf50;
  border-color: #4caf50;
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
</style>