import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { CONFIGURATION_PAR_DEFAUT } from '../../modules/configuration'
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

  describe('configuration des modules', () => {
    const reponse = (configuration?: unknown) => {
      global.fetch = vi.fn(async () => ({
        json: async () => ({ grid: { columns: 12, rows: 'auto' }, modules: [], configuration }),
      })) as unknown as typeof fetch
    }

    it('utilise la disposition standard quand le fichier n’en donne pas', async () => {
      reponse()
      const store = useDashboardStore()
      await store.loadConfig()
      expect(store.configuration).toEqual(CONFIGURATION_PAR_DEFAUT)
    })

    it('adopte une configuration valide du fichier', async () => {
      const seule = { nom: 'Météo seule', placements: [{ id: 'm', module: 'meteo', x: 1, y: 1 }] }
      reponse(seule)
      const store = useDashboardStore()
      await store.loadConfig()
      expect(store.configuration).toEqual(seule)
    })

    it('refuse une configuration invalide : la disposition standard reste', async () => {
      const erreur = vi.spyOn(console, 'error').mockImplementation(() => {})
      reponse({ nom: 'Cassée', placements: [{ id: 'x', module: 'inconnu', x: 1, y: 1 }] })
      const store = useDashboardStore()
      await store.loadConfig()
      expect(store.configuration).toEqual(CONFIGURATION_PAR_DEFAUT)
      expect(erreur).toHaveBeenCalled()
      erreur.mockRestore()
    })

    it('refuse une configuration sans placements', async () => {
      const erreur = vi.spyOn(console, 'error').mockImplementation(() => {})
      reponse({ nom: 'Vide de sens' })
      const store = useDashboardStore()
      await store.loadConfig()
      expect(store.configuration).toEqual(CONFIGURATION_PAR_DEFAUT)
      erreur.mockRestore()
    })
  })

  describe('configuration active du serveur', () => {
    const serveur = (corps: unknown, ok = true) => {
      global.fetch = vi.fn(async () => ({ ok, status: ok ? 200 : 500, json: async () => corps })) as unknown as typeof fetch
    }
    const seule = { nom: 'Météo seule', placements: [{ id: 'm', module: 'meteo', x: 1, y: 1 }] }

    it('adopte la configuration active renvoyée par le serveur', async () => {
      serveur({ id: 'meteo', configuration: seule })
      const store = useDashboardStore()
      await store.chargerConfigurationActive()
      expect(store.configuration).toEqual(seule)
    })

    it('garde la disposition en place quand le serveur n’a pas de configuration active', async () => {
      serveur({ id: null, configuration: null })
      const store = useDashboardStore()
      await store.chargerConfigurationActive()
      expect(store.configuration).toEqual(CONFIGURATION_PAR_DEFAUT)
    })

    it('garde la disposition en place si le serveur est en panne', async () => {
      const erreur = vi.spyOn(console, 'error').mockImplementation(() => {})
      serveur({}, false)
      const store = useDashboardStore()
      store.configuration = seule
      await store.chargerConfigurationActive()
      expect(store.configuration).toEqual(seule)
      erreur.mockRestore()
    })

    it('refuse une configuration invalide du serveur et garde la disposition en place', async () => {
      const erreur = vi.spyOn(console, 'error').mockImplementation(() => {})
      serveur({ id: 'x', configuration: { nom: 'Cassée', placements: [{ id: 'a', module: 'inconnu', x: 1, y: 1 }] } })
      const store = useDashboardStore()
      await store.chargerConfigurationActive()
      expect(store.configuration).toEqual(CONFIGURATION_PAR_DEFAUT)
      erreur.mockRestore()
    })

    it('relit la configuration à intervalle régulier, jusqu’à ce qu’on l’arrête', async () => {
      vi.useFakeTimers()
      serveur({ id: 'meteo', configuration: seule })
      const store = useDashboardStore()
      const arreter = store.suivreConfiguration(1000)
      await vi.advanceTimersByTimeAsync(3100)
      expect(global.fetch).toHaveBeenCalledTimes(3)
      arreter()
      await vi.advanceTimersByTimeAsync(3000)
      expect(global.fetch).toHaveBeenCalledTimes(3)
      vi.useRealTimers()
    })
  })

  describe('relectures de config.json', () => {
    const choisie = { nom: 'Choisie', placements: [{ id: 'm', module: 'meteo', x: 1, y: 1 }] }
    const reseau = (fichier: unknown) => {
      global.fetch = vi.fn(async (url: string | URL | Request) => {
        const u = String(url)
        return {
          ok: true,
          status: 200,
          json: async () => (u.includes('/configuration') ? { id: 'choisie', configuration: choisie } : fichier),
        }
      }) as unknown as typeof fetch
    }

    it('relire config.json ne remet pas la disposition standard à la place de celle du serveur', async () => {
      reseau({ grid: { columns: 12, rows: 'auto' }, modules: [] })
      const store = useDashboardStore()
      await store.loadConfig()
      expect(store.configuration).toEqual(choisie)
      // la météo relit la configuration à chaque montage (via la langue) : plusieurs fois de suite, rien ne change
      for (let n = 0; n < 3; n++) {
        store.configuration = { ...choisie, nom: 'Autre' } // le serveur n'a pas encore répondu
        await store.loadConfig()
        expect(store.configuration).toEqual(choisie)
      }
    })

    it('ne perd pas la configuration en place si config.json est momentanément illisible', async () => {
      const erreur = vi.spyOn(console, 'error').mockImplementation(() => {})
      const store = useDashboardStore()
      store.configuration = choisie
      global.fetch = vi.fn(async () => {
        throw new Error('réseau')
      }) as unknown as typeof fetch
      await store.loadConfig()
      expect(store.configuration).toEqual(choisie)
      erreur.mockRestore()
    })
  })

  describe('mode veille', () => {
    const serveur = (corps: unknown, ok = true) => {
      global.fetch = vi.fn(async () => ({ ok, status: ok ? 200 : 500, json: async () => corps })) as unknown as typeof fetch
    }

    it('est en mode normal au départ', () => {
      expect(useDashboardStore().veille).toBe(false)
    })

    it('suit l’état du serveur : veille puis retour au mode normal', async () => {
      const store = useDashboardStore()
      serveur({ actif: true, depuis: '2026-11-08T20:00:00Z' })
      await store.chargerVeille()
      expect(store.veille).toBe(true)
      serveur({ actif: false, depuis: null })
      await store.chargerVeille()
      expect(store.veille).toBe(false)
    })

    it('une réponse inattendue ne met jamais l’écran en veille', async () => {
      const store = useDashboardStore()
      serveur({ actif: 'oui' })
      await store.chargerVeille()
      expect(store.veille).toBe(false)
    })

    it('en cas de panne du serveur, garde l’état en place (pas de bascule à cause du réseau)', async () => {
      const store = useDashboardStore()
      serveur({ actif: true })
      await store.chargerVeille()
      serveur({}, false)
      await store.chargerVeille()
      expect(store.veille).toBe(true)
    })

    it('relit l’état toutes les 3 secondes, jusqu’à ce qu’on arrête', async () => {
      vi.useFakeTimers()
      serveur({ actif: false })
      const store = useDashboardStore()
      const arreter = store.suivreVeille()
      await vi.advanceTimersByTimeAsync(0)
      expect(global.fetch).toHaveBeenCalledTimes(1) // une première lecture tout de suite
      await vi.advanceTimersByTimeAsync(9000)
      expect(global.fetch).toHaveBeenCalledTimes(4)
      arreter()
      await vi.advanceTimersByTimeAsync(9000)
      expect(global.fetch).toHaveBeenCalledTimes(4)
      vi.useRealTimers()
    })
  })
})
