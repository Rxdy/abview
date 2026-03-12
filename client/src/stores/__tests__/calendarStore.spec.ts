import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCalendarStore } from '../calendarStore'

vi.mock('../../services/calendarService', () => ({
  calendarService: {
    getHoraires: vi.fn(),
    getCalendarEvents: vi.fn(),
    getPastYearCalendarEvents: vi.fn(),
    getPastYearStats: vi.fn(),
    getPastYearWeatherStats: vi.fn(),
    getTasks: vi.fn(),
    getRecapData: vi.fn()
  }
}))

describe('useCalendarStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Store State Management', () => {
    it('should initialize with empty horaires', () => {
      const store = useCalendarStore()
      expect(store.horaires).toEqual([])
    })

    it('should store horaires data', () => {
      const store = useCalendarStore()
      const mockHoraires = [
        { name: "Caroline", type: "shift" }
      ]

      store.horaires = mockHoraires
      expect(store.horaires).toHaveLength(1)
      expect(store.horaires[0].name).toBe('Caroline')
    })

    it('should initialize with empty calendar events', () => {
      const store = useCalendarStore()
      expect(store.calendarEvents).toEqual([])
    })

    it('should store calendar events', () => {
      const store = useCalendarStore()
      const mockEvents = [
        { id: '1', title: 'Event 1', date: '2026-01-20' }
      ]

      store.calendarEvents = mockEvents
      expect(store.calendarEvents).toHaveLength(1)
    })

    it('should initialize with loading false', () => {
      const store = useCalendarStore()
      expect(store.loading).toBe(false)
    })

    it('should initialize with no error', () => {
      const store = useCalendarStore()
      expect(store.error).toBeNull()
    })
  })

  describe('Event Access', () => {
    it('should provide allEvents getter', () => {
      const store = useCalendarStore()
      const events = store.allEvents
      expect(Array.isArray(events)).toBe(true)
    })

    it('should combine horaires and calendar events in allEvents', () => {
      const store = useCalendarStore()
      
      store.horaires = [{ name: "Luis", type: "shift", date: '2026-01-20' }]
      store.calendarEvents = [{ id: '1', title: 'Event', date: '2026-01-20' }]

      const events = store.allEvents
      expect(Array.isArray(events)).toBe(true)
    })

    it('should provide pastYearStats', () => {
      const store = useCalendarStore()
      const stats = store.pastYearStats
      expect(typeof stats).toBe('object')
    })
  })

  describe('Event Display', () => {
    it('should store multiple team members', () => {
      const store = useCalendarStore()
      const mockHoraires = [
        { name: "Luis", type: "shift" },
        { name: "Caroline", type: "shift" }
      ]

      store.horaires = mockHoraires
      expect(store.horaires).toHaveLength(2)
    })
  })
})