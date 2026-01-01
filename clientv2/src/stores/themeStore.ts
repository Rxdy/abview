import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false); // Start in light theme
  const sunTimes = ref({ sunrise: '07:00', sunset: '17:30' }); // Default for winter

  const toggleTheme = () => {
    isDark.value = !isDark.value;
  };

  const setTheme = (dark: boolean) => {
    isDark.value = dark;
  };

  const updateSunTimes = (times: { sunrise: string; sunset: string }) => {
    sunTimes.value = times;
  };

  const updateThemeBasedOnTime = () => {
    const now = new Date();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

    const [sunriseHour, sunriseMinute] = sunTimes.value.sunrise.split(':').map(Number);
    const [sunsetHour, sunsetMinute] = sunTimes.value.sunset.split(':').map(Number);
    const sunriseTimeInMinutes = sunriseHour * 60 + sunriseMinute;
    const sunsetTimeInMinutes = sunsetHour * 60 + sunsetMinute;

    // If current time is between sunrise and sunset, it's day time
    const isDayTime = currentTimeInMinutes >= sunriseTimeInMinutes && currentTimeInMinutes < sunsetTimeInMinutes;
    const newIsDark = !isDayTime;
    
    isDark.value = newIsDark;
  };

  // Auto-update theme every minute for smooth transitions
  const startAutoThemeUpdate = () => {
    updateThemeBasedOnTime();
    
    // Update every minute
    setInterval(updateThemeBasedOnTime, 60 * 1000);
  };

  // Manual test function
  const testThemeSwitch = () => {

    updateThemeBasedOnTime();
  };

  return {
    isDark,
    sunTimes,
    toggleTheme,
    setTheme,
    updateSunTimes,
    updateThemeBasedOnTime,
    startAutoThemeUpdate,
    testThemeSwitch,
  };
});