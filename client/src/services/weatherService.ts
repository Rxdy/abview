import { apiService } from './apiService';

export const weatherService = {
  async getWeather() {
    const data = await apiService.get('/weather');
    return {
      weather: data.weather,
      lastRefresh: data.lastRefresh ? new Date(data.lastRefresh) : null
    };
  },
};