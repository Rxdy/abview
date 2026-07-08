import { describe, it, expect, vi } from 'vitest'
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
    it('descend, fait une pause en bas, remonte puis fait une pause en haut', async () => {
      vi.useFakeTimers()

      // Contenu défilable : 10 px d'amplitude (110 - 100)
      const mockContainer = {
        scrollHeight: 110,
        clientHeight: 100,
        scrollTop: 0,
        addEventListener: vi.fn(),
      }
      const mockColumn = {
        querySelector: vi.fn().mockReturnValue(mockContainer),
      }

      const dayColumns = ref([mockColumn])
      const autoScroll = useAutoScroll(dayColumns)

      autoScroll.initAutoScroll()
      await vi.advanceTimersByTimeAsync(0) // laisse le nextTick s'exécuter

      // Descente : 1 px / 50 ms → bas (10 px) atteint après 500 ms
      await vi.advanceTimersByTimeAsync(600)
      expect(mockContainer.scrollTop).toBe(10)

      // Pause en bas (1500 ms) puis remontée complète
      await vi.advanceTimersByTimeAsync(1500)
      await vi.advanceTimersByTimeAsync(600)
      expect(mockContainer.scrollTop).toBe(0)

      // Pause en haut puis redescente
      await vi.advanceTimersByTimeAsync(1500)
      await vi.advanceTimersByTimeAsync(100)
      expect(mockContainer.scrollTop).toBeGreaterThan(0)

      autoScroll.stopAutoScroll()
      vi.useRealTimers()
    })

    it('initAutoScroll relancé remplace les intervalles précédents', async () => {
      vi.useFakeTimers()
      const mockContainer = {
        scrollHeight: 110,
        clientHeight: 100,
        scrollTop: 0,
        addEventListener: vi.fn(),
      }
      const mockColumn = { querySelector: vi.fn().mockReturnValue(mockContainer) }
      const dayColumns = ref([mockColumn])
      const autoScroll = useAutoScroll(dayColumns)

      autoScroll.initAutoScroll()
      await vi.advanceTimersByTimeAsync(0)
      autoScroll.initAutoScroll()
      await vi.advanceTimersByTimeAsync(0)

      // Un seul intervalle actif : 100 ms → 2 px (pas 4)
      await vi.advanceTimersByTimeAsync(100)
      expect(mockContainer.scrollTop).toBe(2)

      autoScroll.stopAutoScroll()
      vi.useRealTimers()
    })

    it('ignore les colonnes nulles', async () => {
      vi.useFakeTimers()
      const dayColumns = ref([null])
      const autoScroll = useAutoScroll(dayColumns)

      autoScroll.initAutoScroll()
      await vi.advanceTimersByTimeAsync(0)

      autoScroll.stopAutoScroll()
      vi.useRealTimers()
    })

    it('equalizeEventHeights efface les hauteurs en ligne des containers .events', async () => {
      const container = document.createElement('div')
      container.className = 'events'
      container.style.height = '123px'
      document.body.appendChild(container)

      const autoScroll = useAutoScroll(ref([]))
      autoScroll.equalizeEventHeights()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(container.style.height).toBe('')
      container.remove()
    })

    it('inspecte header/footer/modules présents dans le DOM sans erreur', async () => {
      vi.useFakeTimers()
      document.body.innerHTML =
        '<header></header><footer></footer><div class="module"></div><div class="calendar-zone"></div>'

      const mockColumn = { querySelector: vi.fn().mockReturnValue(null) }
      const autoScroll = useAutoScroll(ref([mockColumn]))

      autoScroll.initAutoScroll()
      await vi.advanceTimersByTimeAsync(0)

      autoScroll.stopAutoScroll()
      document.body.innerHTML = ''
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
