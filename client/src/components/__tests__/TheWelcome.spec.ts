import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TheWelcome from '../TheWelcome.vue'

describe('TheWelcome', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders welcome section', () => {
    const wrapper = mount(TheWelcome)
    expect(wrapper.exists()).toBe(true)
  })

  it('renders documentation section', () => {
    const wrapper = mount(TheWelcome)

    const text = wrapper.text()
    expect(text).toContain('Documentation')
    expect(text).toContain('Vue')
  })

  it('renders tooling section', () => {
    const wrapper = mount(TheWelcome)

    const text = wrapper.text()
    expect(text).toContain('Tooling')
    expect(text).toContain('Vite')
  })

  it('renders ecosystem section', () => {
    const wrapper = mount(TheWelcome)

    const text = wrapper.text()
    expect(text).toContain('Ecosystem')
    expect(text).toContain('Pinia')
  })

  it('renders community section', () => {
    const wrapper = mount(TheWelcome)

    const text = wrapper.text()
    expect(text).toContain('Community')
  })

  it('contains external links', () => {
    const wrapper = mount(TheWelcome)

    const links = wrapper.findAll('a')
    expect(links.length).toBeGreaterThan(0)
    
    // Check for target="_blank" links
    const externalLinks = links.filter(link => link.attributes('target') === '_blank')
    expect(externalLinks.length).toBeGreaterThan(0)
  })

  it('has rel="noopener" on external links', () => {
    const wrapper = mount(TheWelcome)

    const externalLinks = wrapper.findAll('a[target="_blank"]')
    externalLinks.forEach(link => {
      expect(link.attributes('rel')).toBe('noopener')
    })
  })

  it('includes all required sections', () => {
    const wrapper = mount(TheWelcome)

    const text = wrapper.text()
    expect(text.length).toBeGreaterThan(0)
    expect(text).toContain('Documentation')
  })

  it('has links to Vue resources', () => {
    const wrapper = mount(TheWelcome)

    const text = wrapper.text()
    expect(text).toContain('vuejs.org')
    expect(text).toContain('Vite')
    expect(text).toContain('VSCode')
  })

  it('includes README.md reference', () => {
    const wrapper = mount(TheWelcome)

    const text = wrapper.text()
    expect(text).toContain('README.md')
  })
})
