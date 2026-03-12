import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AlertTriangleIcon from '../icons/AlertTriangleIcon.vue'

describe('AlertTriangleIcon', () => {
  it('renders an svg element', () => {
    const wrapper = mount(AlertTriangleIcon)
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
