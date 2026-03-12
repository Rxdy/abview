import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MoonIcon from '../icons/MoonIcon.vue'

describe('MoonIcon', () => {
  it('renders an svg element', () => {
    const wrapper = mount(MoonIcon)
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
