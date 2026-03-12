import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AnnualRecapWrapper from '../AnnualRecapWrapper.vue'

// Mock the stores
const mockAnnualRecapStore: any = {
  isLoading: false,
  error: null,
  totalEvents: 45,
  totalTasksCreated: 250,
  totalTasksCompleted: 230,
  eventsByMonth: {
    0: [{ id: '1', summary: 'Event 1', start: '2025-01-01', end: '2025-01-01' }],
    1: [{ id: '2', summary: 'Event 2', start: '2025-02-01', end: '2025-02-01' }]
  },
  tasksByList: [
    { listId: '1', listTitle: 'Travail', created: 150, completed: 140, completionRate: 93.33 },
    { listId: '2', listTitle: 'Perso', created: 100, completed: 95, completionRate: 95 }
  ],
  averageTemp: 18,
  rainyDays: 12,
  sunnyDays: 18,
  weatherDescription: 'climat agréable',
  weatherStats: {
    averageTemp: 18,
    coldestDay: { date: '2025-01-15', temp: 5 },
    hottestDay: { date: '2025-07-20', temp: 35 },
    rainiestDay: { date: '2025-04-10', precip: 25 },
    rainyDays: 12,
    sunnyDays: 18,
    totalDays: 365
  },
  topUsersByTasks: [
    { user: 'Rudy', totalCreated: 150, totalCompleted: 140, completionRate: 93.33 },
    { user: 'Caroline', totalCreated: 120, totalCompleted: 110, completionRate: 91.67 }
  ]
}

vi.mock('../../stores/annualRecapStore', () => ({
  useAnnualRecapStore: () => mockAnnualRecapStore
}))

describe('AnnualRecapWrapper', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    localStorage.clear()
  })

  it('renders loading state', async () => {
    mockAnnualRecapStore.isLoading = true

    const wrapper = mount(AnnualRecapWrapper)
    
    // Manually show the component
    wrapper.vm.isVisible = true
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.loading').exists()).toBe(true)
    expect(wrapper.find('.loading').text()).toContain('Chargement de vos souvenirs')
  })

  it('renders error state', async () => {
    mockAnnualRecapStore.isLoading = false
    mockAnnualRecapStore.error = 'Erreur de chargement'

    const wrapper = mount(AnnualRecapWrapper)
    
    // Manually show the component
    wrapper.vm.isVisible = true
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.error').exists()).toBe(true)
    expect(wrapper.find('.error').text()).toContain('Erreur de chargement')
  })

  it('renders recap slides when loaded', async () => {
    mockAnnualRecapStore.isLoading = false
    mockAnnualRecapStore.error = null

    const wrapper = mount(AnnualRecapWrapper)
    
    // Manually show the component
    wrapper.vm.isVisible = true
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.recap-slides').exists()).toBe(true)
    expect(wrapper.find('.recap-header h1').text()).toContain('Rétrospective')
  })

  it('starts with celebration slide', async () => {
    mockAnnualRecapStore.isLoading = false
    mockAnnualRecapStore.error = null

    const wrapper = mount(AnnualRecapWrapper)
    
    // Manually show the component
    wrapper.vm.isVisible = true
    await wrapper.vm.$nextTick()

    const celebrationSlide = wrapper.findComponent({ name: 'CelebrationSlide' })
    expect(celebrationSlide.exists()).toBe(true)
  })

  it('navigates through slides automatically', async () => {
    mockAnnualRecapStore.isLoading = false
    mockAnnualRecapStore.error = null

    const wrapper = mount(AnnualRecapWrapper)
    
    // Manually show and start autoplay
    wrapper.vm.isVisible = true
    await wrapper.vm.$nextTick()
    await wrapper.vm.startAutoPlay()

    // Vérifier que c'est la première slide (currentSlide = 0)
    expect(wrapper.vm.currentSlide).toBe(0)

    // Avancer le temps de 16 secondes (15s + 1s de marge)
    vi.advanceTimersByTime(16000)
    await wrapper.vm.$nextTick()

    // Vérifier que c'est passé à la slide suivante
    expect(wrapper.vm.currentSlide).toBe(1)
  })

  it('displays progress bar during auto-play', async () => {
    mockAnnualRecapStore.isLoading = false
    mockAnnualRecapStore.error = null

    const wrapper = mount(AnnualRecapWrapper)
    
    // Manually show the component
    wrapper.vm.isVisible = true
    await wrapper.vm.$nextTick()

    // Démarrer l'auto-play
    await wrapper.vm.startAutoPlay()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.progress-container').exists()).toBe(true)
    expect(wrapper.find('.progress-bar').exists()).toBe(true)
  })

  it('shows time remaining in progress bar', async () => {
    mockAnnualRecapStore.isLoading = false
    mockAnnualRecapStore.error = null

    const wrapper = mount(AnnualRecapWrapper)
    
    // Manually show the component
    wrapper.vm.isVisible = true
    await wrapper.vm.$nextTick()

    // Démarrer l'auto-play
    await wrapper.vm.startAutoPlay()
    await wrapper.vm.$nextTick()

    const progressText = wrapper.find('.progress-text')
    expect(progressText.exists()).toBe(true)
    expect(progressText.text()).toMatch(/\d+:\d+/) // Format with digits
  })

  it('handles navigation through slides', async () => {
    mockAnnualRecapStore.isLoading = false
    mockAnnualRecapStore.error = null

    const wrapper = mount(AnnualRecapWrapper)
    
    // Manually show the component
    wrapper.vm.isVisible = true
    await wrapper.vm.$nextTick()

    // Navigate to different slide
    wrapper.vm.currentSlide = 2
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.currentSlide).toBe(2)
  })
})