import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HomeView from '../HomeView.vue'

describe('HomeView', () => {
  it('renders the home view', () => {
    const wrapper = mount(HomeView)
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text().toLowerCase()).toContain('home')
  })
})
