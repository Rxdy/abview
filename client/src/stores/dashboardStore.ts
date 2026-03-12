import { defineStore } from 'pinia';

export interface GridConfig {
  columns: number;
  rows: string;
}

export interface ModuleConfig {
  id: string;
  component: string;
  widthPercent?: string;
  heightPercent?: string;
  order?: number;
  visible: boolean;
}

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    grid: { columns: 12, rows: '70% 25%' } as GridConfig,
    modules: [] as ModuleConfig[],
    name: 'Abview' as string,
    language: 'fr' as string,
  }),
  actions: {
    async loadConfig() {
      try {
        const response = await fetch('/config.json');
        const { grid, modules, name, language } = await response.json();
        this.grid = grid;
        this.modules = modules;
        this.name = name || 'Abview';
        this.language = language || 'fr';
      } catch (error) {
        console.error('Failed to load config:', error);
        // Fallback
        this.grid = { columns: 12, rows: '70% 25%' };
        this.modules = [
          { id: 'calendar', component: 'CalendarModule', widthPercent: '100%', heightPercent: '60%', order: 1, visible: true },
          { id: 'weather', component: 'WeatherModule', widthPercent: '30%', heightPercent: '40%', order: 2, visible: true },
          { id: 'tasks', component: 'TasksModule', widthPercent: '69.5%', heightPercent: '40%', order: 3, visible: true },
        ];
        this.language = 'fr';
      }
    },
  },
});