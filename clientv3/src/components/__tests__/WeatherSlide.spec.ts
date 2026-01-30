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
      days: [] // Mock pour éviter les calculs complexes
    },
    isFullscreen: false
  }

  it('renders weather statistics correctly', () => {
    const wrapper = mount(WeatherSlide, {
      props: mockWeatherData
    })

    expect(wrapper.find('h3').text()).toContain('Météo de 2025')
    expect(wrapper.find('.weather-overview').exists()).toBe(true)
  })

  it('displays average temperature', () => {
    const wrapper = mount(WeatherSlide, {
      props: mockWeatherData
    })

    const tempCard = wrapper.find('.metric-card').find('.metric-value')
    expect(tempCard.text()).toContain('18°C')
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

    const extremesSection = wrapper.find('.weather-extremes')
    expect(extremesSection.exists()).toBe(true)
    expect(extremesSection.text()).toContain('5°C')
    expect(extremesSection.text()).toContain('35°C')
  })

  it('displays coldest and hottest days', () => {
    const wrapper = mount(WeatherSlide, {
      props: mockWeatherData
    })

    expect(wrapper.text()).toContain('15 janv. 2025')
    expect(wrapper.text()).toContain('20 juil. 2025')
  })

  it('shows weather conditions summary', () => {
    const wrapper = mount(WeatherSlide, {
      props: mockWeatherData
    })

    const conditionsGrid = wrapper.find('.conditions-grid')
    expect(conditionsGrid.exists()).toBe(true)

    const conditionCards = conditionsGrid.findAll('.condition-card')
    expect(conditionCards.length).toBeGreaterThan(0)
  })

  it('displays rainy and sunny days count', () => {
    const wrapper = mount(WeatherSlide, {
      props: mockWeatherData
    })

    expect(wrapper.text()).toContain('85 jours')
    expect(wrapper.text()).toContain('180 jours')
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

  it('formats dates correctly', () => {
    const wrapper = mount(WeatherSlide, {
      props: mockWeatherData
    })

    // Vérifier le formatage des dates françaises
    expect(wrapper.text()).toContain('janv.')
    expect(wrapper.text()).toContain('juil.')
  })
})