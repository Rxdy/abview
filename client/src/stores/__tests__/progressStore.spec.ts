import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProgressStore } from '../progressStore'
import { tasksService } from '../../services/tasksService'
import { weatherService } from '../../services/weatherService'
import { calendarService } from '../../services/calendarService'

vi.mock('../../services/tasksService', () => ({
  tasksService: { getTasks: vi.fn(), updateTask: vi.fn() },
}))
vi.mock('../../services/weatherService', () => ({
  weatherService: { getWeather: vi.fn() },
}))
vi.mock('../../services/calendarService', () => ({
  calendarService: {
    getHoraires: vi.fn(),
    getCalendarEvents: vi.fn(),
    getRecapData: vi.fn(),
  },
}))

describe('progressStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.mocked(tasksService.getTasks).mockResolvedValue({ tasks: [], lastRefresh: null })
    vi.mocked(weatherService.getWeather).mockResolvedValue({ weather: null, lastRefresh: null })
    vi.mocked(calendarService.getHoraires).mockResolvedValue({ horaires: [], lastRefresh: null })
    vi.mocked(calendarService.getCalendarEvents).mockResolvedValue({
      events: [],
      lastRefresh: null,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with default progress', () => {
    const store = useProgressStore()
    expect(store.progress).toBe(0)
    expect(store.timeRemaining).toBe(60 * 1000)
  })

  it('startProgress fait avancer la barre au fil du temps', async () => {
    const store = useProgressStore()
    await store.startProgress()

    await vi.advanceTimersByTimeAsync(30 * 1000)

    expect(store.progress).toBeGreaterThan(40)
    expect(store.progress).toBeLessThan(60)
    expect(store.timeRemaining).toBeLessThanOrEqual(30 * 1000)

    store.stopProgress()
  })

  it('startProgress est idempotent (double appel sans effet)', async () => {
    const store = useProgressStore()
    await store.startProgress()
    await store.startProgress()

    await vi.advanceTimersByTimeAsync(1000)
    expect(store.progress).toBeGreaterThan(0)

    store.stopProgress()
  })

  it('à 60s, déclenche le refresh des trois stores puis reset le cycle', async () => {
    const store = useProgressStore()
    await store.startProgress()

    await vi.advanceTimersByTimeAsync(60 * 1000)
    // Laisse les promesses de refresh se résoudre
    await vi.advanceTimersByTimeAsync(0)

    expect(tasksService.getTasks).toHaveBeenCalled()
    expect(weatherService.getWeather).toHaveBeenCalled()
    expect(calendarService.getHoraires).toHaveBeenCalled()
    expect(store.progress).toBe(0) // cycle reparti

    store.stopProgress()
  })

  it('reset le cycle même si le refresh échoue', async () => {
    // Les stores attrapent les erreurs de service : pour atteindre le .catch
    // du refresh, il faut qu'une action de store rejette directement
    const { useTasksStore } = await import('../tasksStore')
    const tasksStore = useTasksStore()
    tasksStore.fetchTasks = vi.fn().mockRejectedValue(new Error('down'))

    const store = useProgressStore()
    await store.startProgress()

    await vi.advanceTimersByTimeAsync(60 * 1000)
    await vi.advanceTimersByTimeAsync(0)

    expect(store.progress).toBe(0)

    store.stopProgress()
  })

  it('la barre plafonne à 100 % si le refresh tarde', async () => {
    // Refresh bloqué : aucune promesse ne se résout (sinon les stores
    // eux-mêmes resettent la barre via resetProgress)
    vi.mocked(tasksService.getTasks).mockReturnValue(new Promise(() => {}))
    vi.mocked(weatherService.getWeather).mockReturnValue(new Promise(() => {}))
    vi.mocked(calendarService.getHoraires).mockReturnValue(new Promise(() => {}))
    vi.mocked(calendarService.getCalendarEvents).mockReturnValue(new Promise(() => {}))

    const store = useProgressStore()
    await store.startProgress()

    await vi.advanceTimersByTimeAsync(65 * 1000)

    expect(store.progress).toBe(100)
    expect(store.timeRemaining).toBe(0)

    store.stopProgress()
  })

  it('stopProgress fige la progression', async () => {
    const store = useProgressStore()
    await store.startProgress()

    await vi.advanceTimersByTimeAsync(10 * 1000)
    store.stopProgress()
    const frozen = store.progress

    await vi.advanceTimersByTimeAsync(10 * 1000)
    expect(store.progress).toBe(frozen)
  })

  it('stopProgress sans démarrage préalable est sans effet', () => {
    const store = useProgressStore()
    expect(() => store.stopProgress()).not.toThrow()
  })

  it('resetProgress remet la barre à zéro', async () => {
    const store = useProgressStore()
    await store.startProgress()
    await vi.advanceTimersByTimeAsync(10 * 1000)
    expect(store.progress).toBeGreaterThan(0)

    store.resetProgress()
    expect(store.progress).toBe(0)
    expect(store.timeRemaining).toBe(60 * 1000)

    store.stopProgress()
  })
})
