import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useDashboardStore } from './stores/dashboardStore'
import { useThemeStore } from './stores/themeStore'
import { useNotificationsStore } from './stores/notificationsStore'
import { useTasksStore } from './stores/tasksStore'
import { useWeatherStore } from './stores/weatherStore'
import { useCalendarStore } from './stores/calendarStore'

async function initApp() {
  const app = createApp(App)

  app.use(createPinia())
  app.use(router)

  const dashboardStore = useDashboardStore()
  await dashboardStore.loadConfig()

  // Initialize automatic theme switching
  const themeStore = useThemeStore()
  themeStore.setTheme(false) // Force light theme
  
  // Make stores globally available for console testing
  if (typeof window !== 'undefined') {
    (window as any).themeStore = themeStore
    const notificationsStore = useNotificationsStore()
    ;(window as any).notificationsStore = notificationsStore
    const tasksStore = useTasksStore()
    ;(window as any).tasksStore = tasksStore
    const weatherStore = useWeatherStore()
    ;(window as any).weatherStore = weatherStore
    const calendarStore = useCalendarStore()
    ;(window as any).calendarStore = calendarStore
    // Global refresh command for dev testing
    ;(window as any).globalRefresh = async () => {
      await Promise.all([
        tasksStore.fetchTasks(true),
        weatherStore.fetchWeather(true),
        calendarStore.fetchAll(true)
      ]);
    };
  }
  
  // Temporarily disable auto-update for testing
  // themeStore.startAutoThemeUpdate()

  app.mount('#app')
}

initApp()
