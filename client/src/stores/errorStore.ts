import { defineStore } from 'pinia';
import { useLanguageStore } from './languageStore';

export interface AppError {
  id: string;
  type: 'network' | 'no-data' | 'service-unavailable' | 'generic';
  message: string;
  module: string;
  timestamp: number;
}

export const useErrorStore = defineStore('error', {
  state: () => ({
    errors: [] as AppError[],
    showToast: false,
    currentToast: null as AppError | null,
  }),
  getters: {
    hasErrors: (state) => state.errors.length > 0,
    errorsByModule: (state) => (module: string) => state.errors.filter(e => e.module === module),
  },
  actions: {
    addError(error: Omit<AppError, 'id' | 'timestamp'>) {
      const newError: AppError = {
        ...error,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };
      this.errors.push(newError);
      // Optionally show toast
      this.showToastFor(newError);
    },
    removeError(id: string) {
      this.errors = this.errors.filter(e => e.id !== id);
    },
    clearErrors() {
      this.errors = [];
    },
    showToastFor(error: AppError) {
      this.currentToast = error;
      this.showToast = true;
      // Auto-hide after 5s
      setTimeout(() => {
        this.showToast = false;
        this.currentToast = null;
      }, 5000);
    },
    getErrorMessage(type: string, lang: string = 'fr') {
      // Use languageStore for messages
      const languageStore = useLanguageStore();
      return languageStore.t(type, 'errors') || type;
    },
  },
});