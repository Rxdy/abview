import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HelloWorld from '../HelloWorld.vue'

describe('HelloWorld', () => {
  it('renders greeting message from prop', () => {
    const wrapper = mount(HelloWorld, {
      props: {
        msg: 'Hello Vue Developer!'
      }
    })

    expect(wrapper.find('h1').text()).toBe('Hello Vue Developer!')
  })

  it('displays success message about Vite and Vue 3', () => {
    const wrapper = mount(HelloWorld, {
      props: {
        msg: 'Welcome'
      }
    })

    const text = wrapper.text()
    expect(text).toContain('successfully created a project')
    expect(text).toContain('Vite')
    expect(text).toContain('Vue 3')
  })

  it('has correct CSS classes', () => {
    const wrapper = mount(HelloWorld, {
      props: {
        msg: 'Test'
      }
    })

    expect(wrapper.find('.greetings').exists()).toBe(true)
    expect(wrapper.find('h1.green').exists()).toBe(true)
  })

  it('contains links to Vite and Vue documentation', () => {
    const wrapper = mount(HelloWorld, {
      props: {
        msg: 'Welcome'
      }
    })

    const links = wrapper.findAll('a')
    expect(links.length).toBe(2)

    const viteLink = links.find(link => link.text().includes('Vite'))
    const vueLink = links.find(link => link.text().includes('Vue 3'))

    expect(viteLink?.attributes('href')).toBe('https://vite.dev/')
    expect(vueLink?.attributes('href')).toBe('https://vuejs.org/')
  })

  it('has rel="noopener" on external links', () => {
    const wrapper = mount(HelloWorld, {
      props: {
        msg: 'Test'
      }
    })

    const links = wrapper.findAll('a[target="_blank"]')
    links.forEach(link => {
      expect(link.attributes('rel')).toBe('noopener')
    })
  })

  it('renders with different message props', () => {
    const messages = [
      'Welcome to Abview',
      'Hello World',
      'Bienvenue!'
    ]

    messages.forEach(msg => {
      const wrapper = mount(HelloWorld, {
        props: { msg }
      })

      expect(wrapper.find('h1').text()).toBe(msg)
    })
  })

  it('contains h1 and h3 headings', () => {
    const wrapper = mount(HelloWorld, {
      props: {
        msg: 'Test Message'
      }
    })

    expect(wrapper.find('h1').exists()).toBe(true)
    expect(wrapper.find('h3').exists()).toBe(true)
  })
})
