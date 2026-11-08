import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DashboardView from '../../views/DashboardView.vue'

// Mock the stores
const mockNotificationsStore: any = {
  currentNotification: null,
  isModalVisible: false,
  closeNotification: vi.fn()
}

vi.mock('../../stores/notificationsStore', () => ({
  useNotificationsStore: () => mockNotificationsStore
}))

describe('DashboardView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders all main components', () => {
    const wrapper = mount(DashboardView, {
      stubs: ['CalendarModule', 'WeatherModule', 'TasksModule', 'NotificationModal']
    })

    expect(wrapper.findComponent({ name: 'CalendarModule' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'WeatherModule' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'TasksModule' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'NotificationModal' }).exists()).toBe(true)
  })

  it('passes correct props to NotificationModal', () => {
    mockNotificationsStore.currentNotification = { event: { title: 'Test' }, type: '1h' }
    mockNotificationsStore.isModalVisible = true

    const wrapper = mount(DashboardView, {
      stubs: ['CalendarModule', 'WeatherModule', 'TasksModule']
    })

    const modal = wrapper.findComponent({ name: 'NotificationModal' })
    expect(modal.props('event')).toEqual({ title: 'Test' })
    expect(modal.props('type')).toBe('1h')
    expect(modal.props('isVisible')).toBe(true)
  })

  it('calls closeNotification on modal close', async () => {
    mockNotificationsStore.isModalVisible = true

    const wrapper = mount(DashboardView, {
      stubs: ['CalendarModule', 'WeatherModule', 'TasksModule']
    })

    const modal = wrapper.findComponent({ name: 'NotificationModal' })
    await modal.vm.$emit('close')

    expect(mockNotificationsStore.closeNotification).toHaveBeenCalled()
  })
})
describe('DashboardView : disposition pilotée par la configuration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  const montee = async (configuration?: any) => {
    const { useDashboardStore } = await import('../../stores/dashboardStore')
    const store = useDashboardStore()
    if (configuration) store.configuration = configuration
    return mount(DashboardView, {
      global: {
        stubs: { CalendarModule: true, WeatherModule: true, TasksModule: true, NotificationModal: true },
      },
    })
  }

  it('place chaque module sur ses cases (disposition standard)', async () => {
    const wrapper = await montee()
    const style = (m: string) => wrapper.find(`[data-module=${m}]`).attributes('style')

    expect(style('calendrier')).toContain('grid-column: 1 / span 12')
    expect(style('calendrier')).toContain('grid-row: 1 / span 5')
    expect(style('meteo')).toContain('grid-column: 1 / span 4')
    expect(style('meteo')).toContain('grid-row: 6 / span 3')
    expect(style('taches')).toContain('grid-column: 5 / span 8')
  })

  it('un module absent de la configuration n’est pas affiché', async () => {
    const wrapper = await montee({
      nom: 'Sans météo',
      placements: [
        { id: 'calendrier', module: 'calendrier', x: 1, y: 1 },
        { id: 'taches', module: 'taches', x: 5, y: 6 },
      ],
    })
    expect(wrapper.find('[data-module=meteo]').exists()).toBe(false)
    expect(wrapper.find('[data-module=calendrier]').exists()).toBe(true)
  })

  it('suit la taille de la variante et sa position', async () => {
    const wrapper = await montee({
      nom: 'Déplacée',
      placements: [{ id: 'm', module: 'meteo', x: 9, y: 1 }],
    })
    const style = wrapper.find('[data-module=meteo]').attributes('style')
    expect(style).toContain('grid-column: 9 / span 4')
    expect(style).toContain('grid-row: 1 / span 3')
  })

  it('la météo est sur une carte, l’agenda et les tâches dessinent leurs cartes', async () => {
    const wrapper = await montee()
    expect(wrapper.find('[data-module=meteo]').classes()).toContain('carte')
    expect(wrapper.find('[data-module=calendrier]').classes()).not.toContain('carte')
    expect(wrapper.find('[data-module=taches]').classes()).not.toContain('carte')
  })
})
