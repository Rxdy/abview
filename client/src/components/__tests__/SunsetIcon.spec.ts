import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SunsetIcon from '../icons/SunsetIcon.vue'

describe('SunsetIcon', () => {
  it('renders an svg element', () => {
    const wrapper = mount(SunsetIcon)
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
