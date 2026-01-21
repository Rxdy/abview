import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Footer from '../Footer.vue'

describe('Footer', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  it('displays current year', () => {
    const mockDate = new Date(2026, 0, 20)
    vi.setSystemTime(mockDate)

    const wrapper = mount(Footer, {
      stubs: ['ProgressBar']
    })

    expect(wrapper.text()).toContain('2026')
    expect(wrapper.text()).toContain('Abview')
  })

  it('displays version number', () => {
    const wrapper = mount(Footer, {
      stubs: ['ProgressBar']
    })

    expect(wrapper.text()).toContain('v2.3.0')
  })

  it('includes ProgressBar component', () => {
    const wrapper = mount(Footer, {
      stubs: ['ProgressBar']
    })

    expect(wrapper.findComponent({ name: 'ProgressBar' }).exists()).toBe(true)
  })

  it('has correct layout structure', () => {
    const wrapper = mount(Footer, {
      stubs: ['ProgressBar']
    })

    expect(wrapper.find('.footer').exists()).toBe(true)
    expect(wrapper.find('.left').exists()).toBe(true)
    expect(wrapper.find('.center').exists()).toBe(true)
    expect(wrapper.find('.right').exists()).toBe(true)
  })
})