import { defineStore } from 'pinia';
import type { ReglesCategories } from '../utils/categories';
import { CONFIGURATION_PAR_DEFAUT, valider, type Configuration } from '../modules/configuration';

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

/** La configuration fournie si elle est valide, sinon la standard (un écran ne reste jamais sans disposition). */
function choisirConfiguration(candidate: unknown): Configuration {
  if (!candidate) return CONFIGURATION_PAR_DEFAUT;
  const config = candidate as Configuration;
  const erreurs = Array.isArray(config.placements) ? valider(config) : ['placements manquants'];
  if (erreurs.length) {
    console.error('Configuration refusée, disposition standard utilisée :', erreurs);
    return CONFIGURATION_PAR_DEFAUT;
  }
  return config;
}

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    grid: { columns: 12, rows: '70% 25%' } as GridConfig,
    modules: [] as ModuleConfig[],
    name: 'Abview' as string,
    language: 'fr' as string,
    categories: {} as ReglesCategories,
    /** Disposition des modules à l'écran ; la disposition standard tant qu'aucune autre valide n'est fournie. */
    configuration: CONFIGURATION_PAR_DEFAUT as Configuration,
  }),
  actions: {
    async loadConfig() {
      try {
        const response = await fetch('/config.json');
        const { grid, modules, name, language, categories, configuration } = await response.json();
        this.configuration = choisirConfiguration(configuration);
        this.categories = categories || {};
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
        this.configuration = CONFIGURATION_PAR_DEFAUT;
      }
    },
  },
});