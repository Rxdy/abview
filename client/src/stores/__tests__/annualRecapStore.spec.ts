import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAnnualRecapStore } from '../../stores/annualRecapStore'
import { calendarService } from '../../services/calendarService'

// Mock the calendar service
const mockRecapData = {
  year: 2025,
  tasks: {
    year: 2025,
    tasks: [
      { listId: '1', listTitle: 'Travail', created: 150, completed: 140 },
      { listId: '2', listTitle: 'Perso', created: 100, completed: 95 }
    ],
    userStats: [
      { user: 'Rudy', totalCreated: 150, totalCompleted: 140, completionRate: 93.33 },
      { user: 'Caroline', totalCreated: 100, totalCompleted: 95, completionRate: 95 }
    ],
    listStats: [
      { listTitle: 'Travail', totalTasks: 150, totalCreated: 150, totalCompleted: 140, completionRate: 93.33, userCount: 1 }
    ]
  },
  weather: {
    year: 2025,
    days: [
      { date: '2025-01-01', temp: 15, isRainy: false, isSunny: true },
      { date: '2025-01-02', temp: 12, isRainy: true, isSunny: false }
    ],
    averageTemp: 18,
    rainyDays: 85,
    sunnyDays: 180,
    description: 'climat tempéré'
  },
  events: [
    { id: '1', summary: 'Réunion équipe', start: '2025-01-15T10:00:00', end: '2025-01-15T11:00:00' },
    { id: '2', summary: 'Anniversaire Julie', start: '2025-02-20', end: '2025-02-20' }
  ]
}

vi.mock('../../services/calendarService', () => ({
  calendarService: {
    getRecapData: vi.fn(() => Promise.resolve(mockRecapData))
  }
}))

describe('useAnnualRecapStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default values', () => {
    const store = useAnnualRecapStore()

    expect(store.isLoading).toBe(false)
    expect(store.error).toBe(null)
    expect(store.totalEvents).toBe(0)
    expect(store.totalTasksCreated).toBe(0)
    expect(store.totalTasksCompleted).toBe(0)
  })

  it('fetches recap data successfully', async () => {
    const store = useAnnualRecapStore()

    await store.fetchPastYearData()

    expect(store.isLoading).toBe(false)
    expect(store.error).toBe(null)
    expect(store.totalEvents).toBe(2)
    expect(store.totalTasksCreated).toBe(250)
    expect(store.totalTasksCompleted).toBe(235)
  })

  it('calculates events by month correctly', async () => {
    const store = useAnnualRecapStore()

    await store.fetchPastYearData()

    const eventsByMonth = store.eventsByMonth
    expect(eventsByMonth[0]).toHaveLength(1) // January
    expect(eventsByMonth[1]).toHaveLength(1) // February
  })

  it('calculates tasks by list with completion rates', async () => {
    const store = useAnnualRecapStore()

    await store.fetchPastYearData()

    const tasksByList = store.tasksByList
    expect(tasksByList).toHaveLength(2)

    const travailTasks = tasksByList.find(t => t.listTitle === 'Travail')
    expect(travailTasks?.created).toBe(150)
    expect(travailTasks?.completed).toBe(140)
    expect(travailTasks?.completionRate).toBeCloseTo(93.33, 1) // 93.33 with 1 decimal place precision
  })

  it('provides top users by tasks', async () => {
    const store = useAnnualRecapStore()

    await store.fetchPastYearData()

    const topUsers = store.topUsersByTasks
    expect(topUsers).toHaveLength(2)
    expect(topUsers[0].user).toBe('Rudy')
    expect(topUsers[0].totalCreated).toBe(150)
  })

  it('calculates weather statistics', async () => {
    const store = useAnnualRecapStore()

    await store.fetchPastYearData()

    expect(store.averageTemp).toBe(18)
    expect(store.rainyDays).toBe(85)
    expect(store.sunnyDays).toBe(180)
    expect(store.weatherDescription).toBe('climat tempéré')
  })

  it('handles fetch errors', async () => {
    const store = useAnnualRecapStore()

    // Mock a failed request
    const { calendarService } = await import('../../services/calendarService')
    vi.mocked(calendarService.getRecapData).mockRejectedValueOnce(new Error('Network error'))

    await store.fetchPastYearData()

    expect(store.isLoading).toBe(false)
    expect(store.error).toContain('Erreur lors du chargement')
  })

  it('provides user statistics', async () => {
    const store = useAnnualRecapStore()

    await store.fetchPastYearData()

    const userStats = store.userStats
    expect(userStats).toHaveLength(2)
    expect(userStats[0].user).toBe('Rudy')
  })

  it('provides list statistics', async () => {
    const store = useAnnualRecapStore()

    await store.fetchPastYearData()

    const listStats = store.listStats
    expect(listStats).toHaveLength(1)
    expect(listStats[0].listTitle).toBe('Travail')
  })

  it('applique les défauts quand le récap est partiel', async () => {
    vi.mocked(calendarService.getRecapData).mockResolvedValueOnce({ weather: {} } as any)

    const store = useAnnualRecapStore()
    await store.fetchPastYearData()

    expect(store.pastYearEvents).toEqual([])
    expect(store.averageTemp).toBe(15)
    expect(store.rainyDays).toBe(0)
    expect(store.sunnyDays).toBe(0)
    expect(store.weatherDescription).toBe('variable')
    expect(store.weatherDays).toEqual([])
  })

  it('les getters retournent des valeurs vides sans données chargées', () => {
    const store = useAnnualRecapStore()

    expect(store.tasksByList).toEqual([])
    expect(store.userStats).toEqual([])
    expect(store.listStats).toEqual([])
    expect(store.topUsersByTasks).toEqual([])
    expect(store.topListsByTasks).toEqual([])
    expect(store.weatherStats).toBeNull()
  })

  it('weatherStats agrège les jours météo', async () => {
    const store = useAnnualRecapStore()
    await store.fetchPastYearData()

    const stats = store.weatherStats
    expect(stats).not.toBeNull()
    expect(stats!.totalDays).toBe(2)
    expect(stats!.averageTemp).toBeCloseTo(13.5)
    expect(stats!.coldestDay.temp).toBe(12)
    expect(stats!.hottestDay.temp).toBe(15)
    expect(stats!.rainyDays).toBe(1)
    expect(stats!.sunnyDays).toBe(1)
  })

  it('tasksByList départage les égalités par taux de complétion', () => {
    const store = useAnnualRecapStore()
    store.pastYearStats = {
      year: 2025,
      tasks: [
        { listId: '1', listTitle: 'A', created: 10, completed: 2 },
        { listId: '2', listTitle: 'B', created: 10, completed: 9 },
      ],
      userStats: [],
      listStats: [],
    }

    const sorted = store.tasksByList
    expect(sorted[0].listTitle).toBe('B') // même created, meilleur taux d'abord
    expect(sorted[1].listTitle).toBe('A')
  })

  it('topListsByTasks trie par volume et limite à 5', () => {
    const store = useAnnualRecapStore()
    store.pastYearStats = {
      year: 2025,
      tasks: [],
      userStats: [],
      listStats: [1, 2, 3, 4, 5, 6].map((n) => ({
        listTitle: `Liste ${n}`,
        totalTasks: n,
        totalCreated: n,
        totalCompleted: 0,
        completionRate: 0,
        userCount: 1,
      })),
    }

    const top = store.topListsByTasks
    expect(top).toHaveLength(5)
    expect(top[0].listTitle).toBe('Liste 6')
  })
})