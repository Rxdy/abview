<template>
  <div class="task-list" :style="{ backgroundColor: adjustedListColor }" :class="{ 'light-theme': !themeStore.isDark }">
    <div class="list-title">
      {{ listTitle }}
    </div>
    <div ref="tasksContainer" class="tasks-container">
      <!-- Pending Tasks -->
      <div v-if="pendingTasks.length > 0" class="tasks-section">
        <div class="section-title">À faire</div>
        <TaskItem
          v-for="task in pendingTasks"
          :key="task.id"
          :task="task"
          :isDark="isDark"
        />
      </div>
      <!-- Completed Tasks -->
      <div v-if="completedTasks.length > 0" class="tasks-section completed-section">
        <div class="section-title">Terminées</div>
        <TaskItem
          v-for="task in completedTasks"
          :key="task.id"
          :task="task"
          :isDark="isDark"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import TaskItem from './TaskItem.vue'
import { useThemeStore } from '../stores/themeStore';

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
  listColor: string
}

interface Props {
  listTitle: string
  listColor: string
  tasks: Task[]
}

const props = defineProps<Props>()

const themeStore = useThemeStore();

const adjustedListColor = computed(() => {
  if (themeStore.isDark) {
    return props.listColor;
  }
  // In light theme, Luis keeps Porto blue, Rudy gets lighter
  if (props.listColor === '#1e293b') {
    return '#8B9BAB'; // Lighter version for Rudy
  }
  return props.listColor; // Luis keeps #004C99
});

const sortedTasks = computed(() => {
  return [...props.tasks].sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.title.localeCompare(b.title);
  });
});

const pendingTasks = computed(() => sortedTasks.value.filter(t => t.status !== 'completed'));
const completedTasks = computed(() => sortedTasks.value.filter(t => t.status === 'completed'));

const tasksContainer = ref<HTMLElement | null>(null);
let scrollInterval: number | null = null;

const startVerticalScroll = () => {
  if (!tasksContainer.value) return;
  const container = tasksContainer.value;
  const totalHeight = container.scrollHeight;
  const visibleHeight = container.clientHeight;

  if (totalHeight <= visibleHeight) return; // No need to scroll

  let currentScroll = 0;
  let direction = 1; // 1: down, -1: up
  const step = 1; // pixels per step
  const delay = 50; // ms
  const pauseDuration = 5000; // 5 seconds

  const scroll = () => {
    currentScroll += step * direction;
    if (direction === 1 && currentScroll >= totalHeight - visibleHeight) {
      // Reached bottom, pause
      currentScroll = totalHeight - visibleHeight;
      direction = -1;
      pauseAtBottom();
    } else if (direction === -1 && currentScroll <= 0) {
      // Reached top, pause
      currentScroll = 0;
      direction = 1;
      pauseAtTop();
    }
    container.scrollTop = currentScroll;
  };

  const pauseAtBottom = () => {
    clearInterval(scrollInterval!);
    scrollInterval = null;
    setTimeout(() => {
      scrollInterval = window.setInterval(scroll, delay);
    }, pauseDuration);
  };

  const pauseAtTop = () => {
    clearInterval(scrollInterval!);
    scrollInterval = null;
    setTimeout(() => {
      scrollInterval = window.setInterval(scroll, delay);
    }, pauseDuration);
  };

  // Initial pause before starting
  setTimeout(() => {
    scrollInterval = window.setInterval(scroll, delay);
  }, pauseDuration);
};

onMounted(() => {
  setTimeout(() => {
    startVerticalScroll();
  }, 1000);
});

const isDark = computed(() => {
  if (themeStore.isDark) {
    return ['#004C99', '#1e293b'].includes(props.listColor);
  }
  // In light theme, the adjusted colors are light, so text should be dark
  return false;
});
</script>

<style scoped>
.task-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 10px;
  padding: 0.5rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  max-height: 100%;
  position: relative;
}

.list-title {
  font-weight: bold;
  text-align: center;
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

.tasks-container {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  height: 100%;
  overflow-y: auto;
  flex: 1;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.tasks-container::-webkit-scrollbar {
  display: none;
}

.tasks-section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.section-title {
  font-size: 0.8rem;
  font-weight: bold;
  color: inherit;
  margin-bottom: 0.2rem;
  text-transform: uppercase;
}

.completed-section {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.2);
}


</style>