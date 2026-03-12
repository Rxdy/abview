import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DropIcon from '../icons/DropIcon.vue'

describe('DropIcon', () => {
  it('renders an svg element', () => {
    const wrapper = mount(DropIcon)
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
