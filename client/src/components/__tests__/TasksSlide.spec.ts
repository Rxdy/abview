import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TasksSlide from '../annual-recap/TasksSlide.vue'

describe('TasksSlide', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mockTasksData = {
    totalTasksCreated: 250,
    totalTasksCompleted: 230,
    tasksByList: [
      { listId: '1', listTitle: 'Travail', created: 150, completed: 140, completionRate: 93.33 },
      { listId: '2', listTitle: 'Perso', created: 100, completed: 95, completionRate: 95 },
      { listId: '3', listTitle: 'Courses', created: 50, completed: 45, completionRate: 90 }
    ]
  }

  it('renders tasks statistics correctly', () => {
    const wrapper = mount(TasksSlide, {
      props: mockTasksData
    })

    expect(wrapper.find('h3').text()).toContain('Productivité')
    expect(wrapper.find('.tasks-slide').exists()).toBe(true)
  })

  it('displays global success rate', () => {
    const wrapper = mount(TasksSlide, {
      props: mockTasksData
    })

    const text = wrapper.text()
    expect(text).toContain('92') // (230/250) * 100
  })

  it('displays total tasks created and completed', () => {
    const wrapper = mount(TasksSlide, {
      props: mockTasksData
    })

    expect(wrapper.text()).toContain('230')
    expect(wrapper.text()).toContain('250')
  })

  it('displays main statistics cards', () => {
    const wrapper = mount(TasksSlide, {
      props: mockTasksData
    })

    expect(wrapper.find('.tasks-slide').exists()).toBe(true)
    expect(wrapper.text()).toContain('250')
    expect(wrapper.text()).toContain('140')
  })

  it('displays summary statistics', () => {
    const wrapper = mount(TasksSlide, {
      props: mockTasksData
    })

    const summaryCards = wrapper.findAll('.summary-card')
    expect(summaryCards).toHaveLength(4)

    // Vérifier les valeurs approximatives
    expect(summaryCards[0].find('.summary-value').text()).toMatch(/\d+\.\d+/) // Moyenne par jour
    expect(summaryCards[1].find('.summary-value').text()).toMatch(/\d+\.\d+/) // Terminées par jour
    expect(summaryCards[2].find('.summary-value').text()).toBe('3') // Listes actives
  })

  it('displays best performing list', () => {
    const wrapper = mount(TasksSlide, {
      props: mockTasksData
    })

    const bestListCard = wrapper.findAll('.summary-card')[3]
    expect(bestListCard.find('.summary-label').text()).toBe('Meilleure liste')
    expect(bestListCard.find('.summary-value').text()).toBe('Perso') // 95% completion rate
  })

  it('handles empty tasks data', () => {
    const wrapper = mount(TasksSlide, {
      props: {
        totalTasksCreated: 0,
        totalTasksCompleted: 0,
        tasksByList: []
      }
    })

    expect(wrapper.find('.success-rate').text()).toBe('0%')
    expect(wrapper.find('.success-description').text()).toContain('0/0 tâches terminées')
  })
})