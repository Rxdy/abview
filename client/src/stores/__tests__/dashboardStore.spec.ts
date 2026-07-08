import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDashboardStore } from '../dashboardStore'

describe('dashboardStore', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('initializes with default dashboard state', () => {
    const store = useDashboardStore()
    expect(store.grid).toEqual({ columns: 12, rows: '70% 25%' })
    expect(store.modules).toEqual([])
    expect(store.name).toBe('Abview')
    expect(store.language).toBe('fr')
  })

  it('loadConfig charge la configuration depuis config.json', async () => {
    global.fetch = vi.fn(async () => ({
      json: async () => ({
        grid: { columns: 6, rows: '50% 50%' },
        modules: [{ id: 'weather', component: 'WeatherModule', visible: true }],
        name: 'Salon',
        language: 'en',
      }),
    })) as unknown as typeof fetch

    const store = useDashboardStore()
    await store.loadConfig()

    expect(store.grid).toEqual({ columns: 6, rows: '50% 50%' })
    expect(store.modules).toHaveLength(1)
    expect(store.name).toBe('Salon')
    expect(store.language).toBe('en')
  })

  it('loadConfig applique les défauts si name/language absents', async () => {
    global.fetch = vi.fn(async () => ({
      json: async () => ({
        grid: { columns: 12, rows: '70% 25%' },
        modules: [],
      }),
    })) as unknown as typeof fetch

    const store = useDashboardStore()
    await store.loadConfig()

    expect(store.name).toBe('Abview')
    expect(store.language).toBe('fr')
  })

  it('loadConfig retombe sur la config par défaut en cas d’échec', async () => {
    global.fetch = vi.fn(async () => {
      throw new Error('offline')
    }) as unknown as typeof fetch

    const store = useDashboardStore()
    await store.loadConfig()

    expect(store.grid).toEqual({ columns: 12, rows: '70% 25%' })
    expect(store.modules.map((m) => m.id)).toEqual(['calendar', 'weather', 'tasks'])
    expect(store.language).toBe('fr')
  })
})
