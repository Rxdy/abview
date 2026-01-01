<template>
  <div class="task-list" :style="{ backgroundColor: list.color }">
    <div class="list-title" :class="{ 'dark-text': isDarkColor(list.color) }">
      {{ list.title }}
    </div>
    <div class="tasks-container">
      <TaskItem
        v-for="task in list.tasks"
        :key="task.id"
        :task="task"
        :isDark="isDark"
        @toggle-status="toggleTaskStatus"
      />
    </div>
  </div>
</template>

<script>
import TaskItem from './TaskItem.vue'

export default {
  name: 'TaskList',
  components: {
    TaskItem,
  },
  props: {
    list: {
      type: Object,
      required: true,
    },
  computed: {
    isDark() {
      const darkColors = ['#004C99', '#1e293b'];
      return darkColors.includes(this.list.color);
    },
  },
    isDarkColor(color) {
      // Liste des couleurs sombres
      const darkColors = ['#004C99', '#1e293b'];
      return darkColors.includes(color);
    },
    toggleTaskStatus(task) {
      this.$emit('toggle-status', task);
    },
  },
}
</script>

<style scoped>
.task-list {
  border-radius: 10px;
  padding: 0.5rem;
  margin-bottom: 1rem;
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);
  border: 1px solid #ccc;
}

.list-title {
  font-weight: bold;
  text-align: center;
  margin-bottom: 0.5rem;
  color: #000;
}

.list-title.dark-text {
  color: #fff;
}

.tasks-container {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 50vh;
  overflow-y: auto;
}
</style>