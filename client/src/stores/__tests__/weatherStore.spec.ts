import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWeatherStore } from '../weatherStore'

describe('weatherStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default weather', () => {
    const store = useWeatherStore()
    expect(store.weather).toBeDefined()
  })
})
