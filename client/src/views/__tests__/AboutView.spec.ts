import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AboutView from '../AboutView.vue'

describe('AboutView', () => {
  it('renders the about view', () => {
    const wrapper = mount(AboutView)
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text().toLowerCase()).toContain('about')
  })
})
