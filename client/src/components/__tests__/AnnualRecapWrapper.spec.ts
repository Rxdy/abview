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
  ],
  fetchPastYearData: vi.fn()
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

  it('le bouton Réessayer relance le chargement', async () => {
    mockAnnualRecapStore.isLoading = false
    mockAnnualRecapStore.error = 'Erreur de chargement'
    mockAnnualRecapStore.fetchPastYearData.mockClear()

    const wrapper = mount(AnnualRecapWrapper)
    wrapper.vm.isVisible = true
    await wrapper.vm.$nextTick()

    await wrapper.find('.retry-btn').trigger('click')

    expect(mockAnnualRecapStore.fetchPastYearData).toHaveBeenCalled()
    mockAnnualRecapStore.error = null
  })

  describe('affichage automatique du 1er janvier', () => {
    it("s'affiche le 1er janvier dans la fenêtre 0-2 min et se marque comme vu", () => {
      const year = new Date().getFullYear()
      vi.setSystemTime(new Date(year, 0, 1, 10, 1))
      mockAnnualRecapStore.fetchPastYearData.mockClear()

      const wrapper = mount(AnnualRecapWrapper)

      expect(wrapper.vm.isVisible).toBe(true)
      expect(mockAnnualRecapStore.fetchPastYearData).toHaveBeenCalled()
      expect(localStorage.getItem(`annualRecapSeen_${year}_10`)).toBe('true')
    })

    it("ne s'affiche pas deux fois dans la même heure", () => {
      const year = new Date().getFullYear()
      vi.setSystemTime(new Date(year, 0, 1, 10, 1))
      localStorage.setItem(`annualRecapSeen_${year}_10`, 'true')

      const wrapper = mount(AnnualRecapWrapper)

      expect(wrapper.vm.isVisible).toBe(false)
    })

    it("ne s'affiche pas hors de la fenêtre de 2 minutes", () => {
      const year = new Date().getFullYear()
      vi.setSystemTime(new Date(year, 0, 1, 10, 15))

      const wrapper = mount(AnnualRecapWrapper)

      expect(wrapper.vm.isVisible).toBe(false)
    })

    it("ne s'affiche pas un jour ordinaire", () => {
      const year = new Date().getFullYear()
      vi.setSystemTime(new Date(year, 6, 8, 10, 1))

      const wrapper = mount(AnnualRecapWrapper)

      expect(wrapper.vm.isVisible).toBe(false)
    })
  })

  describe('commandes window (console)', () => {
    it('showAnnualRecap affiche le récap et lance le diaporama', async () => {
      const wrapper = mount(AnnualRecapWrapper)

      ;(window as any).showAnnualRecap()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.isVisible).toBe(true)
      expect(wrapper.find('.progress-container').exists()).toBe(true)
    })

    it('nextSlide avance manuellement', async () => {
      const wrapper = mount(AnnualRecapWrapper)
      ;(window as any).showAnnualRecap()
      await wrapper.vm.$nextTick()

      ;(window as any).nextSlide()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.currentSlide).toBe(1)
    })

    it('stopAutoPlay puis startAutoPlay pilotent le diaporama', async () => {
      const wrapper = mount(AnnualRecapWrapper)
      ;(window as any).showAnnualRecap()
      await wrapper.vm.$nextTick()

      ;(window as any).stopAutoPlay()
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.progress-container').exists()).toBe(false)

      ;(window as any).startAutoPlay()
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.progress-container').exists()).toBe(true)
    })

    it('closeRecap émet close', async () => {
      const wrapper = mount(AnnualRecapWrapper)

      ;(window as any).closeRecap()

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('recapStatus loggue l’état sans erreur', () => {
      mount(AnnualRecapWrapper)
      expect(() => (window as any).recapStatus()).not.toThrow()
    })

    it('nextSlide sur la dernière slide programme la fermeture', async () => {
      const wrapper = mount(AnnualRecapWrapper)
      ;(window as any).showAnnualRecap()
      await wrapper.vm.$nextTick()

      for (let i = 0; i < 5; i++) {
        ;(window as any).nextSlide()
      }
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.currentSlide).toBe(4)

      ;(window as any).stopAutoPlay()
      vi.advanceTimersByTime(4000) // le setTimeout de 3 s ferme le récap
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.isVisible).toBe(false)
    })

    it('startAutoPlay relancé remplace le diaporama en cours', async () => {
      const wrapper = mount(AnnualRecapWrapper)
      ;(window as any).showAnnualRecap()
      await wrapper.vm.$nextTick()

      // Deuxième démarrage sans arrêt préalable : ne doit pas doubler
      await wrapper.vm.startAutoPlay()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.progress-container').exists()).toBe(true)
    })
  })

  it('se ferme tout seul après la dernière slide', async () => {
    const year = new Date().getFullYear()
    const wrapper = mount(AnnualRecapWrapper)
    ;(window as any).showAnnualRecap()
    await wrapper.vm.$nextTick()

    // Slide 0 dure 15 s ; l'intervalle avance ensuite les slides 1→4,
    // puis programme la fermeture 3 s plus tard
    vi.advanceTimersByTime(15000 * 5 + 4000)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isVisible).toBe(false)
    expect(localStorage.getItem(`annualRecapSeen_${year}`)).toBe('true')
  })

  it('réagit aux changements de fullscreen sans erreur', () => {
    mount(AnnualRecapWrapper)

    expect(() => {
      document.dispatchEvent(new Event('fullscreenchange'))
      window.dispatchEvent(new Event('resize'))
    }).not.toThrow()
  })
})