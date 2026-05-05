import { describe, it, expect, beforeEach, vi } from 'vitest'
import { tasksService } from '../tasksService'
import * as calendarServiceModule from '../calendarService'

// Mock apiService
vi.mock('../apiService', () => ({
  apiService: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    delete: vi.fn()
  }
}))

import { apiService } from '../apiService'

describe('tasksService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTasks', () => {
    it('should flatten task lists into individual tasks with metadata', async () => {
      const mockData = {
        lists: [
          {
            title: 'Work',
            color: '#FF0000',
            tasks: [
              { id: 1, name: 'Task 1', status: 'pending' },
              { id: 2, name: 'Task 2', status: 'done' }
            ]
          },
          {
            title: 'Personal',
            color: '#00FF00',
            tasks: [
              { id: 3, name: 'Task 3', status: 'pending' }
            ]
          }
        ],
        lastRefresh: '2026-05-05T10:00:00Z'
      }

      ;(apiService.get as any).mockResolvedValueOnce(mockData)

      const result = await tasksService.getTasks()

      expect(result.tasks).toHaveLength(3)
      expect(result.tasks[0]).toEqual({
        id: 1,
        name: 'Task 1',
        status: 'pending',
        taskListTitle: 'Work',
        listColor: '#FF0000'
      })
      expect(result.tasks[1]).toEqual({
        id: 2,
        name: 'Task 2',
        status: 'done',
        taskListTitle: 'Work',
        listColor: '#FF0000'
      })
      expect(result.tasks[2]).toEqual({
        id: 3,
        name: 'Task 3',
        status: 'pending',
        taskListTitle: 'Personal',
        listColor: '#00FF00'
      })
    })

    it('should parse lastRefresh as Date object', async () => {
      const mockData = {
        lists: [],
        lastRefresh: '2026-05-05T15:30:45.123Z'
      }

      ;(apiService.get as any).mockResolvedValueOnce(mockData)

      const result = await tasksService.getTasks()

      expect(result.lastRefresh).toBeInstanceOf(Date)
      expect(result.lastRefresh?.toISOString()).toContain('2026-05-05')
    })

    it('should set lastRefresh to null when not provided', async () => {
      const mockData = {
        lists: [],
        lastRefresh: null
      }

      ;(apiService.get as any).mockResolvedValueOnce(mockData)

      const result = await tasksService.getTasks()

      expect(result.lastRefresh).toBeNull()
    })

    it('should handle empty task lists', async () => {
      const mockData = {
        lists: [],
        lastRefresh: '2026-05-05T10:00:00Z'
      }

      ;(apiService.get as any).mockResolvedValueOnce(mockData)

      const result = await tasksService.getTasks()

      expect(result.tasks).toEqual([])
      expect(result.tasks).toHaveLength(0)
    })

    it('should handle lists with no tasks', async () => {
      const mockData = {
        lists: [
          { title: 'Empty List', color: '#CCCCCC', tasks: [] },
          { title: 'Another Empty', color: '#DDDDDD', tasks: [] }
        ],
        lastRefresh: null
      }

      ;(apiService.get as any).mockResolvedValueOnce(mockData)

      const result = await tasksService.getTasks()

      expect(result.tasks).toEqual([])
    })

    it('should preserve all task properties during flattening', async () => {
      const mockData = {
        lists: [
          {
            title: 'Complex Tasks',
            color: '#123456',
            tasks: [
              {
                id: 'task-1',
                name: 'Build feature',
                status: 'in-progress',
                priority: 'high',
                dueDate: '2026-05-10',
                assignee: 'John',
                description: 'A detailed task'
              }
            ]
          }
        ],
        lastRefresh: null
      }

      ;(apiService.get as any).mockResolvedValueOnce(mockData)

      const result = await tasksService.getTasks()

      const task = result.tasks[0]
      expect(task).toMatchObject({
        id: 'task-1',
        name: 'Build feature',
        status: 'in-progress',
        priority: 'high',
        dueDate: '2026-05-10',
        assignee: 'John',
        description: 'A detailed task',
        taskListTitle: 'Complex Tasks',
        listColor: '#123456'
      })
    })

    it('should propagate API errors', async () => {
      ;(apiService.get as any).mockRejectedValueOnce(new Error('API Error'))

      await expect(tasksService.getTasks()).rejects.toThrow('API Error')
    })

    it('should call correct API endpoint', async () => {
      ;(apiService.get as any).mockResolvedValueOnce({ lists: [], lastRefresh: null })

      await tasksService.getTasks()

      expect(apiService.get).toHaveBeenCalledWith('/tasks')
    })

    it('should handle large number of tasks', async () => {
      const largeMockData = {
        lists: [
          {
            title: 'Many Tasks',
            color: '#FF0000',
            tasks: Array.from({ length: 100 }, (_, i) => ({
              id: i,
              name: `Task ${i}`,
              status: i % 2 === 0 ? 'done' : 'pending'
            }))
          }
        ],
        lastRefresh: null
      }

      ;(apiService.get as any).mockResolvedValueOnce(largeMockData)

      const result = await tasksService.getTasks()

      expect(result.tasks).toHaveLength(100)
      expect(result.tasks.every((t: any) => t.taskListTitle === 'Many Tasks')).toBe(true)
    })
  })

  describe('updateTask', () => {
    it('should update task status', async () => {
      const mockResponse = { id: 'task-1', status: 'done' }

      ;(apiService.patch as any).mockResolvedValueOnce(mockResponse)

      const result = await tasksService.updateTask('task-1', 'done')

      expect(result).toEqual(mockResponse)
      expect(apiService.patch).toHaveBeenCalledWith('/tasks/task-1', { status: 'done' })
    })

    it('should handle update with different status values', async () => {
      const statuses = ['pending', 'in-progress', 'done', 'archived']

      for (const status of statuses) {
        ;(apiService.patch as any).mockResolvedValueOnce({ status })

        await tasksService.updateTask('task-1', status)

        expect(apiService.patch).toHaveBeenCalledWith('/tasks/task-1', { status })
      }
    })

    it('should propagate update errors', async () => {
      ;(apiService.patch as any).mockRejectedValueOnce(new Error('Update failed'))

      await expect(tasksService.updateTask('task-1', 'done')).rejects.toThrow('Update failed')
    })

    it('should handle 404 on non-existent task', async () => {
      ;(apiService.patch as any).mockRejectedValueOnce(new Error('HTTP error! status: 404'))

      await expect(tasksService.updateTask('non-existent', 'done')).rejects.toThrow(
        'HTTP error! status: 404'
      )
    })
  })
})
