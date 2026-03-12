import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SunriseIcon from '../icons/SunriseIcon.vue'

describe('SunriseIcon', () => {
  it('renders an svg element', () => {
    const wrapper = mount(SunriseIcon)
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
