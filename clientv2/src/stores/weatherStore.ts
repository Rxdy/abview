import { defineStore } from 'pinia';
import { weatherService } from '../services/weatherService';
import { useProgressStore } from './progressStore';
import { useErrorStore } from './errorStore';

export const useWeatherStore = defineStore('weather', {
  state: () => ({
    weather: null as any,
    sunrise: null as string | null,
    sunset: null as string | null,
    loading: false,
    error: null as string | null,
    lastHash: '' as string,
    lastRefresh: null as Date | null,
  }),
  actions: {
    async fetchWeather(isRefresh = false) {
      if (!isRefresh) this.loading = true;
      this.error = null;
      try {
        const result = await weatherService.getWeather();
        const newHash = JSON.stringify(result.weather);
        if (newHash !== this.lastHash) {
          this.weather = result.weather;
          // Extract sunrise/sunset for theme
          if (result.weather?.current) {
            const today = new Date().toISOString().split('T')[0];
            this.sunrise = `${today}T${result.weather.current.sunrise}`;
            this.sunset = `${today}T${result.weather.current.sunset}`;
          }
          this.lastHash = newHash;
          console.log('Weather updated');
          // Reset progress bar
          const progressStore = useProgressStore();
          progressStore.resetProgress();
        } else {
          console.log('Weather unchanged');
        }
        // Toujours mettre à jour lastRefresh avec le datetime du serveur (APIs externes)
        if (result.lastRefresh) {
          this.lastRefresh = new Date(result.lastRefresh);
        }
      } catch (error) {
        const err = error as Error;
        this.error = err.message;
        const errorStore = useErrorStore();
        let type: 'network' | 'no-data' | 'service-unavailable' | 'generic' = 'generic';
        if (err.message.includes('fetch') || err.message.includes('network')) {
          type = 'network';
        } else if (err.message.includes('no data')) {
          type = 'no-data';
        } else if (err.message.includes('unavailable')) {
          type = 'service-unavailable';
        }
        errorStore.addError({
          type,
          message: err.message,
          module: 'weather',
        });
      } finally {
        this.loading = false;
      }
    },
    startPolling() {
      // Poll every minute instead of 5 minutes
      setInterval(() => {
        this.fetchWeather(true);
      }, 60 * 1000);
    },
  },
});