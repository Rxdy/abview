import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import NotificationModal from '../NotificationModal.vue'

// Mock the language store
const mockLanguageStore = {
  t: vi.fn((key: string) => key) // Mock translation to return the key
}

vi.mock('../../stores/languageStore', () => ({
  useLanguageStore: () => mockLanguageStore
}))

describe('NotificationModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders correctly when visible with event', () => {
    const event = {
      title: 'Test Event',
      startTime: '10:00',
      endTime: '11:00',
      description: 'Test description',
      location: 'Test location'
    }

    const wrapper = mount(NotificationModal, {
      props: {
        event,
        type: '1h',
        isVisible: true
      }
    })

    expect(wrapper.text()).toContain('reminder')
    expect(wrapper.text()).toContain('Test Event')
    expect(wrapper.text()).toContain('eventReminder1h')
    expect(wrapper.text()).toContain('10:00 - 11:00')
    expect(wrapper.text()).toContain('Test description')
    expect(wrapper.text()).toContain('Test location')
    // Les clés 'reminder'/'eventReminder*' vivent sous la section 'notifications',
    // pas la section par défaut 'weather' de languageStore.t() — régression du
    // 2026-07-07 où l'appel sans section faisait retomber sur la clé brute à l'écran.
    expect(mockLanguageStore.t).toHaveBeenCalledWith('reminder', 'notifications')
    expect(mockLanguageStore.t).toHaveBeenCalledWith('eventReminder1h', 'notifications')
  })

  it('does not render when not visible', () => {
    const wrapper = mount(NotificationModal, {
      props: {
        event: null,
        type: '',
        isVisible: false
      }
    })

    expect(wrapper.html()).toBe('<!--v-if-->')
  })

  it('emits close event when countdown reaches 0', async () => {
    vi.useFakeTimers()

    const event = {
      title: 'Test Event',
      startTime: '10:00'
    }

    const wrapper = mount(NotificationModal, {
      props: {
        event,
        type: '1h',
        isVisible: true
      }
    })

    // Fast forward 20 seconds
    await vi.advanceTimersByTime(20000)

    expect(wrapper.emitted()).toHaveProperty('close')
  })

  it('shows countdown text', () => {
    const event = {
      title: 'Test Event',
      startTime: '10:00'
    }

    const wrapper = mount(NotificationModal, {
      props: {
        event,
        type: '1h',
        isVisible: true
      }
    })

    expect(wrapper.text()).toContain('20s')
  })
})
describe('NotificationModal — cycle de vie', () => {
  it('nettoie le compte à rebours au démontage', () => {
    vi.useFakeTimers()
    const wrapper = mount(NotificationModal, {
      props: {
        event: { title: 'Test Event', startTime: '10:00' },
        type: '30min',
        isVisible: true
      }
    })

    wrapper.unmount()
    // Plus de timer actif : avancer le temps ne doit plus émettre close
    vi.advanceTimersByTime(30000)
    expect(wrapper.emitted('close')).toBeFalsy()
    vi.useRealTimers()
  })
})
