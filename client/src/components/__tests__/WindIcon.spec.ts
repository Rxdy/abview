import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WindIcon from '../icons/WindIcon.vue'

describe('WindIcon', () => {
  it('renders an svg element', () => {
    const wrapper = mount(WindIcon)
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
