import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ThunderIcon from '../icons/ThunderIcon.vue'

describe('ThunderIcon', () => {
  it('renders an svg element', () => {
    const wrapper = mount(ThunderIcon)
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
