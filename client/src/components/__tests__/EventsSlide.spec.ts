import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EventsSlide from '../annual-recap/EventsSlide.vue'

describe('EventsSlide', () => {
  const mockEventsByMonth = {
    0: [
      { id: '1', title: 'Event 1', startTime: '2025-01-15', location: 'Paris' },
      { id: '2', title: 'Event 2', startTime: '2025-01-20', location: '' }
    ],
    1: [
      { id: '3', title: 'Event 3', startTime: '2025-02-10', location: 'Lyon' }
    ],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
    8: [],
    9: [],
    10: [],
    11: []
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('renders events slide with total events count', () => {
    const wrapper = mount(EventsSlide, {
      props: {
        totalEvents: 50,
        eventsByMonth: mockEventsByMonth
      }
    })

    expect(wrapper.find('h3').text()).toContain('Événements de l\'année')
    expect(wrapper.find('.stat-number').text()).toBe('50')
  })

  it('displays month cards for all 12 months', () => {
    const wrapper = mount(EventsSlide, {
      props: {
        totalEvents: 50,
        eventsByMonth: mockEventsByMonth
      }
    })

    const monthCards = wrapper.findAll('.month-card')
    expect(monthCards).toHaveLength(12)
  })

  it('shows event count for each month', () => {
    const wrapper = mount(EventsSlide, {
      props: {
        totalEvents: 50,
        eventsByMonth: mockEventsByMonth
      }
    })

    const monthCards = wrapper.findAll('.month-card')
    // January should have 2 events
    expect(monthCards[0].find('.month-count').text()).toBe('2')
    // February should have 1 event
    expect(monthCards[1].find('.month-count').text()).toBe('1')
  })

  it('highlights selected month', async () => {
    const wrapper = mount(EventsSlide, {
      props: {
        totalEvents: 50,
        eventsByMonth: mockEventsByMonth
      }
    })

    const monthCards = wrapper.findAll('.month-card')
    await monthCards[0].trigger('click')
    await wrapper.vm.$nextTick()

    expect(monthCards[0].classes()).toContain('selected')
  })

  it('displays month names in French', () => {
    const wrapper = mount(EventsSlide, {
      props: {
        totalEvents: 50,
        eventsByMonth: mockEventsByMonth
      }
    })

    const monthNames = wrapper.findAll('.month-name')
    expect(monthNames[0].text()).toContain('Janvier')
    expect(monthNames[1].text()).toContain('Février')
  })

  it('handles month selection', async () => {
    const wrapper = mount(EventsSlide, {
      props: {
        totalEvents: 50,
        eventsByMonth: mockEventsByMonth
      }
    })

    const monthCards = wrapper.findAll('.month-card')
    expect(monthCards.length).toBeGreaterThan(0)
    await monthCards[0].trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.exists()).toBe(true)
  })

  it('displays correct event count text (singular/plural)', async () => {
    const wrapper = mount(EventsSlide, {
      props: {
        totalEvents: 50,
        eventsByMonth: mockEventsByMonth
      }
    })

    const monthCards = wrapper.findAll('.month-card')
    await monthCards[0].trigger('click') // January with 2 events
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.events-count').text()).toContain('2 événements')
  })

  it('shows events list when month is selected', async () => {
    const wrapper = mount(EventsSlide, {
      props: {
        totalEvents: 50,
        eventsByMonth: mockEventsByMonth
      }
    })

    const monthCards = wrapper.findAll('.month-card')
    await monthCards[0].trigger('click') // January
    await wrapper.vm.$nextTick()

    vi.advanceTimersByTime(1000)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.events-list').exists()).toBe(true)
  })

  it('handles empty events data', () => {
    const emptyEventsByMonth = {
      0: [], 1: [], 2: [], 3: [], 4: [], 5: [],
      6: [], 7: [], 8: [], 9: [], 10: [], 11: []
    }

    const wrapper = mount(EventsSlide, {
      props: {
        totalEvents: 0,
        eventsByMonth: emptyEventsByMonth
      }
    })

    expect(wrapper.find('.stat-number').text()).toBe('0')
  })
})
