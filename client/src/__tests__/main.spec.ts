import { describe, it, expect, vi } from 'vitest'

const loadConfig = vi.fn().mockResolvedValue(undefined)
const setTheme = vi.fn()

vi.mock('../stores/dashboardStore', () => ({ useDashboardStore: () => ({ loadConfig }) }))
vi.mock('../stores/themeStore', () => ({ useThemeStore: () => ({ setTheme }) }))
vi.mock('../App.vue', () => ({ default: { template: '<div class="app-simulee">ok</div>' } }))
vi.mock('../assets/main.css', () => ({}))

describe('main (démarrage du kiosque)', () => {
  it("charge la config, force le thème clair puis monte l'application sur #app", async () => {
    document.body.innerHTML = '<div id="app"></div>'
    await import('../main')
    await vi.waitFor(() => expect(document.querySelector('#app .app-simulee')).not.toBeNull())

    expect(loadConfig).toHaveBeenCalledTimes(1)
    expect(setTheme).toHaveBeenCalledWith(false)
  })
})
