import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TasksModule from '../TasksModule.vue'

// Mock the tasks store
const mockTasksStore = {
  loading: false,
  error: null as string | null,
  tasks: [] as Array<{ id: number; taskListTitle: string; listColor: string; completed: boolean }>,
  startPolling: vi.fn(),
  fetchTasks: vi.fn()
}

vi.mock('../../stores/tasksStore', () => ({
  useTasksStore: () => mockTasksStore
}))

describe('TasksModule', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('shows loading state when loading', () => {
    mockTasksStore.loading = true

    const wrapper = mount(TasksModule, {
      stubs: ['TaskList']
    })

    expect(wrapper.text()).toContain('Chargement...')
    expect(wrapper.find('.loading-spinner').exists()).toBe(true)
  })

  it('shows error display when error', () => {
    mockTasksStore.loading = false
    mockTasksStore.error = 'Network error'

    const wrapper = mount(TasksModule, {
      stubs: ['TaskList']
    })

    expect(wrapper.findComponent({ name: 'ErrorDisplay' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ErrorDisplay' }).props('type')).toBe('network')
  })

  it('shows no data error when no tasks', () => {
    mockTasksStore.loading = false
    mockTasksStore.error = null
    mockTasksStore.tasks = []

    const wrapper = mount(TasksModule, {
      stubs: ['TaskList']
    })

    expect(wrapper.findComponent({ name: 'ErrorDisplay' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ErrorDisplay' }).props('type')).toBe('no-data')
  })

  it('renders task lists when tasks exist', () => {
    mockTasksStore.loading = false
    mockTasksStore.error = null
    mockTasksStore.tasks = [
      { id: 1, taskListTitle: 'List 1', listColor: 'red', completed: false },
      { id: 2, taskListTitle: 'List 1', listColor: 'red', completed: true },
      { id: 3, taskListTitle: 'List 2', listColor: 'blue', completed: false }
    ]

    const wrapper = mount(TasksModule, {
      stubs: ['TaskList']
    })

    const taskLists = wrapper.findAllComponents({ name: 'TaskList' })
    expect(taskLists).toHaveLength(2) // Two different list titles
  })
})