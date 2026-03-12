import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import UserStatsSlide from '../annual-recap/UserStatsSlide.vue'

describe('UserStatsSlide', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mockTopUsers = [
    {
      user: 'Rudy',
      totalCreated: 150,
      totalCompleted: 140,
      completionRate: 93.33,
      lists: [
        { listId: '1', listTitle: 'Travail', created: 100, completed: 95 },
        { listId: '2', listTitle: 'Perso', created: 50, completed: 45 }
      ]
    },
    {
      user: 'Caroline',
      totalCreated: 120,
      totalCompleted: 110,
      completionRate: 91.67,
      lists: [
        { listId: '3', listTitle: 'Courses', created: 80, completed: 75 },
        { listId: '4', listTitle: 'Maison', created: 40, completed: 35 }
      ]
    }
  ]

  it('renders user stats correctly', () => {
    const wrapper = mount(UserStatsSlide, {
      props: {
        topUsersByTasks: mockTopUsers
      }
    })

    expect(wrapper.find('h3').text()).toBe('Productivité par utilisateur')
    expect(wrapper.find('.user-stats-grid').exists()).toBe(true)
    expect(wrapper.findAll('.user-stat-card')).toHaveLength(2)
  })

  it('displays user information correctly', () => {
    const wrapper = mount(UserStatsSlide, {
      props: {
        topUsersByTasks: mockTopUsers
      }
    })

    const text = wrapper.text()
    expect(text).toContain('Rudy')
    expect(text).toContain('Caroline')
    expect(text).toContain('150') // total created
    expect(text).toContain('140') // total completed
  })

  it('shows user completion rates', () => {
    const wrapper = mount(UserStatsSlide, {
      props: {
        topUsersByTasks: mockTopUsers
      }
    })

    const text = wrapper.text()
    // Check completion rates are displayed
    expect(text).toContain('93')
    expect(text).toContain('91')
  })

  it('displays ranking message', () => {
    const wrapper = mount(UserStatsSlide, {
      props: {
        topUsersByTasks: mockTopUsers
      }
    })

    expect(wrapper.find('.top-list-message').text()).toContain('Voici le classement de votre équipe')
  })

  it('handles empty user list', () => {
    const wrapper = mount(UserStatsSlide, {
      props: {
        topUsersByTasks: []
      }
    })

    expect(wrapper.find('.user-stats-grid').exists()).toBe(true)
    expect(wrapper.findAll('.user-stat-card')).toHaveLength(0)
  })
})