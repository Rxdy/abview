import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useWeatherStore } from '../stores/weatherStore';
import { useThemeStore } from '../stores/themeStore';

export function useTheme() {
  const weatherStore = useWeatherStore();
  const themeStore = useThemeStore();
  const currentTime = ref(new Date());

  let interval: number | null = null;

  onMounted(() => {
    // Update every minute
    interval = setInterval(() => {
      currentTime.value = new Date();
    }, 60 * 1000);
  });

  onUnmounted(() => {
    if (interval) {
      clearInterval(interval);
    }
  });

  const isDark = computed(() => {
    if (!weatherStore.sunrise || !weatherStore.sunset) {
      return themeStore.isDark; // Use theme store as fallback
    }

    const now = currentTime.value;
    const sunrise = new Date(weatherStore.sunrise);
    const sunset = new Date(weatherStore.sunset);

    const shouldBeDark = now < sunrise || now > sunset;
    return shouldBeDark;
  });

  return {
    isDark,
  };
}