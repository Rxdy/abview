import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CloudyIcon from '../icons/CloudyIcon.vue'

describe('CloudyIcon', () => {
  it('renders an svg element', () => {
    const wrapper = mount(CloudyIcon)
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
