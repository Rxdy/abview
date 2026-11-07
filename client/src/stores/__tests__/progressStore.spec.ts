import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProgressStore, DUREE_CYCLE_MS } from '../progressStore'
import { tasksService } from '../../services/tasksService'
import { weatherService } from '../../services/weatherService'
import { calendarService } from '../../services/calendarService'
import { rechargerSiNouvelleVersion } from '../../utils/nouvelleVersion'

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

vi.mock('../../utils/nouvelleVersion', () => ({
  rechargerSiNouvelleVersion: vi.fn().mockResolvedValue(false),
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
    expect(store.timeRemaining).toBe(DUREE_CYCLE_MS)
  })

  it('startProgress fait avancer la barre au fil du temps', async () => {
    const store = useProgressStore()
    await store.startProgress()

    await vi.advanceTimersByTimeAsync(DUREE_CYCLE_MS / 2)

    expect(store.progress).toBeGreaterThan(40)
    expect(store.progress).toBeLessThan(60)
    expect(store.timeRemaining).toBeLessThanOrEqual(DUREE_CYCLE_MS / 2)

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

  it('en fin de cycle, déclenche le refresh des trois stores puis reset le cycle', async () => {
    const store = useProgressStore()
    await store.startProgress()

    await vi.advanceTimersByTimeAsync(DUREE_CYCLE_MS)
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

    await vi.advanceTimersByTimeAsync(DUREE_CYCLE_MS)
    await vi.advanceTimersByTimeAsync(0)

    expect(store.progress).toBe(0)

    store.stopProgress()
  })

  it('la barre reste pleine tant que le rechargement tarde', async () => {
    // Rechargement bloqué : aucune promesse ne se résout
    vi.mocked(tasksService.getTasks).mockReturnValue(new Promise(() => {}))
    vi.mocked(weatherService.getWeather).mockReturnValue(new Promise(() => {}))
    vi.mocked(calendarService.getHoraires).mockReturnValue(new Promise(() => {}))
    vi.mocked(calendarService.getCalendarEvents).mockReturnValue(new Promise(() => {}))

    const store = useProgressStore()
    void store.startProgress() // le premier rechargement ne se termine jamais

    await vi.advanceTimersByTimeAsync(DUREE_CYCLE_MS + 5000)

    expect(store.enCours).toBe(true)
    expect(store.progress).toBe(100)
    expect(store.derniereActualisation).toBeNull()

    store.stopProgress()
  })

  it('« dernière à » prend l\'heure de fin de chaque rechargement, à chaque cycle', async () => {
    vi.setSystemTime(new Date('2026-11-07T11:24:00'))
    const store = useProgressStore()
    await store.startProgress()
    await vi.advanceTimersByTimeAsync(0)

    // Premier rechargement au démarrage
    expect(store.derniereActualisation?.toTimeString().slice(0, 8)).toBe('11:24:00')

    for (const attendu of ['11:24:30', '11:25:00', '11:25:30']) {
      await vi.advanceTimersByTimeAsync(DUREE_CYCLE_MS)
      await vi.advanceTimersByTimeAsync(0)
      expect(store.derniereActualisation?.toTimeString().slice(0, 8)).toBe(attendu)
      expect(store.enEchec).toBe(false)
    }

    store.stopProgress()
  })

  it('un seul rechargement par cycle : 1 au démarrage + 1 par cycle', async () => {
    vi.mocked(tasksService.getTasks).mockClear()
    vi.mocked(weatherService.getWeather).mockClear()
    const store = useProgressStore()
    await store.startProgress()
    await vi.advanceTimersByTimeAsync(3 * DUREE_CYCLE_MS + 500)

    expect(tasksService.getTasks).toHaveBeenCalledTimes(4)
    expect(weatherService.getWeather).toHaveBeenCalledTimes(4)

    store.stopProgress()
  })

  it('le compte à rebours repart du début du cycle à la fin du rechargement', async () => {
    const store = useProgressStore()
    await store.startProgress()
    await vi.advanceTimersByTimeAsync(DUREE_CYCLE_MS)
    await vi.advanceTimersByTimeAsync(0)

    expect(store.progress).toBe(0)
    expect(store.timeRemaining).toBe(DUREE_CYCLE_MS)

    store.stopProgress()
  })

  it('en cas d\'échec, garde l\'heure du dernier succès et signale l\'échec', async () => {
    vi.setSystemTime(new Date('2026-11-07T11:24:00'))
    const store = useProgressStore()
    await store.startProgress()
    const succes = store.derniereActualisation

    vi.mocked(weatherService.getWeather).mockRejectedValue(new Error('down'))
    await vi.advanceTimersByTimeAsync(DUREE_CYCLE_MS)
    await vi.advanceTimersByTimeAsync(0)

    expect(store.enEchec).toBe(true)
    expect(store.derniereActualisation).toEqual(succes)

    // La source revient : l'heure repart
    vi.mocked(weatherService.getWeather).mockResolvedValue({ weather: null, lastRefresh: null })
    await vi.advanceTimersByTimeAsync(DUREE_CYCLE_MS)
    await vi.advanceTimersByTimeAsync(0)

    expect(store.enEchec).toBe(false)
    expect(store.derniereActualisation?.toTimeString().slice(0, 8)).toBe('11:25:00') // 2 cycles de 30 s après 11:24:00

    store.stopProgress()
  })

  it('après chaque rechargement, vérifie si une nouvelle version est en ligne', async () => {
    vi.mocked(rechargerSiNouvelleVersion).mockClear()
    const store = useProgressStore()
    await store.startProgress()
    expect(rechargerSiNouvelleVersion).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(DUREE_CYCLE_MS)
    await vi.advanceTimersByTimeAsync(0)
    expect(rechargerSiNouvelleVersion).toHaveBeenCalledTimes(2)

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
    expect(store.timeRemaining).toBe(DUREE_CYCLE_MS)

    store.stopProgress()
  })
})
