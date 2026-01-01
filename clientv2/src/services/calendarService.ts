import { apiService } from './apiService';

export const calendarService = {
  async getHoraires() {
    const res = await apiService.get('/horaires');
    return res.horaires || [];
  },
  async getCalendarEvents() {
    const res = await apiService.get('/calendar');
    return res.events || [];
  },
  async getPastYearCalendarEvents() {
    const res = await apiService.get('/calendar/past-year');
    return res.events || [];
  },
  async getPastYearStats() {
    const res = await apiService.get('/stats/past-year');
    return res.stats || null;
  },
  async getPastYearWeatherStats() {
    const res = await apiService.get('/stats/weather/past-year');
    return res.stats || null;
  },
  async getTasks() {
    const res = await apiService.get('/tasks');
    return res.lists || [];
  },
  async getRecapData() {
    const res = await apiService.get('/recap');
    return res || {};
  },
};