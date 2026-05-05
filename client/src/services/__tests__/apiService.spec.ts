import { describe, it, expect, beforeEach, vi } from 'vitest'
import { apiService } from '../apiService'

// Mock fetch globally
global.fetch = vi.fn()

describe('apiService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      })

      const result = await apiService.get('/test-endpoint')

      expect(result).toEqual(mockData)
      expect(global.fetch).toHaveBeenCalled()
      const callUrl = (global.fetch as any).mock.calls[0][0]
      expect(callUrl).toContain('/test-endpoint')
    })

    it('should throw error on HTTP error status', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      await expect(apiService.get('/not-found')).rejects.toThrow('HTTP error! status: 404')
    })

    it('should handle 500 server error', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      await expect(apiService.get('/error')).rejects.toThrow('HTTP error! status: 500')
    })

    it('should handle network error', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      await expect(apiService.get('/endpoint')).rejects.toThrow('Network error')
    })

    it('should construct correct URL with endpoint', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      })

      await apiService.get('/users/123')

      const callUrl = (global.fetch as any).mock.calls[0][0]
      expect(callUrl).toContain('/users/123')
    })
  })

  describe('POST requests', () => {
    it('should make successful POST request with data', async () => {
      const mockData = { id: 1, created: true }
      const payload = { name: 'New Item' }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      })

      const result = await apiService.post('/items', payload)

      expect(result).toEqual(mockData)
      expect(global.fetch).toHaveBeenCalled()
      const callArgs = (global.fetch as any).mock.calls[0]
      expect(callArgs[0]).toContain('/items')
      expect(callArgs[1].method).toBe('POST')
      expect(callArgs[1].headers['Content-Type']).toBe('application/json')
      expect(JSON.parse(callArgs[1].body)).toEqual(payload)
    })

    it('should throw error on POST failure', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400
      })

      await expect(apiService.post('/items', {})).rejects.toThrow('HTTP error! status: 400')
    })

    it('should handle POST with complex nested data', async () => {
      const complexData = {
        user: { id: 1, name: 'John' },
        items: [1, 2, 3],
        metadata: { created: '2026-05-05' }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      await apiService.post('/complex', complexData)

      const callArgs = (global.fetch as any).mock.calls[0]
      expect(JSON.parse(callArgs[1].body)).toEqual(complexData)
    })

    it('should handle 401 Unauthorized on POST', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401
      })

      await expect(apiService.post('/protected', {})).rejects.toThrow('HTTP error! status: 401')
    })
  })

  describe('PATCH requests', () => {
    it('should make successful PATCH request', async () => {
      const mockData = { id: 1, updated: true }
      const updateData = { status: 'active' }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      })

      const result = await apiService.patch('/items/1', updateData)

      expect(result).toEqual(mockData)
      expect(global.fetch).toHaveBeenCalled()
      const callArgs = (global.fetch as any).mock.calls[0]
      expect(callArgs[0]).toContain('/items/1')
      expect(callArgs[1].method).toBe('PATCH')
      expect(callArgs[1].headers['Content-Type']).toBe('application/json')
      expect(JSON.parse(callArgs[1].body)).toEqual(updateData)
    })

    it('should throw error on PATCH failure', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      await expect(apiService.patch('/items/999', {})).rejects.toThrow('HTTP error! status: 404')
    })

    it('should handle 403 Forbidden on PATCH', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403
      })

      await expect(apiService.patch('/items/1', {})).rejects.toThrow('HTTP error! status: 403')
    })
  })

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      const mockData = { deleted: true }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      })

      const result = await apiService.delete('/items/1')

      expect(result).toEqual(mockData)
      expect(global.fetch).toHaveBeenCalled()
      const callArgs = (global.fetch as any).mock.calls[0]
      expect(callArgs[0]).toContain('/items/1')
      expect(callArgs[1].method).toBe('DELETE')
    })

    it('should throw error on DELETE failure', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      await expect(apiService.delete('/items/999')).rejects.toThrow('HTTP error! status: 404')
    })

    it('should handle DELETE without response body on success', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      })

      const result = await apiService.delete('/items/1')
      expect(result).toEqual({})
    })
  })

  describe('Error handling', () => {
    it('should handle malformed JSON response', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        }
      })

      await expect(apiService.get('/bad-json')).rejects.toThrow('Invalid JSON')
    })

    it('should handle multiple error statuses', async () => {
      const errorStatuses = [400, 401, 403, 404, 500, 502, 503]

      for (const status of errorStatuses) {
        ;(global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status
        })

        await expect(apiService.get('/test')).rejects.toThrow(`HTTP error! status: ${status}`)
      }
    })
  })
})
