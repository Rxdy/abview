import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import IconSupport from '../icons/IconSupport.vue'

describe('IconSupport', () => {
  it('renders an svg element', () => {
    const wrapper = mount(IconSupport)
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
