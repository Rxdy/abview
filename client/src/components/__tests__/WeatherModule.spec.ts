import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises } from '@vue/test-utils'
import WeatherModule from '../WeatherModule.vue'
import { useThemeStore } from '../../stores/themeStore'
import ClearDayIcon from '../icons/ClearDayIcon.vue'
import CloudyIcon from '../icons/CloudyIcon.vue'
import PartlyCloudyDayIcon from '../icons/PartlyCloudyDayIcon.vue'
import RainIcon from '../icons/RainIcon.vue'
import HeavyRain from '../icons/HeavyRain.vue'
import SnowIcon from '../icons/SnowIcon.vue'
import HailIcon from '../icons/HailIcon.vue'
import ThunderIcon from '../icons/ThunderIcon.vue'
import WindIcon from '../icons/WindIcon.vue'

// Mock the weather store
const mockWeatherStore = {
  loading: false,
  error: null as string | null,
  weather: null as any,
  fetchWeather: vi.fn(),
  startPolling: vi.fn(),
  stopPolling: vi.fn()
}

vi.mock('../../stores/weatherStore', () => ({
  useWeatherStore: () => mockWeatherStore
}))

vi.mock('../../stores/dashboardStore', () => ({
  useDashboardStore: () => ({
    loadConfig: vi.fn().mockResolvedValue(undefined),
    language: 'fr'
  })
}))

const fullWeather = {
  current: {
    conditions: 'Clear',
    temperature: 25,
    feelsLike: 24,
    humidity: 40,
    windSpeed: 12,
    windDirection: 90,
    cloudCover: 10,
    uvIndex: 6,
    datetime: '14:00',
    sunrise: '06:15:00',
    sunset: '21:30:00',
  },
  forecast: [
    { date: '2026-07-08', tempMin: 15, tempMax: 30, description: 'Clear', icon: 'clear-day' },
    { date: '2026-07-09', tempMin: 16, tempMax: 31, description: 'Rain', icon: 'rain' },
    { date: '2026-07-10', tempMin: 14, tempMax: 28, description: 'Snow', icon: 'snow' },
    { date: '2026-07-11', tempMin: 13, tempMax: 27, description: 'Partly cloudy', icon: 'pc' },
    { date: '2026-07-12', tempMin: 12, tempMax: 26, description: 'Thunder', icon: 'thunder' },
    { date: '2026-07-13', tempMin: 11, tempMax: 25, description: 'Fog', icon: 'fog' },
  ],
}

describe('WeatherModule', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockWeatherStore.loading = false
    mockWeatherStore.error = null
    mockWeatherStore.weather = null
  })

  it('shows loading skeleton when loading', () => {
    mockWeatherStore.loading = true

    const wrapper = mount(WeatherModule, {
      stubs: ['ErrorDisplay']
    })

    expect(wrapper.find('.skeleton').exists()).toBe(true)
    expect(wrapper.find('.skeleton-current').exists()).toBe(true)
  })

  it('shows error display when error', () => {
    mockWeatherStore.error = 'Network error'

    const wrapper = mount(WeatherModule, {
      stubs: ['ErrorDisplay']
    })

    expect(wrapper.findComponent({ name: 'ErrorDisplay' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ErrorDisplay' }).props('type')).toBe('network')
  })

  it('shows no data error when no weather', () => {
    const wrapper = mount(WeatherModule, {
      stubs: ['ErrorDisplay']
    })

    expect(wrapper.findComponent({ name: 'ErrorDisplay' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ErrorDisplay' }).props('type')).toBe('no-data')
  })

  it('renders weather content when weather data exists', () => {
    mockWeatherStore.weather = fullWeather

    const wrapper = mount(WeatherModule, {
      stubs: ['ErrorDisplay']
    })

    expect(wrapper.find('.weather-content').exists()).toBe(true)
    expect(wrapper.find('.current-weather').exists()).toBe(true)
    expect(wrapper.text()).toContain('25°C')
    expect(wrapper.text()).toContain('06:15') // lever
    expect(wrapper.text()).toContain('21:30') // coucher
  })

  it('affiche 5 jours de prévisions, le premier étant « Demain »', () => {
    mockWeatherStore.weather = fullWeather

    const wrapper = mount(WeatherModule, {
      stubs: ['ErrorDisplay']
    })

    const days = wrapper.findAll('.forecast-day')
    expect(days).toHaveLength(5)
    expect(days[0].text()).toContain('Demain')
    expect(days[0].text()).toContain('Pluie') // Rain traduit
    expect(days[1].text()).toContain('Neige')
  })

  it('met à jour les heures de soleil du themeStore au montage', () => {
    mockWeatherStore.weather = fullWeather

    mount(WeatherModule, { stubs: ['ErrorDisplay'] })

    const themeStore = useThemeStore()
    expect(themeStore.sunTimes).toEqual({ sunrise: '06:15', sunset: '21:30' })
  })

  it('lance le fetch et le polling au montage', async () => {
    mount(WeatherModule, { stubs: ['ErrorDisplay'] })
    await flushPromises() // onMounted attend loadLanguage avant de fetcher

    expect(mockWeatherStore.fetchWeather).toHaveBeenCalled()
    expect(mockWeatherStore.startPolling).toHaveBeenCalled()
  })

  it('affiche la barre de progression selon la prop progress', () => {
    const wrapper = mount(WeatherModule, {
      props: { progress: 42 },
      stubs: ['ErrorDisplay'],
    })

    expect(wrapper.find('.module-progress-fill').attributes('style')).toContain('width: 42%')
  })

  describe('helpers', () => {
    function vm() {
      mockWeatherStore.weather = fullWeather
      return mount(WeatherModule, { stubs: ['ErrorDisplay'] }).vm as any
    }

    it('getUvColor couvre toutes les plages', () => {
      const m = vm()
      expect(m.getUvColor(1)).toBe('green')
      expect(m.getUvColor(4)).toBe('yellow')
      expect(m.getUvColor(6)).toBe('orange')
      expect(m.getUvColor(9)).toBe('red')
      expect(m.getUvColor(12)).toBe('purple')
    })

    it('getUvLabel couvre toutes les plages', () => {
      const m = vm()
      expect(m.getUvLabel(1)).toBe('Faible')
      expect(m.getUvLabel(4)).toBe('Modéré')
      expect(m.getUvLabel(6)).toBe('Élevé')
      expect(m.getUvLabel(9)).toBe('Très élevé')
      expect(m.getUvLabel(12)).toBe('Extrême')
    })

    it('getTempColor couvre toutes les plages', () => {
      const m = vm()
      expect(m.getTempColor(-15)).toBe('#0033cc')
      expect(m.getTempColor(-5)).toBe('#3366ff')
      expect(m.getTempColor(5)).toBe('#33b3ff')
      expect(m.getTempColor(15)).toBe('#ffcc33')
      expect(m.getTempColor(25)).toBe('#ff8c00')
      expect(m.getTempColor(35)).toBe('#ff3300')
      expect(m.getTempColor(45)).toBe('#cc0000')
    })

    it('getWindDirection convertit les degrés en points cardinaux', () => {
      const m = vm()
      expect(m.getWindDirection(0)).toBe('N')
      expect(m.getWindDirection(90)).toBe('E')
      expect(m.getWindDirection(180)).toBe('S')
      expect(m.getWindDirection(270)).toBe('W')
      expect(m.getWindDirection(360)).toBe('N')
    })

    it('translateCondition traduit les conditions composées', () => {
      const m = vm()
      expect(m.translateCondition('Clear')).toBe('Clair')
      expect(m.translateCondition('Partly cloudy')).toBe('Partiellement nuageux')
      expect(m.translateCondition('Overcast')).toBe('Nuageux')
      expect(m.translateCondition('Heavy rain')).toBe('Forte pluie')
      expect(m.translateCondition('Light rain')).toBe('Pluie légère')
      expect(m.translateCondition('Rain, Partially cloudy')).toContain('Pluie')
      expect(m.translateCondition('Rain with thunder')).toBe('Pluie, Orage')
      expect(m.translateCondition('Snow and hail')).toBe('Neige, Grêle')
      expect(m.translateCondition('Windy')).toBe('Vent')
      expect(m.translateCondition('Fog')).toBe('Brouillard')
      expect(m.translateCondition('Mist')).toBe('Brume')
      expect(m.translateCondition('Storm')).toBe('Orage')
      expect(m.translateCondition('Inconnu')).toBe('Inconnu') // passthrough
      expect(m.translateCondition('')).toBe('')
    })

    it('getWeatherIcon choisit la bonne icône', () => {
      const m = vm()
      expect(m.getWeatherIcon('Clear')).toBe(ClearDayIcon)
      expect(m.getWeatherIcon('Partly cloudy')).toBe(PartlyCloudyDayIcon)
      expect(m.getWeatherIcon('Overcast')).toBe(CloudyIcon)
      expect(m.getWeatherIcon('Heavy rain')).toBe(HeavyRain)
      expect(m.getWeatherIcon('Light rain')).toBe(RainIcon)
      expect(m.getWeatherIcon('Rain')).toBe(RainIcon)
      expect(m.getWeatherIcon('Snow')).toBe(SnowIcon)
      expect(m.getWeatherIcon('Hail')).toBe(HailIcon)
      expect(m.getWeatherIcon('Thunder')).toBe(ThunderIcon)
      expect(m.getWeatherIcon('Storm')).toBe(ThunderIcon)
      expect(m.getWeatherIcon('Wind')).toBe(WindIcon)
      expect(m.getWeatherIcon('Fog')).toBe(CloudyIcon)
      expect(m.getWeatherIcon('Mist')).toBe(CloudyIcon)
      expect(m.getWeatherIcon('Bizarre')).toBe(ClearDayIcon) // défaut
      expect(m.getWeatherIcon('')).toBe(ClearDayIcon)
    })

    it('getWeatherIconClass choisit la bonne animation', () => {
      const m = vm()
      expect(m.getWeatherIconClass('Clear')).toBe('rotate-slow')
      expect(m.getWeatherIconClass('Wind')).toBe('oscillate')
      expect(m.getWeatherIconClass('Rain')).toBe('pulse-rain')
      expect(m.getWeatherIconClass('Snow')).toBe('float-snow')
      expect(m.getWeatherIconClass('Thunder')).toBe('flash-thunder')
      expect(m.getWeatherIconClass('Overcast')).toBe('float-cloud')
      expect(m.getWeatherIconClass('Autre')).toBe('')
      expect(m.getWeatherIconClass('')).toBe('')
    })
  })
})
