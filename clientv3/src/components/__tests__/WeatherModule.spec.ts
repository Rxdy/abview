import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WeatherModule from '../WeatherModule.vue'

// Mock the weather store
const mockWeatherStore = {
  loading: false,
  error: null as string | null,
  weather: null,
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

describe('WeatherModule', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
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
    mockWeatherStore.loading = false
    mockWeatherStore.error = 'Network error'

    const wrapper = mount(WeatherModule, {
      stubs: ['ErrorDisplay']
    })

    expect(wrapper.findComponent({ name: 'ErrorDisplay' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ErrorDisplay' }).props('type')).toBe('network')
  })

  it('shows no data error when no weather', () => {
    mockWeatherStore.loading = false
    mockWeatherStore.error = null
    mockWeatherStore.weather = null

    const wrapper = mount(WeatherModule, {
      stubs: ['ErrorDisplay']
    })

    expect(wrapper.findComponent({ name: 'ErrorDisplay' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ErrorDisplay' }).props('type')).toBe('no-data')
  })

  it('renders weather content when weather data exists', () => {
    mockWeatherStore.loading = false
    mockWeatherStore.error = null
    mockWeatherStore.weather = {
      current: {
        conditions: 'sunny',
        temperature: 20,
        time: '14:00'
      },
      forecast: []
    }

    const wrapper = mount(WeatherModule, {
      stubs: ['ErrorDisplay']
    })

    expect(wrapper.find('.weather-content').exists()).toBe(true)
    expect(wrapper.find('.current-weather').exists()).toBe(true)
  })

  it('displays current temperature', () => {
    mockWeatherStore.weather = {
      current: {
        conditions: 'sunny',
        temperature: 25,
        time: '14:00'
      },
      forecast: []
    }

    const wrapper = mount(WeatherModule, {
      stubs: ['ErrorDisplay']
    })

    expect(wrapper.text()).toContain('25°C')
  })
})