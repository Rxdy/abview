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

  it('shows progress bar only when there is overflow', async () => {
    mockTasksStore.loading = false
    mockTasksStore.error = null
    mockTasksStore.tasks = [
      { id: 1, taskListTitle: 'List 1', listColor: 'red', completed: false },
      { id: 2, taskListTitle: 'List 2', listColor: 'blue', completed: false },
      { id: 3, taskListTitle: 'List 3', listColor: 'green', completed: false },
      { id: 4, taskListTitle: 'List 4', listColor: 'yellow', completed: false },
      { id: 5, taskListTitle: 'List 5', listColor: 'purple', completed: false }
    ]

    const wrapper = mount(TasksModule, {
      stubs: ['TaskList'],
      attachTo: document.body // Attach to DOM to access scroll properties
    })

    // Mock the container to have overflow
    const container = wrapper.find('.tasks-container').element as HTMLElement
    Object.defineProperty(container, 'scrollWidth', { value: 1000, configurable: true })
    Object.defineProperty(container, 'clientWidth', { value: 500, configurable: true })

    // Wait for the setTimeout in onMounted
    await new Promise(resolve => setTimeout(resolve, 1100))

    // Progress bar should be visible after timer starts
    expect(wrapper.find('.progress-bar').exists()).toBe(true)

    // Now test without overflow
    Object.defineProperty(container, 'scrollWidth', { value: 400, configurable: true })
    Object.defineProperty(container, 'clientWidth', { value: 500, configurable: true })

    // Trigger watch by changing tasks
    mockTasksStore.tasks = [
      { id: 1, taskListTitle: 'List 1', listColor: 'red', completed: false }
    ]
    await wrapper.vm.$nextTick()

    // Wait for the restart timeout
    await new Promise(resolve => setTimeout(resolve, 600))

    // Progress bar should not be visible
    expect(wrapper.find('.progress-bar').exists()).toBe(false)
  })
})