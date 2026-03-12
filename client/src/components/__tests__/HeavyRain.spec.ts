import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HeavyRain from '../icons/HeavyRain.vue'

describe('HeavyRain', () => {
  it('renders an svg element', () => {
    const wrapper = mount(HeavyRain)
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
