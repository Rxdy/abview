import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCalendarStore } from '../calendarStore'

// Mock the calendar service
const mockCalendarService = {
  getHoraires: vi.fn(),
  getCalendarEvents: vi.fn(),
  getPastYearCalendarEvents: vi.fn(),
  getPastYearStats: vi.fn(),
  getPastYearWeatherStats: vi.fn(),
  getTasks: vi.fn(),
  getRecapData: vi.fn()
}

vi.mock('../../services/calendarService', () => ({
  calendarService: mockCalendarService
}))

describe('useCalendarStore', () => {
  let store: any

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useCalendarStore()
    vi.clearAllMocks()
  })

  describe('Shift Calculation', () => {
    it('should calculate correct shift for Caroline with week override', () => {
      // Mock horaires data for Caroline
      const mockHoraires = [
        {
          name: "Caroline",
          type: "shift",
          cycleLength: 9,
          rotation: [
            { week: 1, shift: "Soir", hours: ["13:00-21:00"] },
            { week: 2, shift: "Matin", hours: ["05:00-13:00"] },
            { week: 3, shift: "Soir", hours: ["13:00-21:00"] }
          ],
          weekOverrides: {
            "2026-5": { shift: "Nuit", hours: ["21:00-05:00"] }
          },
          offset: 6
        }
      ]

      store.horaires = mockHoraires

      // Get events for January 30, 2026 (week 5)
      const events = store.allEvents
      const carolineEvents = events.filter((e: any) => e.title === 'Caroline' && e.date === '2026-01-30')

      expect(carolineEvents.length).toBeGreaterThan(0)
      expect(carolineEvents[0].startTime).toBe('21:00')
      expect(carolineEvents[0].endTime).toBe('05:00')
    })

    it('should calculate correct shift for Luis without override', () => {
      // Mock horaires data for Luis
      const mockHoraires = [
        {
          name: "Luis",
          type: "shift",
          rotation: [
            { week: 1, shift: "Nuit", hours: ["21:00-05:00"] },
            { week: 2, shift: "Soir", hours: ["13:00-21:00"] },
            { week: 3, shift: "Matin", hours: ["05:00-13:00"] }
          ],
          offset: 1
        }
      ]

      store.horaires = mockHoraires

      // Get events for January 30, 2026 (week 5)
      const events = store.allEvents
      const luisEvents = events.filter((e: any) => e.title === 'Luis' && e.date === '2026-01-30')

      expect(luisEvents.length).toBeGreaterThan(0)
      expect(luisEvents[0].startTime).toBe('21:00')
      expect(luisEvents[0].endTime).toBe('05:00')
    })

    it('should handle day-specific exceptions for Caroline', () => {
      // Mock horaires data for Caroline with Friday exception
      const mockHoraires = [
        {
          name: "Caroline",
          type: "shift",
          cycleLength: 9,
          rotation: [
            { week: 7, shift: "Nuit", hours: ["21:00-05:00"], exceptions: { friday: ["19:00-02:00"], saturday: [], sunday: [] } }
          ],
          weekOverrides: {
            "2026-5": { shift: "Nuit", hours: ["21:00-05:00"], exceptions: { friday: ["19:00-02:00"], saturday: [], sunday: [] } }
          },
          offset: 6
        }
      ]

      store.horaires = mockHoraires

      // Get events for January 31, 2026 (Friday, week 5)
      const events = store.allEvents
      const carolineEvents = events.filter((e: any) => e.title === 'Caroline' && e.date === '2026-01-31')

      expect(carolineEvents.length).toBeGreaterThan(0)
      expect(carolineEvents[0].startTime).toBe('19:00')
      expect(carolineEvents[0].endTime).toBe('02:00')
    })
  })

  describe('Event Display', () => {
    it('should include work events for Luis and Caroline', () => {
      const mockHoraires = [
        {
          name: "Luis",
          type: "shift",
          rotation: [{ week: 1, shift: "Nuit", hours: ["21:00-05:00"] }],
          offset: 1
        },
        {
          name: "Caroline",
          type: "shift",
          cycleLength: 9,
          rotation: [{ week: 1, shift: "Soir", hours: ["13:00-21:00"] }],
          offset: 6
        }
      ]

      store.horaires = mockHoraires

      const events = store.allEvents
      const workEvents = events.filter((e: any) => e.type === 'work')

      expect(workEvents.some((e: any) => e.title === 'Luis')).toBe(true)
      expect(workEvents.some((e: any) => e.title === 'Caroline')).toBe(true)
    })
  })
})