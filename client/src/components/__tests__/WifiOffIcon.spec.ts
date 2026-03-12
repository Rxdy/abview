import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WifiOffIcon from '../icons/WifiOffIcon.vue'

describe('WifiOffIcon', () => {
  it('renders an svg element', () => {
    const wrapper = mount(WifiOffIcon)
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
