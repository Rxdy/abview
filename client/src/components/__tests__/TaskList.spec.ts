import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TaskList from '../TaskList.vue'

// Mock the theme store
const mockThemeStore = {
  isDark: true
}

vi.mock('../../stores/themeStore', () => ({
  useThemeStore: () => mockThemeStore
}))

describe('TaskList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders list title', () => {
    const wrapper = mount(TaskList, {
      props: {
        listTitle: 'Test List',
        listColor: 'red',
        tasks: []
      },
      stubs: ['TaskItem']
    })

    expect(wrapper.text()).toContain('Test List')
  })

  it('renders pending tasks', () => {
    const tasks = [
      { id: '1', title: 'Task 1', status: 'needsAction', level: 0, taskListTitle: 'Test', listColor: 'red' }
    ]

    const wrapper = mount(TaskList, {
      props: {
        listTitle: 'Test List',
        listColor: 'red',
        tasks
      },
      stubs: ['TaskItem']
    })

    expect(wrapper.text()).toContain('À faire')
    expect(wrapper.findAllComponents({ name: 'TaskItem' })).toHaveLength(1) // Only pending
  })

  it('renders completed tasks', () => {
    const tasks = [
      { id: '1', title: 'Task 1', status: 'completed', level: 0, taskListTitle: 'Test', listColor: 'red' }
    ]

    const wrapper = mount(TaskList, {
      props: {
        listTitle: 'Test List',
        listColor: 'red',
        tasks
      },
      stubs: ['TaskItem']
    })

    expect(wrapper.text()).toContain('Terminées')
    expect(wrapper.findAllComponents({ name: 'TaskItem' })).toHaveLength(1)
  })

  it('applies light theme class when not dark', () => {
    mockThemeStore.isDark = false

    const wrapper = mount(TaskList, {
      props: {
        listTitle: 'Test List',
        listColor: 'red',
        tasks: []
      },
      stubs: ['TaskItem']
    })

    expect(wrapper.classes()).toContain('light-theme')
  })
})