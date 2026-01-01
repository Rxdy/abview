import { apiService } from './apiService';

export const tasksService = {
  async getTasks() {
    const data = await apiService.get('/tasks');
    // Aplatir les listes en tâches avec taskListTitle et listColor
    return data.lists.flatMap((list: any) => 
      list.tasks.map((task: any) => ({ 
        ...task, 
        taskListTitle: list.title, 
        listColor: list.color 
      }))
    );
  },
};