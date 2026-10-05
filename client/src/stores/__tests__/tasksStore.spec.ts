import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTasksStore } from '../tasksStore'
import { useProgressStore } from '../progressStore'
import { tasksService } from '../../services/tasksService'

vi.mock('../../services/tasksService', () => ({
  tasksService: {
    getTasks: vi.fn(),
    updateTask: vi.fn(),
  },
}))

const mockGetTasks = vi.mocked(tasksService.getTasks)
const mockUpdateTask = vi.mocked(tasksService.updateTask)

const fakeTasks = [
  { id: 't1', title: 'Appeler', status: 'needsAction', taskListTitle: 'Rudy', listColor: '#1e293b' },
]

describe('tasksStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockGetTasks.mockReset()
    mockUpdateTask.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with empty tasks', () => {
    const store = useTasksStore()
    expect(store.tasks).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('fetchTasks met à jour les tâches et lastRefresh', async () => {
    const lastRefresh = new Date('2026-07-08T10:00:00Z')
    mockGetTasks.mockResolvedValue({ tasks: fakeTasks, lastRefresh })

    const store = useTasksStore()
    await store.fetchTasks()

    expect(store.tasks).toEqual(fakeTasks)
    expect(store.lastRefresh).toEqual(lastRefresh)
    expect(store.loading).toBe(false)
  })

  it('fetchTasks reset la progression seulement quand les données changent', async () => {
    mockGetTasks.mockResolvedValue({ tasks: fakeTasks, lastRefresh: null })

    const store = useTasksStore()
    const progressStore = useProgressStore()
    const resetSpy = vi.spyOn(progressStore, 'resetProgress')

    await store.fetchTasks()
    await store.fetchTasks() // données identiques → pas de reset

    expect(resetSpy).toHaveBeenCalledTimes(1)
  })

  it('fetchTasks stocke le message en cas d’erreur', async () => {
    mockGetTasks.mockRejectedValue(new Error('boom'))

    const store = useTasksStore()
    await store.fetchTasks()

    expect(store.error).toBe('boom')
    expect(store.loading).toBe(false)
  })

  it('fetchTasks(isRefresh) ne passe pas loading à true', async () => {
    let loadingDuringFetch: boolean | null = null
    const store = useTasksStore()
    mockGetTasks.mockImplementation(async () => {
      loadingDuringFetch = store.loading
      return { tasks: fakeTasks, lastRefresh: null }
    })

    await store.fetchTasks(true)

    expect(loadingDuringFetch).toBe(false)
  })

  it('tasksData retourne un objet (placeholder)', () => {
    const store = useTasksStore()
    expect(store.tasksData).toEqual({})
  })

  it('updateTask appelle le service puis force un refresh', async () => {
    mockUpdateTask.mockResolvedValue({})
    mockGetTasks.mockResolvedValue({ tasks: fakeTasks, lastRefresh: null })

    const store = useTasksStore()
    await store.updateTask('t1', 'completed')

    expect(mockUpdateTask).toHaveBeenCalledWith('t1', 'completed')
    expect(mockGetTasks).toHaveBeenCalledTimes(1)
  })

  it('updateTask propage l’erreur du service', async () => {
    mockUpdateTask.mockRejectedValue(new Error('patch failed'))

    const store = useTasksStore()
    await expect(store.updateTask('t1', 'completed')).rejects.toThrow('patch failed')
    expect(mockGetTasks).not.toHaveBeenCalled()
  })

  it('startPolling relance fetchTasks chaque minute', async () => {
    vi.useFakeTimers()
    mockGetTasks.mockResolvedValue({ tasks: fakeTasks, lastRefresh: null })

    const store = useTasksStore()
    store.startPolling()

    await vi.advanceTimersByTimeAsync(60 * 1000)
    expect(mockGetTasks).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(60 * 1000)
    expect(mockGetTasks).toHaveBeenCalledTimes(2)
  })
})
