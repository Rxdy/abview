import { describe, it, expect, beforeEach, vi } from 'vitest'
import { calendarService } from '../calendarService'

vi.mock('../apiService', () => ({
  apiService: {
    get: vi.fn()
  }
}))

import { apiService } from '../apiService'

describe('calendarService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getHoraires', () => {
    it('should fetch horaires successfully', async () => {
      const mockData = {
        horaires: [
          { name: 'Luis', type: 'shift' },
          { name: 'Caroline', type: 'shift' }
        ],
        lastRefresh: '2026-05-05T10:00:00Z'
      }

      ;(apiService.get as any).mockResolvedValueOnce(mockData)

      const result = await calendarService.getHoraires()

      expect(result.horaires).toHaveLength(2)
      expect(result.lastRefresh).toBeInstanceOf(Date)
      expect(apiService.get).toHaveBeenCalledWith('/horaires')
    })

    it('should return empty array when horaires is missing', async () => {
      ;(apiService.get as any).mockResolvedValueOnce({
        lastRefresh: '2026-05-05T10:00:00Z'
      })

      const result = await calendarService.getHoraires()

      expect(result.horaires).toEqual([])
    })

    it('should handle null lastRefresh', async () => {
      ;(apiService.get as any).mockResolvedValueOnce({
        horaires: [],
        lastRefresh: null
      })

      const result = await calendarService.getHoraires()

      expect(result.lastRefresh).toBeNull()
    })
  })

  describe('getCalendarEvents', () => {
    it('should fetch calendar events successfully', async () => {
      const mockData = {
        events: [
          { id: '1', title: 'Event 1', date: '2026-05-05' },
          { id: '2', title: 'Event 2', date: '2026-05-06' }
        ],
        lastRefresh: '2026-05-05T11:00:00Z'
      }

      ;(apiService.get as any).mockResolvedValueOnce(mockData)

      const result = await calendarService.getCalendarEvents()

      expect(result.events).toHaveLength(2)
      expect(result.lastRefresh).toBeInstanceOf(Date)
      expect(apiService.get).toHaveBeenCalledWith('/calendar')
    })

    it('should return empty array when events is missing', async () => {
      ;(apiService.get as any).mockResolvedValueOnce({
        lastRefresh: '2026-05-05T11:00:00Z'
      })

      const result = await calendarService.getCalendarEvents()

      expect(result.events).toEqual([])
    })

    it('should handle null events', async () => {
      ;(apiService.get as any).mockResolvedValueOnce({
        events: null,
        lastRefresh: null
      })

      const result = await calendarService.getCalendarEvents()

      expect(result.events).toEqual([])
    })
  })

  describe('getPastYearCalendarEvents', () => {
    it('should fetch past year calendar events', async () => {
      const mockData = {
        events: [
          { id: '1', title: 'Past Event 1' },
          { id: '2', title: 'Past Event 2' }
        ]
      }

      ;(apiService.get as any).mockResolvedValueOnce(mockData)

      const result = await calendarService.getPastYearCalendarEvents()

      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('Past Event 1')
      expect(apiService.get).toHaveBeenCalledWith('/calendar/past-year')
    })

    it('should return empty array when events missing', async () => {
      ;(apiService.get as any).mockResolvedValueOnce({})

      const result = await calendarService.getPastYearCalendarEvents()

      expect(result).toEqual([])
    })

    it('should handle null events', async () => {
      ;(apiService.get as any).mockResolvedValueOnce({ events: null })

      const result = await calendarService.getPastYearCalendarEvents()

      expect(result).toEqual([])
    })
  })

  describe('getPastYearStats', () => {
    it('should fetch past year stats', async () => {
      const mockStats = {
        totalEvents: 150,
        averageEventDuration: 2.5,
        mostActiveDay: 'Monday'
      }

      ;(apiService.get as any).mockResolvedValueOnce({ stats: mockStats })

      const result = await calendarService.getPastYearStats()

      expect(result).toEqual(mockStats)
      expect(apiService.get).toHaveBeenCalledWith('/stats/past-year')
    })

    it('should return null when stats missing', async () => {
      ;(apiService.get as any).mockResolvedValueOnce({})

      const result = await calendarService.getPastYearStats()

      expect(result).toBeNull()
    })

    it('should handle null stats', async () => {
      ;(apiService.get as any).mockResolvedValueOnce({ stats: null })

      const result = await calendarService.getPastYearStats()

      expect(result).toBeNull()
    })
  })

  describe('getPastYearWeatherStats', () => {
    it('should fetch past year weather stats', async () => {
      const mockStats = {
        avgTemp: 15.5,
        maxTemp: 35,
        minTemp: -5,
        rainDays: 120
      }

      ;(apiService.get as any).mockResolvedValueOnce({ stats: mockStats })

      const result = await calendarService.getPastYearWeatherStats()

      expect(result).toEqual(mockStats)
      expect(apiService.get).toHaveBeenCalledWith('/stats/weather/past-year')
    })

    it('should return null when weather stats missing', async () => {
      ;(apiService.get as any).mockResolvedValueOnce({})

      const result = await calendarService.getPastYearWeatherStats()

      expect(result).toBeNull()
    })

    it('should handle complex weather stats', async () => {
      const complexStats = {
        monthly: [
          { month: 'January', avg: 5, max: 15, min: -5 },
          { month: 'February', avg: 7, max: 18, min: -2 }
        ],
        extreme: { highest: 35, lowest: -8 }
      }

      ;(apiService.get as any).mockResolvedValueOnce({ stats: complexStats })

      const result = await calendarService.getPastYearWeatherStats()

      expect(result).toEqual(complexStats)
      expect(result?.monthly).toHaveLength(2)
    })
  })

  describe('getTasks', () => {
    it('should fetch task lists', async () => {
      const mockData = {
        lists: [
          { title: 'Work', tasks: ['Task 1', 'Task 2'] },
          { title: 'Personal', tasks: ['Task 3'] }
        ]
      }

      ;(apiService.get as any).mockResolvedValueOnce(mockData)

      const result = await calendarService.getTasks()

      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('Work')
      expect(apiService.get).toHaveBeenCalledWith('/tasks')
    })

    it('should return empty array when lists missing', async () => {
      ;(apiService.get as any).mockResolvedValueOnce({})

      const result = await calendarService.getTasks()

      expect(result).toEqual([])
    })

    it('should handle null lists', async () => {
      ;(apiService.get as any).mockResolvedValueOnce({ lists: null })

      const result = await calendarService.getTasks()

      expect(result).toEqual([])
    })
  })

  describe('getRecapData', () => {
    it('should fetch recap data', async () => {
      const mockData = {
        year: 2025,
        totalTasks: 250,
        completedTasks: 200,
        events: 45,
        weather: { avgTemp: 15 }
      }

      ;(apiService.get as any).mockResolvedValueOnce(mockData)

      const result = await calendarService.getRecapData()

      expect(result).toEqual(mockData)
      expect(result.year).toBe(2025)
      expect(apiService.get).toHaveBeenCalledWith('/recap')
    })

    it('should return empty object when recap data missing', async () => {
      ;(apiService.get as any).mockResolvedValueOnce(null)

      const result = await calendarService.getRecapData()

      expect(result).toEqual({})
    })

    it('should handle complex recap structure', async () => {
      const complexRecap = {
        year: 2025,
        summary: {
          tasks: { total: 250, completed: 200, rate: 0.8 },
          events: { total: 45, attended: 40 },
          weather: { avgTemp: 15, rainDays: 120 }
        },
        monthlyBreakdown: Array(12).fill(null).map((_, i) => ({
          month: i + 1,
          tasks: Math.floor(Math.random() * 30),
          events: Math.floor(Math.random() * 5)
        }))
      }

      ;(apiService.get as any).mockResolvedValueOnce(complexRecap)

      const result = await calendarService.getRecapData()

      expect(result.monthlyBreakdown).toHaveLength(12)
      expect(result.summary.tasks.rate).toBe(0.8)
    })
  })

  describe('Error handling', () => {
    it('should propagate API errors from all endpoints', async () => {
      const error = new Error('API Error')

      ;(apiService.get as any).mockRejectedValueOnce(error)
      await expect(calendarService.getHoraires()).rejects.toThrow('API Error')

      ;(apiService.get as any).mockRejectedValueOnce(error)
      await expect(calendarService.getCalendarEvents()).rejects.toThrow('API Error')

      ;(apiService.get as any).mockRejectedValueOnce(error)
      await expect(calendarService.getPastYearCalendarEvents()).rejects.toThrow('API Error')

      ;(apiService.get as any).mockRejectedValueOnce(error)
      await expect(calendarService.getPastYearStats()).rejects.toThrow('API Error')
    })

    it('should handle HTTP errors', async () => {
      ;(apiService.get as any).mockRejectedValueOnce(new Error('HTTP error! status: 500'))

      await expect(calendarService.getHoraires()).rejects.toThrow('HTTP error! status: 500')
    })
  })
})
