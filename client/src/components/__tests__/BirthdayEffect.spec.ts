import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import BirthdayEffect from '../BirthdayEffect.vue'

// Note: BirthdayEffect uses Object.defineProperty on window without configurable: true
// This creates a non-configurable property that cannot be redefined, so we must mount it only once
let wrapperInstance: any = null

describe('BirthdayEffect', () => {
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should mount component successfully and expose global functions', async () => {
    // Mount only once for all assertions
    if (!wrapperInstance) {
      vi.useFakeTimers()
      wrapperInstance = mount(BirthdayEffect)
      await flushPromises()
    }
    
    expect(wrapperInstance.exists()).toBe(true)
    // Component should have exposed global functions
    expect(typeof (window as any).showBirthdayEffect).toBe('function')
    expect(typeof (window as any).stopBirthdayEffect).toBe('function')
    // Component VM should be initialized
    expect(wrapperInstance.vm).toBeDefined()
  })
})