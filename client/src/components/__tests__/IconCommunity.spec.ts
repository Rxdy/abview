import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import IconCommunity from '../icons/IconCommunity.vue'

describe('IconCommunity', () => {
  it('renders an svg element', () => {
    const wrapper = mount(IconCommunity)
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
