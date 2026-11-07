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
    // Les listes à part : une liste sans tâche n'a aucune tâche à aplatir, mais doit s'afficher
    const lists = data.lists.map((list: any) => ({ id: list.id, title: list.title, color: list.color }));
    return {
      tasks,
      lists,
      lastRefresh: data.lastRefresh ? new Date(data.lastRefresh) : null
    };
  },

  async updateTask(taskId: string, status: string) {
    return await apiService.patch(`/tasks/${taskId}`, { status });
  },
};