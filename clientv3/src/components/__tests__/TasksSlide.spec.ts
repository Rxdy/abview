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

    expect(wrapper.find('h3').text()).toBe('📊 Productivité de l\'année')
    expect(wrapper.find('.global-stats-card').exists()).toBe(true)
  })

  it('displays global success rate', () => {
    const wrapper = mount(TasksSlide, {
      props: mockTasksData
    })

    const successRate = wrapper.find('.success-rate')
    expect(successRate.exists()).toBe(true)
    expect(successRate.text()).toBe('92%') // (230/250) * 100
  })

  it('displays total tasks created and completed', () => {
    const wrapper = mount(TasksSlide, {
      props: mockTasksData
    })

    const successDescription = wrapper.find('.success-description')
    expect(successDescription.text()).toContain('230/250 tâches terminées')
  })

  it('displays main statistics cards', () => {
    const wrapper = mount(TasksSlide, {
      props: mockTasksData
    })

    const statCards = wrapper.findAll('.stat-card.primary')
    expect(statCards).toHaveLength(2)

    // Première carte : tâches créées
    expect(statCards[0].find('.stat-value').text()).toBe('250')
    expect(statCards[0].find('.stat-label').text()).toBe('Tâches créées')

    // Deuxième carte : tâches terminées
    expect(statCards[1].find('.stat-value').text()).toBe('230')
    expect(statCards[1].find('.stat-label').text()).toBe('Tâches terminées')
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