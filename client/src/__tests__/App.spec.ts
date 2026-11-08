import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from '../App.vue'
import { useThemeStore } from '../stores/themeStore'
import { useWeatherStore } from '../stores/weatherStore'
import { useDashboardStore } from '../stores/dashboardStore'

const stubs = {
  RouterView: { template: '<div class="vue-routee" />' },
  Header: { template: '<header class="entete" />' },
  Footer: { template: '<footer class="pied" />' },
  AnnualRecapWrapper: { template: '<div class="recap" />' },
  BirthdayEffect: { template: '<div class="anniversaire" />' },
  VeilleView: { template: '<div class="mur-veille" />' },
}

describe('App', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it("assemble l'en-tête, la vue courante, le pied, le récap annuel et l'effet d'anniversaire", () => {
    vi.spyOn(useWeatherStore(), 'fetchWeather').mockResolvedValue(undefined as never)
    const wrapper = mount(App, { global: { stubs } })

    for (const sel of ['.entete', '.vue-routee', '.pied', '.recap', '.anniversaire']) {
      expect(wrapper.find(sel).exists(), sel).toBe(true)
    }
    expect(wrapper.find('main.content .vue-routee').exists()).toBe(true)
  })

  it('charge la météo au démarrage', () => {
    const fetchWeather = vi.spyOn(useWeatherStore(), 'fetchWeather').mockResolvedValue(undefined as never)
    mount(App, { global: { stubs } })
    expect(fetchWeather).toHaveBeenCalledTimes(1)
  })

  it('suit le thème : classe light-theme seulement hors thème sombre', async () => {
    vi.spyOn(useWeatherStore(), 'fetchWeather').mockResolvedValue(undefined as never)
    const theme = useThemeStore()
    theme.setTheme(false)
    const wrapper = mount(App, { global: { stubs } })
    expect(wrapper.classes()).toContain('light-theme')

    theme.setTheme(true)
    await wrapper.vm.$nextTick()
    expect(wrapper.classes()).not.toContain('light-theme')
  })

  it('affiche le mur de cadres par-dessus tout quand le serveur demande la veille, et le retire ensuite', async () => {
    vi.spyOn(useWeatherStore(), 'fetchWeather').mockResolvedValue(undefined as never)
    const store = useDashboardStore()
    vi.spyOn(store, 'suivreVeille').mockReturnValue(() => {})
    const wrapper = mount(App, { global: { stubs } })
    expect(wrapper.find('.mur-veille').exists()).toBe(false)

    store.veille = true
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.mur-veille').exists()).toBe(true)
    expect(wrapper.find('.entete').exists()).toBe(true) // le tableau de bord reste dessous

    store.veille = false
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.mur-veille').exists()).toBe(false)
  })

  it('demande l’état de veille au démarrage et arrête de le demander à la fermeture', () => {
    vi.spyOn(useWeatherStore(), 'fetchWeather').mockResolvedValue(undefined as never)
    const arreter = vi.fn()
    const suivre = vi.spyOn(useDashboardStore(), 'suivreVeille').mockReturnValue(arreter)
    const wrapper = mount(App, { global: { stubs } })
    expect(suivre).toHaveBeenCalledTimes(1)
    wrapper.unmount()
    expect(arreter).toHaveBeenCalledTimes(1)
  })
})
