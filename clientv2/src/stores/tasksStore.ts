import { defineStore } from 'pinia';
import { tasksService } from '../services/tasksService';
import { useProgressStore } from './progressStore';

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    tasks: [] as any[],
    loading: false,
    error: null as string | null,
    lastHash: '' as string,
  }),
  actions: {
    async fetchTasks(isRefresh = false) {
      if (!isRefresh) this.loading = true;
      this.error = null;
      try {
        const data = await tasksService.getTasks();
        const newHash = JSON.stringify(data);
        if (newHash !== this.lastHash) {
          this.tasks = data;
          this.lastHash = newHash;
          console.log('Tasks updated');
          // Reset progress bar
          const progressStore = useProgressStore();
          progressStore.resetProgress();
        } else {
          console.log('Tasks unchanged');
        }
      } catch (error) {
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },
    startPolling() {
      // Poll every 5 minutes + 10 seconds
      setInterval(() => {
        this.fetchTasks(true);
      }, 5 * 60 * 1000 + 10000);
    },
  },
});