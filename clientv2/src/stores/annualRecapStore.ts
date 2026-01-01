import { defineStore } from 'pinia'
import { calendarService } from '@/services/calendarService'
import { ref, computed } from 'vue'

export interface Event {
  id: string
  summary: string
  start: string
  end: string
  description: string
  location: string
}

export interface UserTaskStats {
  user: string
  totalCreated: number
  totalCompleted: number
  completionRate: number
  lists: {
    listId: string
    listTitle: string
    created: number
    completed: number
  }[]
}

export interface ListStats {
  listTitle: string
  totalTasks: number
  totalCreated: number
  totalCompleted: number
  completionRate: number
  userCount: number
}

export interface YearStats {
  year: number
  tasks: TaskStats[]
  userStats: UserTaskStats[]
  listStats: ListStats[]
}

export const useAnnualRecapStore = defineStore('annualRecap', () => {
  const pastYearEvents = ref<Event[]>([])
  const pastYearStats = ref<YearStats | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Weather stats
  const averageTemp = ref(15)
  const rainyDays = ref(80)
  const sunnyDays = ref(120)
  const weatherDescription = ref('climat tempéré avec saisons marquées')

  // Weather stats détaillées
  const weatherDays = ref<any[]>([])
  const coldestDay = ref<any>(null)
  const hottestDay = ref<any>(null)
  const rainiestDay = ref<any>(null)

  const totalEvents = computed(() => pastYearEvents.value.length)
  const totalTasksCreated = computed(() => {
    if (!pastYearStats.value) return 0
    return pastYearStats.value.tasks.reduce((sum, stat) => sum + stat.created, 0)
  })
  const totalTasksCompleted = computed(() => {
    if (!pastYearStats.value) return 0
    return pastYearStats.value.tasks.reduce((sum, stat) => sum + stat.completed, 0)
  })

  const eventsByMonth = computed(() => {
    const months: { [key: number]: Event[] } = {}
    pastYearEvents.value.forEach(event => {
      const date = new Date(event.start)
      const month = date.getMonth()
      if (!months[month]) months[month] = []
      months[month].push(event)
    })
    return months
  })

  const tasksByList = computed(() => {
    if (!pastYearStats.value) return []
    return pastYearStats.value.tasks
      .map(task => ({
        ...task,
        completionRate: task.created > 0 ? (task.completed / task.created) * 100 : 0
      }))
      .sort((a, b) => {
        // D'abord trier par nombre total de tâches (descendant)
        if (b.created !== a.created) {
          return b.created - a.created
        }
        // En cas d'égalité, trier par taux de completion (descendant)
        return b.completionRate - a.completionRate
      })
  })

  const userStats = computed(() => {
    if (!pastYearStats.value) return []
    return pastYearStats.value.userStats || []
  })

  const listStats = computed(() => {
    if (!pastYearStats.value) return []
    return pastYearStats.value.listStats || []
  })

  const topUsersByTasks = computed(() => {
    return userStats.value
      .sort((a, b) => b.totalCreated - a.totalCreated)
      .slice(0, 5)
  })

  const topListsByTasks = computed(() => {
    return listStats.value
      .sort((a, b) => b.totalTasks - a.totalTasks)
      .slice(0, 5)
  })

  // Weather computed properties
  const weatherStats = computed(() => {
    if (weatherDays.value.length === 0) return null
    
    const temps = weatherDays.value.map(d => d.temp)
    const coldest = weatherDays.value.reduce((min, day) => day.temp < min.temp ? day : min)
    const hottest = weatherDays.value.reduce((max, day) => day.temp > max.temp ? day : max)
    const rainiest = weatherDays.value.reduce((max, day) => day.precip > max.precip ? day : max)
    
    return {
      averageTemp: temps.reduce((a, b) => a + b, 0) / temps.length,
      coldestDay: coldest,
      hottestDay: hottest,
      rainiestDay: rainiest,
      rainyDays: weatherDays.value.filter(d => d.isRainy).length,
      sunnyDays: weatherDays.value.filter(d => d.isSunny).length,
      totalDays: weatherDays.value.length
    }
  })

  async function fetchPastYearData() {
    isLoading.value = true
    error.value = null

    try {
      const recapData = await calendarService.getRecapData()
      
      console.log('📊 Recap data loaded:', recapData)

      // Traiter les événements
      pastYearEvents.value = recapData.events || []

      // Traiter les tâches
      if (recapData.tasks) {
        pastYearStats.value = recapData.tasks
      }

      // Traiter la météo
      if (recapData.weather) {
        weatherDays.value = recapData.weather.days || []
        averageTemp.value = Math.round(recapData.weather.averageTemp || 15)
        rainyDays.value = recapData.weather.rainyDays || 0
        sunnyDays.value = recapData.weather.sunnyDays || 0
        weatherDescription.value = recapData.weather.description || 'variable'
      }

      console.log('✅ All recap data processed successfully')
    } catch (err) {
      error.value = 'Erreur lors du chargement des données du récapitulatif'
      console.error('Error fetching recap data:', err)
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    pastYearEvents,
    pastYearStats,
    isLoading,
    error,

    // Weather stats
    averageTemp,
    rainyDays,
    sunnyDays,
    weatherDescription,
    weatherDays,
    weatherStats,

    // Getters
    totalEvents,
    totalTasksCreated,
    totalTasksCompleted,
    eventsByMonth,
    tasksByList,
    userStats,
    listStats,
    topUsersByTasks,
    topListsByTasks,

    // Actions
    fetchPastYearData
  }
})