import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ClearDayIcon from '../icons/ClearDayIcon.vue'

describe('ClearDayIcon', () => {
  it('renders an svg element', () => {
    const wrapper = mount(ClearDayIcon)
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
