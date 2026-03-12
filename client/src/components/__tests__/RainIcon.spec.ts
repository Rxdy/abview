import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RainIcon from '../icons/RainIcon.vue'

describe('RainIcon', () => {
  it('renders an svg element', () => {
    const wrapper = mount(RainIcon)
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
