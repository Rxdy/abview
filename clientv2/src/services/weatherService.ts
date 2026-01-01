import { apiService } from './apiService';

export const weatherService = {
  async getWeather() {
    return apiService.get('/weather');
  },
};