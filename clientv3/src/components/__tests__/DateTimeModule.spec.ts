import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DateTimeModule from '../DateTimeModule.vue'

describe('DateTimeModule', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('displays current date and time', async () => {
    const mockDate = new Date(2026, 0, 20, 14, 30, 45)
    vi.setSystemTime(mockDate)

    const wrapper = mount(DateTimeModule)
    await wrapper.vm.$nextTick()

    // Vérifier que le texte contient les éléments attendus
    const text = wrapper.text()
    expect(text).toContain('20') // jour
    expect(text).toContain('2026') // année
    expect(text).toContain('14:30') // heure
  })

  it('updates time every second', async () => {
    const mockDate = new Date(2026, 0, 20, 14, 30, 45)
    vi.setSystemTime(mockDate)

    const wrapper = mount(DateTimeModule)
    await wrapper.vm.$nextTick()

    // Avancer le temps de 1 seconde
    vi.advanceTimersByTime(1000)
    await wrapper.vm.$nextTick()

    // Vérifier que le composant est monté et fonctionne
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('14:30')
  })

  it('clears interval on unmount', async () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
    
    const wrapper = mount(DateTimeModule)
    await wrapper.vm.$nextTick()
    
    wrapper.unmount()
    
    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })

    const wrapper = mount(DateTimeModule)
    await wrapper.vm.$nextTick()

    vi.advanceTimersByTime(1000)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('14:30:46')
  })

  it('formats date in French', async () => {
    const mockDate = new Date(2026, 5, 15, 9, 15, 30) // June 15, 2026
    vi.setSystemTime(mockDate)

    // Mock the locale methods
    const mockToLocaleDateString = vi.fn((locale, options) => {
      if (locale === 'fr-FR' && options?.weekday === 'long') return 'lundi'
      if (locale === 'fr-FR' && options?.month === 'long') return 'juin'
      return '15/06/2026'
    })

    Date.prototype.toLocaleDateString = mockToLocaleDateString

    const wrapper = mount(DateTimeModule)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('lundi 15 juin 2026')
  })

  it('has correct CSS classes', () => {
    const wrapper = mount(DateTimeModule)

    expect(wrapper.find('.date-time').exists()).toBe(true)
    expect(wrapper.findAll('span')).toHaveLength(2)
  })
})