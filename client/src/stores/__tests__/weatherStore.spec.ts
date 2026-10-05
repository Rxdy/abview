import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWeatherStore } from '../weatherStore'
import { useErrorStore } from '../errorStore'
import { useProgressStore } from '../progressStore'
import { weatherService } from '../../services/weatherService'

vi.mock('../../services/weatherService', () => ({
  weatherService: {
    getWeather: vi.fn(),
  },
}))

const mockGetWeather = vi.mocked(weatherService.getWeather)

const fakeWeather = {
  current: { temperature: 20, sunrise: '06:30:00', sunset: '21:15:00' },
  forecast: [],
}

describe('weatherStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockGetWeather.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with default weather', () => {
    const store = useWeatherStore()
    expect(store.weather).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('fetchWeather met à jour la météo, sunrise/sunset et lastRefresh', async () => {
    const lastRefresh = new Date('2026-07-08T10:00:00Z')
    mockGetWeather.mockResolvedValue({ weather: fakeWeather, lastRefresh })

    const store = useWeatherStore()
    await store.fetchWeather()

    expect(store.weather).toEqual(fakeWeather)
    expect(store.sunrise).toContain('T06:30:00')
    expect(store.sunset).toContain('T21:15:00')
    expect(store.lastRefresh).toEqual(lastRefresh)
    expect(store.loading).toBe(false)
  })

  it('fetchWeather reset la barre de progression quand les données changent', async () => {
    mockGetWeather.mockResolvedValue({ weather: fakeWeather, lastRefresh: null })

    const store = useWeatherStore()
    const progressStore = useProgressStore()
    const resetSpy = vi.spyOn(progressStore, 'resetProgress')

    await store.fetchWeather()

    expect(resetSpy).toHaveBeenCalledTimes(1)
  })

  it('fetchWeather ne reset pas la progression si les données sont identiques', async () => {
    mockGetWeather.mockResolvedValue({ weather: fakeWeather, lastRefresh: null })

    const store = useWeatherStore()
    const progressStore = useProgressStore()
    const resetSpy = vi.spyOn(progressStore, 'resetProgress')

    await store.fetchWeather()
    await store.fetchWeather()

    expect(resetSpy).toHaveBeenCalledTimes(1)
  })

  it('fetchWeather laisse sunrise/sunset à null sans bloc current', async () => {
    mockGetWeather.mockResolvedValue({ weather: { forecast: [] }, lastRefresh: null })

    const store = useWeatherStore()
    await store.fetchWeather()

    expect(store.sunrise).toBeNull()
    expect(store.sunset).toBeNull()
  })

  it('fetchWeather(isRefresh) ne passe pas loading à true', async () => {
    let loadingDuringFetch: boolean | null = null
    const store = useWeatherStore()
    mockGetWeather.mockImplementation(async () => {
      loadingDuringFetch = store.loading
      return { weather: fakeWeather, lastRefresh: null }
    })

    await store.fetchWeather(true)

    expect(loadingDuringFetch).toBe(false)
  })

  it.each([
    ['fetch failed', 'network'],
    ['no data available', 'no-data'],
    ['service unavailable', 'service-unavailable'],
    ['boom', 'generic'],
  ])('fetchWeather en erreur "%s" remonte une erreur de type %s', async (message, type) => {
    mockGetWeather.mockRejectedValue(new Error(message))

    const store = useWeatherStore()
    const errorStore = useErrorStore()
    await store.fetchWeather()

    expect(store.error).toBe(message)
    expect(store.loading).toBe(false)
    expect(errorStore.errors).toHaveLength(1)
    expect(errorStore.errors[0]).toMatchObject({ type, message, module: 'weather' })
  })

  it('pastYearWeatherStats retourne un objet (placeholder)', () => {
    const store = useWeatherStore()
    expect(store.pastYearWeatherStats).toEqual({})
  })

  it('startPolling relance fetchWeather chaque minute', async () => {
    vi.useFakeTimers()
    mockGetWeather.mockResolvedValue({ weather: fakeWeather, lastRefresh: null })

    const store = useWeatherStore()
    store.startPolling()

    expect(mockGetWeather).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(60 * 1000)
    expect(mockGetWeather).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(60 * 1000)
    expect(mockGetWeather).toHaveBeenCalledTimes(2)
  })
})
