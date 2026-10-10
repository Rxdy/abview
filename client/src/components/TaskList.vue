<template>
  <div class="task-list" :style="{ '--list-color': adjustedListColor, '--list-on': texteSurCouleur }" :class="{ 'light-theme': !themeStore.isDark }">
    <div class="list-title" :style="{ backgroundColor: adjustedListColor }">
      <span class="list-name">{{ listTitle }}</span>
      <span class="list-count num">{{ pendingCount }}</span>
    </div>
    <div ref="tasksContainer" class="tasks-container">
      <!-- Pending Tasks -->
      <div v-if="pendingTasks.length > 0" class="tasks-section">
        <div v-for="item in pendingTasks" :key="item.task.id">
          <TaskItem
            :task="item.task"
            :isDark="isDark"
            :hasChildren="item.children.length > 0"
            :isCompleted="false"
          />
          <TaskItem
            v-for="child in item.children"
            :key="child.id"
            :task="child"
            :isDark="isDark"
            :hasChildren="false"
            :isCompleted="false"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
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

// Watcher to start scroll when tasks are loaded
watch(() => props.tasks.length, (newLength, oldLength) => {
  if (newLength > 0 && oldLength === 0) {
    setTimeout(() => startVerticalScroll(), 100);
  }
});

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

// Texte de l'en-tête lisible sur la couleur de la liste (blanc sur foncé, sombre sur clair)
const texteSurCouleur = computed(() => {
  const hex = adjustedListColor.value.replace('#', '');
  const full = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16) / 255);
  if ([r, g, b].some(v => Number.isNaN(v))) return '#ffffff';
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * lin(r!) + 0.7152 * lin(g!) + 0.0722 * lin(b!);
  // Le plus contrasté des deux : blanc (L = 1) ou texte sombre #1c1d20 (L ≈ 0.012)
  const contrasteBlanc = 1.05 / (luminance + 0.05);
  const contrasteSombre = (luminance + 0.05) / 0.062;
  return contrasteSombre > contrasteBlanc ? '#1c1d20' : '#ffffff';
});

const pendingCount = computed(() => props.tasks.filter(t => t.status !== 'completed').length);

const tasksMap = computed(() => {
  const map = new Map();
  props.tasks.forEach(task => map.set(task.id, task));
  return map;
});

const parentsWithChildren = computed(() => {
  // Simplified: only check for pending tasks
  const parents = new Set();
  props.tasks.forEach(task => {
    if (task.parent && task.status !== 'completed') parents.add(task.parent);
  });
  return parents;
});

const taskStats = computed(() => {
  // Removed: no longer needed for completed tasks
  return new Map();
});

const sortedTasks = computed(() => {
  return [...props.tasks].sort((a, b) => {
    const aKey = a.level === 0 ? a.title : (tasksMap.value.get(a.parent)?.title || '') + '|' + a.title;
    const bKey = b.level === 0 ? b.title : (tasksMap.value.get(b.parent)?.title || '') + '|' + b.title;
    return aKey.localeCompare(bKey);
  });
});

const pendingTasks = computed(() => {
  const level0Tasks = props.tasks.filter(t => t.level === 0 && t.status !== 'completed');
  const withChildren = level0Tasks.filter(t => parentsWithChildren.value.has(t.id));
  const withoutChildren = level0Tasks.filter(t => !parentsWithChildren.value.has(t.id));
  const sortedLevel0 = [...withoutChildren, ...withChildren]; // without children first, then with
  return sortedLevel0.map(parent => {
    const children = props.tasks.filter(t => t.parent === parent.id && t.status !== 'completed');
    return { task: parent, children };
  });
});

const completedTasks = computed(() => {
  // Removed: no longer showing completed tasks
  return [];
});

const tasksContainer = ref<HTMLElement | null>(null);
let scrollInterval: number | null = null;
let scrollTimeout: number | null = null;

const clearVerticalScroll = () => {
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
    scrollTimeout = null;
  }
};

const startVerticalScroll = () => {
  clearVerticalScroll();
  if (!tasksContainer.value) return;
  const container = tasksContainer.value;
  const totalHeight = container.scrollHeight;
  const visibleHeight = container.clientHeight;

  if (totalHeight - visibleHeight < 12) return; // Ignore tiny overflows that can cause jitter

  let currentScroll = 0;
  let direction = 1; // 1: down, -1: up
  const step = 1; // pixels per step
  const delay = 50; // ms
  const pauseDuration = 5000; // 5 seconds

  const scroll = () => {
    currentScroll += step * direction;
    if (direction === 1 && currentScroll >= totalHeight - visibleHeight) {
      currentScroll = totalHeight - visibleHeight;
      direction = -1;
      pauseAtBottom();
    } else if (direction === -1 && currentScroll <= 0) {
      currentScroll = 0;
      direction = 1;
      pauseAtTop();
    }
    container.scrollTop = currentScroll;
  };

  const pauseAtBottom = () => {
    if (scrollInterval) {
      clearInterval(scrollInterval);
      scrollInterval = null;
    }
    scrollTimeout = window.setTimeout(() => {
      scrollInterval = window.setInterval(scroll, delay);
    }, pauseDuration);
  };

  const pauseAtTop = () => {
    if (scrollInterval) {
      clearInterval(scrollInterval);
      scrollInterval = null;
    }
    scrollTimeout = window.setTimeout(() => {
      scrollInterval = window.setInterval(scroll, delay);
    }, pauseDuration);
  };

  scrollTimeout = window.setTimeout(() => {
    scrollInterval = window.setInterval(scroll, delay);
  }, pauseDuration);
};

onMounted(() => {
  setTimeout(() => {
    startVerticalScroll();
  }, 1000);
});

onUnmounted(() => {
  clearVerticalScroll();
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
/* Carte de liste : en-tête plein de la couleur de la liste, corps sur la surface. */
.task-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  width: calc(276 * var(--px));
  flex-shrink: 0;
  border-radius: var(--radius-card);
  overflow: hidden;
  background: var(--c-surface);
  box-shadow: var(--shadow-card);
}

.list-title {
  flex-shrink: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(9 * var(--px)) calc(14 * var(--px));
  color: var(--list-on);
  font-size: calc(15 * var(--px));
  font-weight: 800;
}

.list-name {
  text-align: center;
}

/* Compteur à droite, sans décentrer le nom */
.list-count {
  position: absolute;
  right: calc(14 * var(--px));
  font-size: calc(12 * var(--px));
  font-weight: 800;
  padding: calc(1 * var(--px)) var(--space-2);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.25);
}

.tasks-container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: calc(10 * var(--px)) calc(14 * var(--px));
  overflow-y: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.tasks-container::-webkit-scrollbar {
  display: none;
}

.tasks-section {
  display: flex;
  flex-direction: column;
  gap: calc(7 * var(--px));
}
</style>
