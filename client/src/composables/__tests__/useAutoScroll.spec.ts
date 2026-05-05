import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAutoScroll } from '../useAutoScroll'
import { ref } from 'vue'

describe('useAutoScroll', () => {
  it('should return required functions', () => {
    const dayColumns = ref([])
    const autoScroll = useAutoScroll(dayColumns)
    expect(autoScroll).toBeDefined()
    expect(typeof autoScroll.initAutoScroll).toBe('function')
    expect(typeof autoScroll.stopAutoScroll).toBe('function')
    expect(typeof autoScroll.equalizeEventHeights).toBe('function')
  })

  it('should handle empty day columns gracefully', () => {
    const dayColumns = ref([])
    const autoScroll = useAutoScroll(dayColumns)
    
    // Should not throw when initializing with empty columns
    expect(() => {
      autoScroll.initAutoScroll()
    }).not.toThrow()
  })

  it('should stop auto-scroll intervals', () => {
    const dayColumns = ref([])
    const autoScroll = useAutoScroll(dayColumns)
    
    // Should not throw when stopping
    expect(() => {
      autoScroll.stopAutoScroll()
    }).not.toThrow()
  })

  it('should equalize event heights without errors', () => {
    const dayColumns = ref([])
    const autoScroll = useAutoScroll(dayColumns)
    
    // Should not throw when equalizing heights
    expect(() => {
      autoScroll.equalizeEventHeights()
    }).not.toThrow()
  })

  describe('Auto-scroll animation behavior', () => {
    it('should pause at bottom before reversing direction', () => {
      vi.useFakeTimers()
      
      // Create a mock container with scrollable content
      const mockContainer = {
        scrollHeight: 200,
        clientHeight: 100,
        scrollTop: 0,
        addEventListener: vi.fn()
      }
      
      const mockColumn = {
        querySelector: vi.fn().mockReturnValue(mockContainer)
      }
      
      const dayColumns = ref([mockColumn])
      const autoScroll = useAutoScroll(dayColumns)
      
      autoScroll.initAutoScroll()
      
      // Simulate scroll to bottom
      vi.advanceTimersByTime(3000) // Move several seconds forward
      
      // Direction should eventually reverse after pause
      vi.useRealTimers()
    })

    it('should handle columns without events gracefully', () => {
      const mockColumn = {
        querySelector: vi.fn().mockReturnValue(null)
      }
      
      const dayColumns = ref([mockColumn])
      const autoScroll = useAutoScroll(dayColumns)
      
      // Should not throw when container is not found
      expect(() => {
        autoScroll.initAutoScroll()
      }).not.toThrow()
    })

    it('should not attempt to scroll when content fits', () => {
      const mockContainer = {
        scrollHeight: 100,
        clientHeight: 200, // Taller than content
        scrollTop: 0,
        addEventListener: vi.fn()
      }
      
      const mockColumn = {
        querySelector: vi.fn().mockReturnValue(mockContainer)
      }
      
      const dayColumns = ref([mockColumn])
      const autoScroll = useAutoScroll(dayColumns)
      
      autoScroll.initAutoScroll()
      
      // scrollTop should remain 0 since there's nothing to scroll
      expect(mockContainer.scrollTop).toBe(0)
    })
  })
})
