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

    expect(wrapper.text()).toContain('Chargement...')
  })

  it('shows error when error', () => {
    mockCalendarStore.loading = false
    mockCalendarStore.error = 'Network error'

    const wrapper = mount(CalendarModule, {
      stubs: ['ErrorDisplay']
    })

    expect(wrapper.findComponent({ name: 'ErrorDisplay' }).exists()).toBe(true)
  })

  it('renders events with shift', () => {
    mockCalendarStore.loading = false
    mockCalendarStore.error = null

    const wrapper = mount(CalendarModule, {
      stubs: ['ErrorDisplay']
    })

    // Should render the event with shift
    expect(wrapper.text()).toContain('Luis')
    expect(wrapper.text()).toContain('Matin')
  })
})