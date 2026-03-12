import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SnowIcon from '../icons/SnowIcon.vue'

describe('SnowIcon', () => {
  it('renders an svg element', () => {
    const wrapper = mount(SnowIcon)
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
