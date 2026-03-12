import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DatabaseIcon from '../icons/DatabaseIcon.vue'

describe('DatabaseIcon', () => {
  it('renders an svg element', () => {
    const wrapper = mount(DatabaseIcon)
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
