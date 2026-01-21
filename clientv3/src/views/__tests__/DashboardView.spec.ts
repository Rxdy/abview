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