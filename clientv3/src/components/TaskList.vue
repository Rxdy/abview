<template>
  <div class="task-list" :style="{ backgroundColor: adjustedListColor }" :class="{ 'light-theme': !themeStore.isDark }">
    <div class="list-title">
      {{ listTitle }}
    </div>
    <div ref="tasksContainer" class="tasks-container">
      <!-- Pending Tasks -->
      <div v-if="pendingTasks.length > 0" class="tasks-section">
        <div class="section-title">À faire</div>
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
      <!-- Completed Tasks -->
      <div v-if="completedTasks.length > 0" class="tasks-section completed-section">
        <div class="section-title">Terminées</div>
        <div v-for="item in completedTasks" :key="item.task.id">
          <TaskItem
            :task="item.task"
            :isDark="isDark"
            :hasChildren="item.children.length > 0"
            :isCompleted="true"
          />
          <TaskItem
            v-for="child in item.children"
            :key="child.id"
            :task="child"
            :isDark="isDark"
            :hasChildren="false"
            :isCompleted="true"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
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

const tasksMap = computed(() => {
  const map = new Map();
  props.tasks.forEach(task => map.set(task.id, task));
  return map;
});

const parentsWithChildren = computed(() => {
  const parents = new Set();
  props.tasks.forEach(task => {
    if (task.parent) parents.add(task.parent);
  });
  return parents;
});

const taskStats = computed(() => {
  const stats = new Map<string, { hasPending: boolean, hasCompleted: boolean }>();
  props.tasks.forEach(task => {
    if (task.level === 0) {
      stats.set(task.id, { hasPending: false, hasCompleted: false });
    }
  });
  props.tasks.forEach(task => {
    if (task.parent && stats.has(task.parent)) {
      const stat = stats.get(task.parent)!;
      if (task.status === 'completed') {
        stat.hasCompleted = true;
      } else {
        stat.hasPending = true;
      }
    }
  });
  return stats;
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
  const level0Tasks = props.tasks.filter(t => t.level === 0);
  const withCompletedChildren = level0Tasks.filter(t => {
    const stat = taskStats.value.get(t.id);
    return stat && stat.hasCompleted;
  });
  const completedWithoutChildren = level0Tasks.filter(t => t.status === 'completed' && !parentsWithChildren.value.has(t.id));
  const sortedLevel0 = [...completedWithoutChildren, ...withCompletedChildren]; // completed without children first, then with completed children
  return sortedLevel0.map(parent => {
    const children = props.tasks.filter(t => t.parent === parent.id && t.status === 'completed');
    return { task: parent, children };
  });
});

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