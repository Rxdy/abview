import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import IconTooling from '../icons/IconTooling.vue'

describe('IconTooling', () => {
  it('renders an svg element', () => {
    const wrapper = mount(IconTooling)
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
