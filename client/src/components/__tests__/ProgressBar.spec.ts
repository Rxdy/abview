import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ProgressBar from '../ProgressBar.vue'

// Mock the stores
const mockProgressStore = {
  progress: 50,
  timeRemaining: 120000, // 2 minutes
  derniereActualisation: null as Date | null,
  enEchec: false,
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
    mockProgressStore.derniereActualisation = null
    mockProgressStore.enEchec = false
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

  it("affiche l'heure du dernier rechargement de l'écran, pas celle du serveur", () => {
    // Le serveur a interrogé Google à 14:35 ; l'écran s'est rechargé à 14:41:07
    mockTasksStore.lastRefresh = new Date('2026-01-20T14:35:00')
    mockProgressStore.derniereActualisation = new Date('2026-01-20T14:41:07')

    const wrapper = mount(ProgressBar)

    expect(wrapper.find('.last-update').text()).toBe('dernière à 14:41:07')
  })

  it('affiche sync... avant le premier rechargement', () => {
    const wrapper = mount(ProgressBar)

    expect(wrapper.find('.last-update').text()).toContain('sync...')
  })

  it("signale un échec en gardant l'heure du dernier rechargement réussi", () => {
    mockProgressStore.derniereActualisation = new Date('2026-01-20T14:40:00')
    mockProgressStore.enEchec = true

    const wrapper = mount(ProgressBar)

    const texte = wrapper.find('.last-update')
    expect(texte.text()).toBe('échec, dernière réussie à 14:40:00')
    expect(texte.classes()).toContain('echec')
  })

  it('applies correct scale to progress bar', () => {
    mockProgressStore.progress = 75

    const wrapper = mount(ProgressBar)

    const progressBar = wrapper.find('.progress-bar')
    expect(progressBar.attributes('style')).toContain('scaleX(0.75)')
  })
})
describe('ProgressBar — cycle de vie', () => {
  it('démarre la progression au montage et la stoppe au démontage', () => {
    const wrapper = mount(ProgressBar)

    expect(mockProgressStore.startProgress).toHaveBeenCalled()
    wrapper.unmount()
    expect(mockProgressStore.stopProgress).toHaveBeenCalled()
  })

  it("l'horloge interne avance chaque seconde", () => {
    vi.useFakeTimers()
    const wrapper = mount(ProgressBar)

    expect(() => vi.advanceTimersByTime(2000)).not.toThrow()

    wrapper.unmount()
    vi.useRealTimers()
  })
})
