import { describe, it, expect, beforeEach, vi } from 'vitest'
import { weatherService } from '../weatherService'

vi.mock('../apiService', () => ({
  apiService: {
    get: vi.fn()
  }
}))

import { apiService } from '../apiService'

describe('weatherService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getWeather', () => {
    it('should fetch weather data successfully', async () => {
      const mockData = {
        weather: {
          temp: 18,
          condition: 'cloudy',
          humidity: 65,
          windSpeed: 10
        },
        lastRefresh: '2026-05-05T12:00:00Z'
      }

      ;(apiService.get as any).mockResolvedValueOnce(mockData)

      const result = await weatherService.getWeather()

      expect(result).toEqual({
        weather: mockData.weather,
        lastRefresh: expect.any(Date)
      })
      expect(result.weather).toEqual(mockData.weather)
    })

    it('should parse lastRefresh as Date object', async () => {
      const mockData = {
        weather: { temp: 20 },
        lastRefresh: '2026-05-05T14:30:45.000Z'
      }

      ;(apiService.get as any).mockResolvedValueOnce(mockData)

      const result = await weatherService.getWeather()

      expect(result.lastRefresh).toBeInstanceOf(Date)
      expect(result.lastRefresh?.getUTCHours()).toBe(14)
    })

    it('should set lastRefresh to null when not provided', async () => {
      const mockData = {
        weather: { temp: 22 },
        lastRefresh: null
      }

      ;(apiService.get as any).mockResolvedValueOnce(mockData)

      const result = await weatherService.getWeather()

      expect(result.lastRefresh).toBeNull()
    })

    it('should handle missing lastRefresh field', async () => {
      const mockData = {
        weather: { temp: 19 }
      }

      ;(apiService.get as any).mockResolvedValueOnce(mockData)

      const result = await weatherService.getWeather()

      expect(result.lastRefresh).toBeNull()
    })

    it('should preserve weather data structure', async () => {
      const complexWeatherData = {
        weather: {
          current: {
            temp: 18,
            condition: 'partly cloudy',
            humidity: 60,
            windSpeed: 12,
            windDirection: 'NW'
          },
          forecast: [
            { day: 'tomorrow', high: 22, low: 15 },
            { day: 'day after', high: 20, low: 14 }
          ],
          alerts: ['High wind warning']
        },
        lastRefresh: '2026-05-05T13:00:00Z'
      }

      ;(apiService.get as any).mockResolvedValueOnce(complexWeatherData)

      const result = await weatherService.getWeather()

      expect(result.weather).toEqual(complexWeatherData.weather)
      expect(result.weather.current.temp).toBe(18)
      expect(result.weather.forecast).toHaveLength(2)
      expect(result.weather.alerts).toContain('High wind warning')
    })

    it('should call correct API endpoint', async () => {
      ;(apiService.get as any).mockResolvedValueOnce({
        weather: {},
        lastRefresh: null
      })

      await weatherService.getWeather()

      expect(apiService.get).toHaveBeenCalledWith('/weather')
    })

    it('should propagate API errors', async () => {
      ;(apiService.get as any).mockRejectedValueOnce(new Error('Network error'))

      await expect(weatherService.getWeather()).rejects.toThrow('Network error')
    })

    it('should handle HTTP error responses', async () => {
      ;(apiService.get as any).mockRejectedValueOnce(new Error('HTTP error! status: 503'))

      await expect(weatherService.getWeather()).rejects.toThrow('HTTP error! status: 503')
    })

    it('should handle empty weather object', async () => {
      const mockData = {
        weather: {},
        lastRefresh: null
      }

      ;(apiService.get as any).mockResolvedValueOnce(mockData)

      const result = await weatherService.getWeather()

      expect(result.weather).toEqual({})
    })

    it('should convert timestamp correctly to Date', async () => {
      const timestamp = '2026-05-05T23:59:59.999Z'
      const mockData = {
        weather: { temp: 15 },
        lastRefresh: timestamp
      }

      ;(apiService.get as any).mockResolvedValueOnce(mockData)

      const result = await weatherService.getWeather()

      if (result.lastRefresh) {
        expect(result.lastRefresh.toISOString()).toContain('2026-05-05')
        expect(result.lastRefresh.getUTCHours()).toBe(23)
        expect(result.lastRefresh.getUTCMinutes()).toBe(59)
      }
    })
  })
})
