import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Header from '../Header.vue'

// Mock the dashboard store
const mockDashboardStore = {
  name: 'Test Dashboard'
}

vi.mock('../../stores/dashboardStore', () => ({
  useDashboardStore: () => mockDashboardStore
}))

describe('Header', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders logo and title', () => {
    const wrapper = mount(Header, {
      stubs: ['DateTimeModule']
    })

    expect(wrapper.find('img').exists()).toBe(true)
    expect(wrapper.text()).toContain('Abview')
  })

  it('displays dashboard name from store', () => {
    const wrapper = mount(Header, {
      stubs: ['DateTimeModule']
    })

    expect(wrapper.text()).toContain('Test Dashboard')
  })

  it('includes DateTimeModule', () => {
    const wrapper = mount(Header, {
      stubs: ['DateTimeModule']
    })

    expect(wrapper.findComponent({ name: 'DateTimeModule' }).exists()).toBe(true)
  })

  it('has correct structure', () => {
    const wrapper = mount(Header, {
      stubs: ['DateTimeModule']
    })

    expect(wrapper.find('.header').exists()).toBe(true)
    expect(wrapper.find('.logo').exists()).toBe(true)
    expect(wrapper.find('.center').exists()).toBe(true)
  })
})