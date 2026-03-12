import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import IconEcosystem from '../icons/IconEcosystem.vue'

describe('IconEcosystem', () => {
  it('renders an svg element', () => {
    const wrapper = mount(IconEcosystem)
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
