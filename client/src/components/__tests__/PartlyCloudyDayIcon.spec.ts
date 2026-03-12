import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PartlyCloudyDayIcon from '../icons/PartlyCloudyDayIcon.vue'

describe('PartlyCloudyDayIcon', () => {
  it('renders an svg element', () => {
    const wrapper = mount(PartlyCloudyDayIcon)
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
