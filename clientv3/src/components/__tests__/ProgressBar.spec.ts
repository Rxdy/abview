import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ProgressBar from '../ProgressBar.vue'

// Mock the stores
const mockProgressStore = {
  progress: 50,
  timeRemaining: 120000, // 2 minutes
  startProgress: vi.fn(),
  stopProgress: vi.fn(),
  resetProgress: vi.fn()
}

const mockCalendarStore = {
  lastRefresh: new Date('2026-01-20T14:30:00')
}

const mockTasksStore = {
  lastRefresh: new Date('2026-01-20T14:35:00')
}

const mockWeatherStore = {
  lastRefresh: null
}

vi.mock('../../stores/progressStore', () => ({
  useProgressStore: () => mockProgressStore
}))

vi.mock('../../stores/calendarStore', () => ({
  useCalendarStore: () => mockCalendarStore
}))

vi.mock('../../stores/tasksStore', () => ({
  useTasksStore: () => mockTasksStore
}))

vi.mock('../../stores/weatherStore', () => ({
  useWeatherStore: () => mockWeatherStore
}))

describe('ProgressBar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // Reset mock values
    mockProgressStore.progress = 50
    mockProgressStore.timeRemaining = 120000
    mockCalendarStore.lastRefresh = new Date('2026-01-20T14:30:00')
    mockTasksStore.lastRefresh = new Date('2026-01-20T14:35:00')
    mockWeatherStore.lastRefresh = null
  })

  it('renders when progress is between 0 and 100', () => {
    const wrapper = mount(ProgressBar)

    expect(wrapper.find('.progress-container').exists()).toBe(true)
    expect(wrapper.find('.progress-bar').exists()).toBe(true)
  })

  it('does not render when progress is invalid', () => {
    mockProgressStore.progress = -1

    const wrapper = mount(ProgressBar)

    expect(wrapper.html()).toBe('<!--v-if-->')
  })

  it('displays time remaining correctly', () => {
    mockProgressStore.timeRemaining = 125000 // 2 minutes 5 seconds

    const wrapper = mount(ProgressBar)

    expect(wrapper.find('.progress-text').text()).toBe('2:05')
  })

  it('displays last refresh time from most recent store', () => {
    mockCalendarStore.lastRefresh = new Date('2026-01-20T14:30:00')
    mockTasksStore.lastRefresh = new Date('2026-01-20T14:35:00')
    mockWeatherStore.lastRefresh = new Date('2026-01-20T14:25:00')

    const wrapper = mount(ProgressBar)

    expect(wrapper.find('.last-update').text()).toContain('14:35:00')
  })

  it('shows sync when no refresh dates', () => {
    mockCalendarStore.lastRefresh = null
    mockTasksStore.lastRefresh = null
    mockWeatherStore.lastRefresh = null

    const wrapper = mount(ProgressBar)

    expect(wrapper.find('.last-update').text()).toContain('sync...')
  })

  it('applies correct scale to progress bar', () => {
    mockProgressStore.progress = 75

    const wrapper = mount(ProgressBar)

    const progressBar = wrapper.find('.progress-bar')
    expect(progressBar.attributes('style')).toContain('scaleX(0.75)')
  })
})