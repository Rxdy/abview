<template>
  <div
    class="task-item"
    :class="{ completed: task.status === 'completed', 'dark-bg': isDark }"
    :style="{ marginLeft: task.level * 20 + 'px' }"
  >
    <div class="task-header">
      <input
        type="checkbox"
        :checked="task.status === 'completed'"
        @change="handleToggle"
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
      <span>{{ task.notes }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TaskItem',
  props: {
    task: {
      type: Object,
      required: true,
    },
    isDark: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    formatDate(dateStr) {
      const d = new Date(dateStr);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    },
    handleToggle() {
      this.$emit('toggle-status', this.task);
    },
  },
}
</script>

<style scoped>
.task-item {
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 0.25rem 0.3rem;
  color: #000;
  min-height: 1.8rem;
}

.task-item.completed {
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
  background-color: #fff;
  border: 2px solid #000;
  border-radius: 4px;
  appearance: none;
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

.task-item.dark-bg {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.task-item.dark-bg .task-title,
.task-item.dark-bg .task-due,
.task-item.dark-bg .task-notes {
  color: #fff !important;
}

.task-item.dark-bg .task-checkbox {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}
</style>