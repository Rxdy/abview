import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WeatherSlide from '../annual-recap/WeatherSlide.vue'

describe('WeatherSlide', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mockWeatherData = {
    pastYear: 2025,
    averageTemp: 18,
    sunnyDays: 180,
    rainyDays: 85,
    weatherDescription: 'climat tempéré avec saisons marquées',
    weatherStats: {
      averageTemp: 18,
      coldestDay: {
        date: '2025-01-15',
        temp: 5,
        description: 'très froid'
      },
      hottestDay: {
        date: '2025-07-20',
        temp: 35,
        description: 'canicule'
      },
      rainiestDay: {
        date: '2025-04-10',
        precip: 25,
        description: 'pluie torrentielle'
      },
      rainyDays: 85,
      sunnyDays: 180,
      totalDays: 365,
      days: [
        // Coldest day
        {
          date: '2025-01-15',
          tempMin: 5,
          tempMax: 10,
          feelsLike: 2,
          precip: 0,
          description: 'très froid'
        },
        // Hottest day
        {
          date: '2025-07-20',
          tempMin: 28,
          tempMax: 35,
          feelsLike: 38,
          precip: 0,
          description: 'canicule'
        },
        // Rainiest day
        {
          date: '2025-04-10',
          tempMin: 10,
          tempMax: 15,
          feelsLike: 9,
          precip: 25,
          description: 'pluie torrentielle'
        }
      ]
    },
    isFullscreen: false
  }

  it('renders weather statistics correctly', () => {
    const wrapper = mount(WeatherSlide, {
      props: mockWeatherData
    })

    expect(wrapper.find('h3').text()).toContain('climat')
    expect(wrapper.find('.weather-slide').exists()).toBe(true)
  })

  it('displays average temperature', () => {
    const wrapper = mount(WeatherSlide, {
      props: mockWeatherData
    })

    expect(wrapper.text()).toContain('18°C')
  })

  it('displays weather description', () => {
    const wrapper = mount(WeatherSlide, {
      props: mockWeatherData
    })

    expect(wrapper.text()).toContain('climat tempéré avec saisons marquées')
  })

  it('shows extreme temperatures', () => {
    const wrapper = mount(WeatherSlide, {
      props: mockWeatherData
    })

    expect(wrapper.text()).toContain('5°C')
    expect(wrapper.text()).toContain('35°C')
  })

  it('displays coldest and hottest days', () => {
    const wrapper = mount(WeatherSlide, {
      props: mockWeatherData
    })

    const text = wrapper.text()
    // Should show temperatures and dates in some format
    expect(text).toContain('5°C')
    expect(text).toContain('35°C')
  })

  it('shows records section', () => {
    const wrapper = mount(WeatherSlide, {
      props: mockWeatherData
    })

    expect(wrapper.text()).toContain('Records de l\'année')
  })

  it('displays rainy and sunny days count', () => {
    const wrapper = mount(WeatherSlide, {
      props: mockWeatherData
    })

    expect(wrapper.text()).toContain('85')
    expect(wrapper.text()).toContain('180')
  })

  it('handles missing weather stats gracefully', () => {
    const wrapper = mount(WeatherSlide, {
      props: {
        ...mockWeatherData,
        weatherStats: null
      }
    })

    // Le composant devrait quand même se rendre sans erreur
    expect(wrapper.exists()).toBe(true)
  })

  it('displays weather-slide class', () => {
    const wrapper = mount(WeatherSlide, {
      props: mockWeatherData
    })

    expect(wrapper.find('.weather-slide').exists()).toBe(true)
  })
})