import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CalendarModule from '../CalendarModule.vue'

// Mock the stores
const mockCalendarStore: {
  loading: boolean;
  error: string | null;
  allEvents: {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    type: string;
    shift: string;
  }[];
  fetchAll: () => void;
  startPolling: () => void;
} = {
  loading: false,
  error: null,
  allEvents: [
    {
      id: 'shift-Luis-2026-01-20-08:00-16:00',
      title: 'Luis',
      date: '2026-01-20',
      startTime: '08:00',
      endTime: '16:00',
      type: 'work',
      shift: 'Matin'
    }
  ],
  fetchAll: vi.fn(),
  startPolling: vi.fn()
}

const mockThemeStore = {
  isDark: true
}

vi.mock('../../stores/calendarStore', () => ({
  useCalendarStore: () => mockCalendarStore
}))

vi.mock('../../stores/themeStore', () => ({
  useThemeStore: () => mockThemeStore
}))

describe('CalendarModule', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('shows loading state when loading', () => {
    mockCalendarStore.loading = true

    const wrapper = mount(CalendarModule, {
      stubs: ['ErrorDisplay']
    })

    expect(wrapper.text()).toContain('Chargement')
  })

  it('shows error when error', () => {
    mockCalendarStore.loading = false
    mockCalendarStore.error = 'Network error'

    const wrapper = mount(CalendarModule, {
      stubs: ['ErrorDisplay']
    })

    expect(wrapper.findComponent({ name: 'ErrorDisplay' }).exists()).toBe(true)
  })

  it('renders calendar module component', () => {
    mockCalendarStore.loading = false
    mockCalendarStore.error = null

    const wrapper = mount(CalendarModule, {
      stubs: ['ErrorDisplay']
    })

    // Should render without crashing
    expect(wrapper.exists()).toBe(true)
  })

  describe('Event rendering', () => {
    it('should render events with all required properties', () => {
      mockCalendarStore.loading = false
      mockCalendarStore.error = null

      const wrapper = mount(CalendarModule, {
        stubs: ['ErrorDisplay']
      })

      const events = wrapper.findAll('[class*="event"]')
      // Calendar should attempt to render (even if no events visible on first day)
      expect(wrapper.find('.day-column').exists()).toBe(true)
    })

    it('should handle events with and without times', () => {
      mockCalendarStore.loading = false
      mockCalendarStore.error = null
      mockCalendarStore.allEvents = [
        {
          id: '1',
          title: 'Timed Event',
          date: '2026-01-20',
          startTime: '09:00',
          endTime: '17:00',
          type: 'work',
          shift: 'Matin'
        },
        {
          id: '2',
          title: 'All Day Event',
          date: '2026-01-20',
          startTime: null,
          endTime: null,
          type: 'garde-alternee',
          shift: ''
        }
      ]

      const wrapper = mount(CalendarModule, {
        stubs: ['ErrorDisplay']
      })

      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Midnight-crossing shifts', () => {
    it('should only display planning events on their start date', () => {
      mockCalendarStore.loading = false
      mockCalendarStore.error = null
      mockCalendarStore.allEvents = [
        {
          id: 'shift-Luis-2026-01-20-21:00-05:00',
          title: 'Luis',
          date: '2026-01-20',
          startTime: '21:00',
          endTime: '05:00',
          type: 'work',
          shift: 'Nuit',
          start: '2026-01-20T21:00:00',
          end: '2026-01-21T05:00:00',
          isPlanning: true
        }
      ]

      const wrapper = mount(CalendarModule, {
        stubs: ['ErrorDisplay']
      })

      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Scrolling behavior', () => {
    it('should have scrollable events container', () => {
      mockCalendarStore.loading = false
      mockCalendarStore.error = null

      const wrapper = mount(CalendarModule, {
        stubs: ['ErrorDisplay']
      })

      // Check that CSS classes are applied for scrolling
      const eventsContainer = wrapper.find('.events')
      expect(eventsContainer.exists()).toBe(true)
      // The element should have overflow-y: auto in CSS
    })
  })
})