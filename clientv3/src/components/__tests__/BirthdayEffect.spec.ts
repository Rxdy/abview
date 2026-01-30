import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import BirthdayEffect from '../BirthdayEffect.vue'

describe('BirthdayEffect', () => {
  let wrapper: VueWrapper
  let mockWindow: any

  beforeEach(() => {
    // Mock window for global functions
    mockWindow = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      showBirthdayEffect: undefined,
      stopBirthdayEffect: undefined,
      currentBirthdayPerson: '',
      currentBirthdayDate: ''
    }
    Object.defineProperty(window, 'addEventListener', { value: mockWindow.addEventListener })
    Object.defineProperty(window, 'removeEventListener', { value: mockWindow.removeEventListener })

    // Mock document
    Object.defineProperty(window, 'document', {
      value: {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }
    })

    wrapper = mount(BirthdayEffect)
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.restoreAllMocks()
  })

  describe('Activation and Deactivation', () => {
    it('should not be visible initially', () => {
      expect(wrapper.find('.birthday-overlay').exists()).toBe(false)
    })

    it('should show effect when birthday-detected event is fired', async () => {
      const event = new CustomEvent('birthday-detected', {
        detail: { person: 'John Doe' }
      })
      document.dispatchEvent(event)
      await wrapper.vm.$nextTick()
      // @ts-expect-error
      expect(wrapper.find('.birthday-overlay').exists()).toBe(true)
    })

    it('should hide effect when clicked', async () => {
      const event = new CustomEvent('birthday-detected', {
        detail: { person: 'John Doe' }
      })
      document.dispatchEvent(event)
      await wrapper.vm.$nextTick()
      // @ts-expect-error
      expect(wrapper.find('.birthday-overlay').exists()).toBe(true)

      await wrapper.find('.birthday-overlay').trigger('click')
      // @ts-expect-error
      expect(wrapper.find('.birthday-overlay').exists()).toBe(false)
    })

    it('should expose global functions', () => {
      expect(typeof (window as any).showBirthdayEffect).toBe('function')
      expect(typeof (window as any).stopBirthdayEffect).toBe('function')
    })
  })

  describe('Duration and Period', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should hide after 15 seconds in test mode', async () => {
      (window as any).showBirthdayEffect('John Doe', true)
      await wrapper.vm.$nextTick()
      // @ts-expect-error
      expect(wrapper.find('.birthday-overlay').exists()).toBe(true)

      vi.advanceTimersByTime(15000)
      await wrapper.vm.$nextTick()
      // @ts-expect-error
      expect(wrapper.find('.birthday-overlay').exists()).toBe(false)
    })

    it('should hide after 1 minute in real mode', async () => {
      (window as any).showBirthdayEffect('John Doe', false)
      await wrapper.vm.$nextTick()
      // @ts-expect-error
      expect(wrapper.find('.birthday-overlay').exists()).toBe(true)

      vi.advanceTimersByTime(60000)
      await wrapper.vm.$nextTick()
      // @ts-expect-error
      expect(wrapper.find('.birthday-overlay').exists()).toBe(false)
    })

    it('should repeat every 10 minutes in real mode on the same day', async () => {
      const mockDate = new Date('2024-01-01')
      // @ts-expect-error
      vi.setSystemTime(mockDate)

      (window as any).showBirthdayEffect('John Doe', false)
      await wrapper.vm.$nextTick()
      // @ts-expect-error
      expect(wrapper.find('.birthday-overlay').exists()).toBe(true)

      // After 1 minute, should hide
      vi.advanceTimersByTime(60000)
      await wrapper.vm.$nextTick()
      // @ts-expect-error
      expect(wrapper.find('.birthday-overlay').exists()).toBe(false)

      // After 10 minutes, should show again
      vi.advanceTimersByTime(600000)
      await wrapper.vm.$nextTick()
      // @ts-expect-error
      expect(wrapper.find('.birthday-overlay').exists()).toBe(true)
    })

    it('should stop repeating when day changes', async () => {
      const mockDate = new Date('2024-01-01')
      // @ts-expect-error
      vi.setSystemTime(mockDate)

      (window as any).showBirthdayEffect('John Doe', false)
      await wrapper.vm.$nextTick()

      // After 1 minute, hide
      vi.advanceTimersByTime(60000)
      await wrapper.vm.$nextTick()
      // @ts-expect-error
      expect(wrapper.find('.birthday-overlay').exists()).toBe(false)

      // Change day
      // @ts-expect-error
      vi.setSystemTime(new Date('2024-01-02'))

      // After 10 minutes, should not show again
      vi.advanceTimersByTime(600000)
      await wrapper.vm.$nextTick()
      // @ts-expect-error
      expect(wrapper.find('.birthday-overlay').exists()).toBe(false)
    })
  })

  describe('Triggers', () => {
    it('should handle event trigger', async () => {
      const event = new CustomEvent('birthday-detected', {
        detail: { person: 'John Doe' }
      })
      document.dispatchEvent(event)
      await wrapper.vm.$nextTick()
      // @ts-expect-error
      expect(wrapper.find('.birthday-overlay').exists()).toBe(true)
      expect((window as any).currentBirthdayPerson).toBe('John Doe')
    })

    it('should handle direct function call', async () => {
      (window as any).showBirthdayEffect('Jane Doe', false)
      await wrapper.vm.$nextTick()
      // @ts-expect-error
      expect(wrapper.find('.birthday-overlay').exists()).toBe(true)
      expect((window as any).currentBirthdayPerson).toBe('Jane Doe')
    })

    it('should handle test mode event', async () => {
      const event = new CustomEvent('birthday-detected', {
        detail: { person: 'Test Person', testMode: true }
      })
      document.dispatchEvent(event)
      await wrapper.vm.$nextTick()
      // @ts-expect-error
      expect(wrapper.find('.birthday-overlay').exists()).toBe(true)
    })

    it('should stop effect via global function', async () => {
      (window as any).showBirthdayEffect('John Doe', false)
      await wrapper.vm.$nextTick()
      // @ts-expect-error
      expect(wrapper.find('.birthday-overlay').exists()).toBe(true)

      (window as any).stopBirthdayEffect()
      // @ts-expect-error
      expect(wrapper.find('.birthday-overlay').exists()).toBe(false)
    })
  })
})