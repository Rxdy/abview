import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ErrorDisplay from '../ErrorDisplay.vue'

// Mock the language store
const mockLanguageStore = {
  t: vi.fn((key: string) => key) // Mock translation to return the key
}

vi.mock('../../stores/languageStore', () => ({
  useLanguageStore: () => mockLanguageStore
}))

describe('ErrorDisplay', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders network error correctly', () => {
    const wrapper = mount(ErrorDisplay, {
      props: {
        type: 'network'
      }
    })

    expect(wrapper.find('.indicator-1.active').exists()).toBe(true)
    expect(wrapper.text()).toContain('networkError')
    expect(wrapper.text()).toContain('networkErrorMessage')
  })

  it('renders no-data error correctly', () => {
    const wrapper = mount(ErrorDisplay, {
      props: {
        type: 'no-data'
      }
    })

    expect(wrapper.find('.indicator-2.active').exists()).toBe(true)
    expect(wrapper.text()).toContain('noData')
    expect(wrapper.text()).toContain('noDataMessage')
  })

  it('renders service-unavailable error correctly', () => {
    const wrapper = mount(ErrorDisplay, {
      props: {
        type: 'service-unavailable'
      }
    })

    expect(wrapper.find('.indicator-3.active').exists()).toBe(true)
    expect(wrapper.text()).toContain('serviceUnavailable')
    expect(wrapper.text()).toContain('serviceUnavailableMessage')
  })

  it('renders generic error correctly', () => {
    const wrapper = mount(ErrorDisplay, {
      props: {
        type: 'generic'
      }
    })

    expect(wrapper.text()).toContain('error')
    expect(wrapper.text()).toContain('genericErrorMessage')
  })

  it('displays error visual elements', () => {
    const wrapper = mount(ErrorDisplay, {
      props: {
        type: 'network'
      }
    })

    expect(wrapper.find('.error-visual').exists()).toBe(true)
    expect(wrapper.find('.error-icon-container').exists()).toBe(true)
    expect(wrapper.find('.error-patterns').exists()).toBe(true)
  })
})