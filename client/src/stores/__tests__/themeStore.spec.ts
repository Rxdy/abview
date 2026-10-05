import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useThemeStore } from '../themeStore'

describe('themeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with default theme', () => {
    const store = useThemeStore()
    expect(store.isDark).toBe(false)
    expect(store.sunTimes).toEqual({ sunrise: '07:00', sunset: '17:30' })
  })

  it('toggleTheme inverse le thème', () => {
    const store = useThemeStore()
    store.toggleTheme()
    expect(store.isDark).toBe(true)
    store.toggleTheme()
    expect(store.isDark).toBe(false)
  })

  it('setTheme force la valeur', () => {
    const store = useThemeStore()
    store.setTheme(true)
    expect(store.isDark).toBe(true)
    store.setTheme(false)
    expect(store.isDark).toBe(false)
  })

  it('updateSunTimes met à jour les heures de lever/coucher', () => {
    const store = useThemeStore()
    store.updateSunTimes({ sunrise: '06:15', sunset: '21:45' })
    expect(store.sunTimes).toEqual({ sunrise: '06:15', sunset: '21:45' })
  })

  it('updateThemeBasedOnTime passe en clair la journée', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 8, 12, 0)) // midi

    const store = useThemeStore()
    store.updateSunTimes({ sunrise: '07:00', sunset: '21:00' })
    store.updateThemeBasedOnTime()

    expect(store.isDark).toBe(false)
  })

  it('updateThemeBasedOnTime passe en sombre la nuit', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 8, 23, 0)) // 23h

    const store = useThemeStore()
    store.updateSunTimes({ sunrise: '07:00', sunset: '21:00' })
    store.updateThemeBasedOnTime()

    expect(store.isDark).toBe(true)
  })

  it('updateThemeBasedOnTime passe en sombre avant le lever du soleil', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 8, 5, 30))

    const store = useThemeStore()
    store.updateSunTimes({ sunrise: '07:00', sunset: '21:00' })
    store.updateThemeBasedOnTime()

    expect(store.isDark).toBe(true)
  })

  it('updateThemeBasedOnTime retombe sur les défauts si les heures sont invalides', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 8, 12, 0)) // midi, entre 7:00 et 17:30 par défaut

    const store = useThemeStore()
    store.updateSunTimes({ sunrise: 'invalid', sunset: 'invalid' })
    store.updateThemeBasedOnTime()

    expect(store.isDark).toBe(false)
  })

  it('startAutoThemeUpdate applique le thème immédiatement puis chaque minute', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 8, 20, 59, 30)) // 30 s avant le coucher (21:00)

    const store = useThemeStore()
    store.updateSunTimes({ sunrise: '07:00', sunset: '21:00' })
    store.startAutoThemeUpdate()

    expect(store.isDark).toBe(false)

    // Une minute plus tard, le soleil est couché
    vi.advanceTimersByTime(60 * 1000)

    expect(store.isDark).toBe(true)
  })

  it('testThemeSwitch applique le thème selon l’heure', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 8, 23, 0))

    const store = useThemeStore()
    store.updateSunTimes({ sunrise: '07:00', sunset: '21:00' })
    store.testThemeSwitch()

    expect(store.isDark).toBe(true)
  })
})
