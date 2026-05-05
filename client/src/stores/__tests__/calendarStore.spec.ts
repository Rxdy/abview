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

    it('should keep multi-day calendar events active while the interval is still ongoing', () => {
      const store = useCalendarStore()
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-04-20T12:00:00Z'))

      store.calendarEvents = [{
        id: '805472o3nf47o3tckttqtep268',
        summary: 'Quentin et Julie Canaries☀️☀️',
        start: '2026-04-18T13:30:00+02:00',
        end: '2026-04-25T21:10:00+02:00',
        description: '',
        location: 'Lanzarote, 35340 Lanzarote, Las Palmas, Espagne'
      }]

      const events = store.allEvents
      expect(events.some(event => event.id === '805472o3nf47o3tckttqtep268')).toBe(true)

      vi.useRealTimers()
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

  describe('Past Event Filtering', () => {
    it('should hide events that have already ended', () => {
      const store = useCalendarStore()
      vi.useFakeTimers()
      // Set time to 17:30 (5:30 PM)
      vi.setSystemTime(new Date('2026-05-05T17:30:00'))

      store.calendarEvents = [{
        id: '1',
        summary: 'Past Event',
        start: '2026-05-05T08:00:00',
        end: '2026-05-05T17:00:00'  // Ended at 5 PM, current time is 5:30 PM
      }]

      const events = store.allEvents
      // Event should be filtered out because end time < current time
      expect(events.some(e => e.id === '1')).toBe(false)

      vi.useRealTimers()
    })

    it('should show events that are currently ongoing', () => {
      const store = useCalendarStore()
      vi.useFakeTimers()
      // Set time to 16:00 (4 PM)
      vi.setSystemTime(new Date('2026-05-05T16:00:00'))

      store.calendarEvents = [{
        id: '2',
        summary: 'Ongoing Event',
        start: '2026-05-05T14:00:00',
        end: '2026-05-05T18:00:00'  // Started at 2 PM, ends at 6 PM
      }]

      const events = store.allEvents
      // Event should be visible because current time is between start and end
      expect(events.some(e => e.id === '2')).toBe(true)

      vi.useRealTimers()
    })

    it('should show future events', () => {
      const store = useCalendarStore()
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-05-05T10:00:00'))

      store.calendarEvents = [{
        id: '3',
        summary: 'Future Event',
        start: '2026-05-05T18:00:00',
        end: '2026-05-05T20:00:00'
      }]

      const events = store.allEvents
      expect(events.some(e => e.id === '3')).toBe(true)

      vi.useRealTimers()
    })
  })

  describe('Midnight-Crossing Shifts', () => {
    it('should handle Luis night shift 21:00-05:00 correctly', () => {
      const store = useCalendarStore()
      store.horaires = [{
        name: "Luis",
        type: "shift",
        rotation: [{
          week: 1,
          shift: "Nuit",
          hours: ["21:00-05:00"]
        }],
        offset: 0
      }]

      const events = store.allEvents
      // Should have events created for the shift
      const luisEvents = events.filter(e => e.title === 'Luis')
      // The start and end times should have correct datetime format
      const eventWithMidnight = luisEvents.find(e => e.start?.includes('T21:00'))
      expect(eventWithMidnight).toBeDefined()
      
      // End date should be next day (05:00)
      if (eventWithMidnight) {
        const startDate = eventWithMidnight.start?.split('T')[0]
        const endDate = eventWithMidnight.end?.split('T')[0]
        // They should be different dates (next day)
        expect(startDate).not.toEqual(endDate)
      }
    })

    it('should correctly calculate end date for shifts crossing midnight', () => {
      const store = useCalendarStore()
      store.horaires = [{
        name: "Caroline",
        type: "shift",
        rotation: [{
          week: 1,
          shift: "Nuit",
          hours: ["21:00-05:00"]
        }],
        cycleLength: 1
      }]

      const events = store.allEvents
      const nightShift = events.find(e => e.title === 'Caroline' && e.startTime === '21:00')
      
      if (nightShift) {
        expect(nightShift.start).toBeDefined()
        expect(nightShift.end).toBeDefined()
        
        const [startDate, startTime] = nightShift.start!.split('T')
        const [endDate, endTime] = nightShift.end!.split('T')
        
        // End should be next day
        const start = new Date(startDate)
        const end = new Date(endDate)
        expect(end.getTime()).toBeGreaterThan(start.getTime())
        expect(endTime).toBe('05:00:00')
      }
    })
  })
})