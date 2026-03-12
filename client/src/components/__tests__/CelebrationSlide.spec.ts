import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CelebrationSlide from '../annual-recap/CelebrationSlide.vue'

describe('CelebrationSlide', () => {
  it('renders celebration slide with correct year', () => {
    const wrapper = mount(CelebrationSlide, {
      props: {
        currentYear: 2026,
        pastYear: 2025
      }
    })

    expect(wrapper.find('h2').text()).toContain('Bonne année 2026')
    expect(wrapper.find('p').text()).toContain('l\'année 2025')
  })

  it('displays fireworks element', () => {
    const wrapper = mount(CelebrationSlide, {
      props: {
        currentYear: 2026,
        pastYear: 2025
      }
    })

    expect(wrapper.find('.fireworks').exists()).toBe(true)
  })

  it('displays celebration messages', () => {
    const wrapper = mount(CelebrationSlide, {
      props: {
        currentYear: 2026,
        pastYear: 2025
      }
    })

    const messages = wrapper.findAll('.celebration-message')
    expect(messages.length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('Que cette nouvelle année')
  })

  it('has celebration class', () => {
    const wrapper = mount(CelebrationSlide, {
      props: {
        currentYear: 2026,
        pastYear: 2025
      }
    })

    expect(wrapper.find('.celebration').exists()).toBe(true)
  })

  it('renders with different years', () => {
    const wrapper = mount(CelebrationSlide, {
      props: {
        currentYear: 2027,
        pastYear: 2026
      }
    })

    expect(wrapper.find('h2').text()).toContain('Bonne année 2027')
    expect(wrapper.text()).toContain('l\'année 2026')
  })
})
