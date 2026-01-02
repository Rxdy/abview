import { defineStore } from 'pinia';
import { tasksService } from '../services/tasksService';
import { useProgressStore } from './progressStore';

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    tasks: [] as any[],
    loading: false,
    error: null as string | null,
    lastHash: '' as string,
    lastRefresh: null as Date | null,
  }),
  actions: {
    async fetchTasks(isRefresh = false) {
      if (!isRefresh) this.loading = true;
      this.error = null;
      try {
        const result = await tasksService.getTasks();
        const newHash = JSON.stringify(result.tasks);
        if (newHash !== this.lastHash) {
          this.tasks = result.tasks;
          this.lastHash = newHash;
          console.log('Tasks updated');
          // Reset progress bar
          const progressStore = useProgressStore();
          progressStore.resetProgress();
        } else {
          console.log('Tasks unchanged');
        }
        // Toujours mettre à jour lastRefresh avec le datetime du serveur (APIs Google)
        if (result.lastRefresh) {
          this.lastRefresh = new Date(result.lastRefresh);
        }
      } catch (error) {
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },
    startPolling() {
      // Poll every minute instead of 5 minutes
      setInterval(() => {
        this.fetchTasks(true);
      }, 60 * 1000);
    },
  },
});