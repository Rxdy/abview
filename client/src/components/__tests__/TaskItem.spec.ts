import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskItem from '../TaskItem.vue'

describe('TaskItem', () => {
  it('renders task title', () => {
    const task = {
      id: '1',
      title: 'Test Task',
      status: 'needsAction',
      level: 0,
      taskListTitle: 'Test',
      listColor: 'red'
    }

    const wrapper = mount(TaskItem, {
      props: {
        task,
        isDark: false,
        hasChildren: false,
        isCompleted: false
      }
    })

    expect(wrapper.text()).toContain('Test Task')
  })

  it('shows checkbox when no children', () => {
    const task = {
      id: '1',
      title: 'Test Task',
      status: 'needsAction',
      level: 0,
      taskListTitle: 'Test',
      listColor: 'red'
    }

    const wrapper = mount(TaskItem, {
      props: {
        task,
        isDark: false,
        hasChildren: false,
        isCompleted: false
      }
    })

    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
  })

  it('does not show checkbox when has children', () => {
    const task = {
      id: '1',
      title: 'Test Task',
      status: 'needsAction',
      level: 0,
      taskListTitle: 'Test',
      listColor: 'red'
    }

    const wrapper = mount(TaskItem, {
      props: {
        task,
        isDark: false,
        hasChildren: true,
        isCompleted: false
      }
    })

    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false)
  })

  it('shows due date when not completed and has due', () => {
    const task = {
      id: '1',
      title: 'Test Task',
      status: 'needsAction',
      due: '2023-12-25',
      level: 0,
      taskListTitle: 'Test',
      listColor: 'red'
    }

    const wrapper = mount(TaskItem, {
      props: {
        task,
        isDark: false,
        hasChildren: false,
        isCompleted: false
      }
    })

    expect(wrapper.text()).toContain('25/12/2023')
  })

  it('shows notes when present', () => {
    const task = {
      id: '1',
      title: 'Test Task',
      status: 'needsAction',
      notes: 'Test notes',
      level: 0,
      taskListTitle: 'Test',
      listColor: 'red'
    }

    const wrapper = mount(TaskItem, {
      props: {
        task,
        isDark: false,
        hasChildren: false,
        isCompleted: false
      }
    })

    expect(wrapper.text()).toContain('Test notes')
  })

  it('applies completed class when task is completed', () => {
    const task = {
      id: '1',
      title: 'Test Task',
      status: 'completed',
      level: 0,
      taskListTitle: 'Test',
      listColor: 'red'
    }

    const wrapper = mount(TaskItem, {
      props: {
        task,
        isDark: false,
        hasChildren: false,
        isCompleted: true
      }
    })

    expect(wrapper.classes()).toContain('completed')
  })
})