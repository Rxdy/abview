import { describe, it, expect } from 'vitest'
import { useAutoScroll } from '../useAutoScroll'

describe('useAutoScroll', () => {
  it('returns autoScroll object', () => {
    const autoScroll = useAutoScroll()
    expect(autoScroll).toBeDefined()
    expect(typeof autoScroll.start).toBe('function')
    expect(typeof autoScroll.stop).toBe('function')
  })
})
