<template>
  <div class="tasks-module">
    <!-- Loading State -->
    <div v-if="tasksStore.loading" class="loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">Chargement...</div>
    </div>

    <!-- Error State -->
    <ErrorDisplay
      v-else-if="tasksStore.error"
      type="network"
    />

    <!-- No Data State -->
    <ErrorDisplay
      v-else-if="tasksStore.tasks.length === 0"
      type="no-data"
    />

    <!-- Tasks Content -->
    <div class="progress-bar" v-if="showProgress" :class="{ 'progress-left': progressSide === 'left', 'progress-right': progressSide === 'right' }">
      <div class="progress-fill" :style="{ height: progressPercent + '%' }"></div>
    </div>
    <div ref="tasksContainer" class="tasks-container">
      <TaskList
        v-for="list in groupedLists"
        :key="list.title"
        :listTitle="list.title"
        :listColor="list.color"
        :tasks="list.tasks"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useTasksStore } from '../stores/tasksStore';
import ErrorDisplay from './ErrorDisplay.vue';
import TaskList from './TaskList.vue';

const tasksStore = useTasksStore();
const tasksContainer = ref<HTMLElement | null>(null);
let scrollInterval: number | null = null;
let pauseTimeout: number | null = null;
const pauseDuration = 20000; // 20 seconds
const showProgress = ref(false);
const progressPercent = ref(0);
const progressSide = ref<'left' | 'right'>('right');

onMounted(() => {
  tasksStore.startPolling();
});

const groupedLists = computed(() => {
  const groups: { [key: string]: { title: string; color: string; tasks: any[] } } = {};
  tasksStore.tasks.forEach(task => {
    const key = task.taskListTitle;
    if (!groups[key]) {
      groups[key] = { title: key, color: task.listColor, tasks: [] };
    }
    groups[key].tasks.push(task);
  });
  
  // Sort by task count descending
  const sorted = Object.values(groups).sort((a, b) => b.tasks.length - a.tasks.length);
  
  // Center the list with most tasks
  if (sorted.length <= 1) return sorted;
  
  const result = [];
  const centerIndex = Math.floor(sorted.length / 2);
  
  // Put the largest (first in sorted) at the center
  result[centerIndex] = sorted[0];
  
  // Distribute the rest around it
  let leftIndex = centerIndex - 1;
  let rightIndex = centerIndex + 1;
  let remainingIndex = 1; // Start from second largest
  
  while (remainingIndex < sorted.length) {
    if (leftIndex >= 0) {
      result[leftIndex] = sorted[remainingIndex];
      leftIndex--;
      remainingIndex++;
    }
    if (rightIndex < sorted.length && remainingIndex < sorted.length) {
      result[rightIndex] = sorted[remainingIndex];
      rightIndex++;
      remainingIndex++;
    }
  }
  
  return result;
});

const startHorizontalScroll = () => {
  if (!tasksContainer.value) return;
  const container = tasksContainer.value;
  const totalWidth = container.scrollWidth;
  const visibleWidth = container.clientWidth;

  if (totalWidth <= visibleWidth) return; // No need to scroll

  let currentScroll = 0; // Start from left since largest is now centered
  let direction = 1; // 1: right, -1: left
  const step = 1; // pixels per step
  const delay = 50; // ms

  const scroll = () => {
    currentScroll += step * direction;
    if (direction === 1 && currentScroll >= totalWidth - visibleWidth + 20) {
      // Reached right, pause
      currentScroll = totalWidth - visibleWidth + 20;
      direction = -1;
      pauseAtRight();
    } else if (direction === -1 && currentScroll <= 0) {
      // Reached left, pause
      currentScroll = 0;
      direction = 1;
      pauseAtLeft();
    }
    container.scrollLeft = currentScroll;
  };

  const pauseAtRight = () => {
    clearInterval(scrollInterval!);
    scrollInterval = null;
    showProgress.value = true;
    progressSide.value = 'right';
    progressPercent.value = 100;
    let elapsed = 0;
    pauseTimeout = window.setInterval(() => {
      elapsed += 100;
      progressPercent.value = Math.max(0, 100 - (elapsed / pauseDuration) * 100);
      if (elapsed >= pauseDuration) {
        clearInterval(pauseTimeout!);
        pauseTimeout = null;
        showProgress.value = false;
        tasksStore.fetchTasks(true);
        scrollInterval = window.setInterval(scroll, delay);
      }
    }, 100);
  };

  const pauseAtLeft = () => {
    clearInterval(scrollInterval!);
    scrollInterval = null;
    showProgress.value = true;
    progressSide.value = 'left';
    progressPercent.value = 100;
    let elapsed = 0;
    pauseTimeout = window.setInterval(() => {
      elapsed += 100;
      progressPercent.value = Math.max(0, 100 - (elapsed / pauseDuration) * 100);
      if (elapsed >= pauseDuration) {
        clearInterval(pauseTimeout!);
        pauseTimeout = null;
        showProgress.value = false;
        tasksStore.fetchTasks(true);
        scrollInterval = window.setInterval(scroll, delay);
      }
    }, 100);
  };

  scrollInterval = window.setInterval(scroll, delay);
};

const stopHorizontalScroll = () => {
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }
};

onMounted(() => {
  tasksStore.fetchTasks();
  // Start scroll after a delay
  setTimeout(() => {
    startHorizontalScroll();
  }, 1000);
});

// Watch for changes in the number of lists
watch(() => groupedLists.value.length, (newLength, oldLength) => {
  if (newLength !== oldLength) {
    stopHorizontalScroll();
    setTimeout(() => {
      startHorizontalScroll();
    }, 500);
  }
});
</script>

<style scoped>
.tasks-module {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  color: var(--color-primary);
  box-sizing: border-box;
  position: relative;
}

.tasks-module h3 {
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  min-height: 150px;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.loading-text {
  font-size: 0.9rem;
  color: var(--color-secondary);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.tasks-container {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  height: 100%;
  position: relative;
  overflow-x: auto;
  overflow-y: hidden;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.tasks-container::-webkit-scrollbar {
  display: none;
}

.progress-bar {
  position: absolute;
  top: 0;
  width: 4px;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.progress-bar.progress-right {
  right: 0;
}

.progress-bar.progress-left {
  left: 0;
}

.progress-fill {
  width: 100%;
  background-color: rgba(255, 255, 255, 0.4);
  transition: height 0.1s ease;
  position: absolute;
  bottom: 0;
}

button:hover {
  background: #0056b3;
}
</style>