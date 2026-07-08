import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLanguageStore } from '../languageStore'

describe('languageStore', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('initializes with default language', () => {
    const store = useLanguageStore()
    expect(store.language).toBe('fr')
  })

  it('t() traduit une clé de la section par défaut (weather)', () => {
    const store = useLanguageStore()
    expect(store.t('humidity')).toBe('Humidité')
  })

  it('t() traduit une clé d’une autre section', () => {
    const store = useLanguageStore()
    expect(store.t('networkError', 'errors')).toBe('Erreur réseau')
    expect(store.t('noEvents', 'calendar')).toBe('Aucun événement')
  })

  it('t() retourne la clé si elle est inconnue', () => {
    const store = useLanguageStore()
    expect(store.t('cle-inconnue')).toBe('cle-inconnue')
    expect(store.t('humidity', 'section-inconnue')).toBe('humidity')
  })

  it('t() suit la langue courante', () => {
    const store = useLanguageStore()
    store.language = 'en'
    expect(store.t('humidity')).toBe('Humidity')
  })

  it('t() retourne la clé si la langue est inconnue', () => {
    const store = useLanguageStore()
    store.language = 'de'
    expect(store.t('humidity')).toBe('humidity')
  })

  it('loadLanguage récupère la langue depuis la config du dashboard', async () => {
    global.fetch = vi.fn(async () => ({
      json: async () => ({
        grid: { columns: 12, rows: '70% 25%' },
        modules: [],
        language: 'en',
      }),
    })) as unknown as typeof fetch

    const store = useLanguageStore()
    await store.loadLanguage()

    expect(store.language).toBe('en')
  })
})
