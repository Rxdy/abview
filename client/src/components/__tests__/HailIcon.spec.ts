import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HailIcon from '../icons/HailIcon.vue'

describe('HailIcon', () => {
  it('renders an svg element', () => {
    const wrapper = mount(HailIcon)
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
