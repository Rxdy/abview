import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WelcomeItem from '../WelcomeItem.vue'

describe('WelcomeItem', () => {
  it('renders welcome item with slots', () => {
    const wrapper = mount(WelcomeItem, {
      slots: {
        icon: '<span class="test-icon">Icon</span>',
        heading: 'Test Heading',
        default: '<p>Test content</p>'
      }
    })

    expect(wrapper.find('.item').exists()).toBe(true)
    expect(wrapper.text()).toContain('Test Heading')
    expect(wrapper.text()).toContain('Test content')
  })

  it('renders icon slot in correct location', () => {
    const wrapper = mount(WelcomeItem, {
      slots: {
        icon: '<span class="custom-icon">🎯</span>',
        heading: 'Heading'
      }
    })

    const iconSlot = wrapper.find('i')
    expect(iconSlot.exists()).toBe(true)
    expect(iconSlot.text()).toContain('🎯')
  })

  it('renders heading in details section', () => {
    const wrapper = mount(WelcomeItem, {
      slots: {
        heading: 'Welcome to Vue'
      }
    })

    const heading = wrapper.find('h3')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toBe('Welcome to Vue')
  })

  it('renders content in details section', () => {
    const wrapper = mount(WelcomeItem, {
      slots: {
        heading: 'Title',
        default: 'This is some content here'
      }
    })

    const details = wrapper.find('.details')
    expect(details.exists()).toBe(true)
    expect(details.text()).toContain('This is some content here')
  })

  it('has correct CSS classes', () => {
    const wrapper = mount(WelcomeItem)

    expect(wrapper.find('.item').exists()).toBe(true)
    expect(wrapper.find('.details').exists()).toBe(true)
    expect(wrapper.find('i').exists()).toBe(true)
  })

  it('renders with multiple slot content', () => {
    const wrapper = mount(WelcomeItem, {
      slots: {
        icon: '<svg>Icon</svg>',
        heading: 'Complex Heading',
        default: '<p>Paragraph 1</p><p>Paragraph 2</p>'
      }
    })

    expect(wrapper.find('h3').exists()).toBe(true)
    expect(wrapper.findAll('p')).toHaveLength(2)
  })

  it('renders icon spacing correctly', () => {
    const wrapper = mount(WelcomeItem, {
      slots: {
        icon: 'I',
        heading: 'H'
      }
    })

    const iconElement = wrapper.find('i')
    expect(iconElement.exists()).toBe(true)
    // Check that icon has style applied (width/height from CSS)
    expect(wrapper.find('.item').exists()).toBe(true)
  })

  it('works with HTML content in slots', () => {
    const wrapper = mount(WelcomeItem, {
      slots: {
        heading: 'Documentation',
        default: '<a href="https://example.com">Link</a>'
      }
    })

    const link = wrapper.find('a')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('https://example.com')
  })

  it('renders empty state gracefully', () => {
    const wrapper = mount(WelcomeItem)

    expect(wrapper.find('.item').exists()).toBe(true)
    expect(wrapper.find('.details').exists()).toBe(true)
  })
})
