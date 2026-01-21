import { apiService } from './apiService';

export const tasksService = {
  async getTasks() {
    const data = await apiService.get('/tasks');
    // Aplatir les listes en tâches avec taskListTitle et listColor
    const tasks = data.lists.flatMap((list: any) => 
      list.tasks.map((task: any) => ({ 
        ...task, 
        taskListTitle: list.title, 
        listColor: list.color 
      }))
    );
    return {
      tasks,
      lastRefresh: data.lastRefresh ? new Date(data.lastRefresh) : null
    };
  },

  async updateTask(taskId: string, status: string) {
    return await apiService.patch(`/tasks/${taskId}`, { status });
  },
};