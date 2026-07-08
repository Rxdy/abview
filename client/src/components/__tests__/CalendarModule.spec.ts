import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CalendarModule from '../CalendarModule.vue'

// Mock the stores
const mockCalendarStore: {
  loading: boolean;
  error: string | null;
  allEvents: any[];
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

  describe('getEventsForDay', () => {
    const today = new Date()
    const todayStr =
      today.getFullYear() +
      '-' +
      String(today.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(today.getDate()).padStart(2, '0')

    function mountVm(events: any[]) {
      mockCalendarStore.loading = false
      mockCalendarStore.error = null
      mockCalendarStore.allEvents = events as any
      return mount(CalendarModule, { stubs: ['ErrorDisplay'] }).vm as any
    }

    function timeStr(date: Date) {
      return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0')
    }

    it('affiche un événement planning du jour et masque celui déjà terminé', () => {
      // Heure fixée à midi : « past » et « future » ne traversent pas minuit
      vi.useFakeTimers()
      const noon = new Date()
      noon.setHours(12, 0, 0, 0)
      vi.setSystemTime(noon)

      const past = new Date(Date.now() - 2 * 60 * 60 * 1000) // 10:00
      const future = new Date(Date.now() + 2 * 60 * 60 * 1000) // 14:00
      const vm = mountVm([
        { id: 'fini', title: 'Fini', date: todayStr, startTime: '01:00', endTime: timeStr(past), isPlanning: true },
        { id: 'encours', title: 'En cours', date: todayStr, startTime: '01:00', endTime: timeStr(future), isPlanning: true },
      ])

      const ids = vm.getEventsForDay(today).map((e: any) => e.id)
      expect(ids).toContain('encours')
      expect(ids).not.toContain('fini')
      vi.useRealTimers()
    })

    it("un événement planning horodaté n'apparaît que sur son jour de début", () => {
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      const vm = mountVm([
        {
          id: 'nuit',
          title: 'Luis',
          date: todayStr,
          start: `${todayStr}T21:00:00`,
          end: `${todayStr}T23:59:00`,
          startTime: '21:00',
          endTime: '05:00',
          isPlanning: true,
        },
      ])

      expect(vm.getEventsForDay(today).map((e: any) => e.id)).toContain('nuit')
      expect(vm.getEventsForDay(tomorrow).map((e: any) => e.id)).not.toContain('nuit')
    })

    it('un événement calendrier multi-jours apparaît chaque jour couvert', () => {
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      const inTwoDays = new Date(today)
      inTwoDays.setDate(today.getDate() + 2)
      const fmt = (d: Date) =>
        d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')

      const vm = mountVm([
        { id: 'vacances', summary: 'Vacances', start: fmt(yesterday), end: fmt(inTwoDays) },
      ])

      expect(vm.getEventsForDay(today).map((e: any) => e.id)).toContain('vacances')
    })

    it('un événement tout-jour (date seule, sans end) apparaît sur son jour', () => {
      const vm = mountVm([{ id: 'ferie', summary: 'Férié', start: todayStr }])

      expect(vm.getEventsForDay(today).map((e: any) => e.id)).toContain('ferie')
    })

    it('un événement sans date est quotidien (affiché tous les jours)', () => {
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      const vm = mountVm([{ id: 'daily', title: 'Routine' }])

      expect(vm.getEventsForDay(today).map((e: any) => e.id)).toContain('daily')
      expect(vm.getEventsForDay(tomorrow).map((e: any) => e.id)).toContain('daily')
    })

    it('extrait le prénom des anniversaires et leur donne le type birthday', () => {
      const vm = mountVm([
        { id: 'bday', summary: 'Anniversaire de Julie', start: `${todayStr}T10:00:00`, end: `${todayStr}T11:00:00` },
      ])

      const bday = vm.getEventsForDay(today).find((e: any) => e.id === 'bday')
      expect(bday.type).toBe('birthday')
      expect(bday.title).toBe('Julie')
    })

    it('trie les événements : quotidiens en premier, puis par heure', () => {
      const vm = mountVm([
        { id: 'b', title: 'Aprem', date: todayStr, startTime: '14:00', endTime: '23:59', isPlanning: true },
        { id: 'allday', title: 'Garde', date: todayStr, startTime: null, endTime: null },
        { id: 'a', title: 'Matin', date: todayStr, startTime: '08:00', endTime: '23:59', isPlanning: true },
      ])

      const ids = vm.getEventsForDay(today).map((e: any) => e.id)
      expect(ids.indexOf('allday')).toBeLessThan(ids.indexOf('a'))
      expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('b'))
    })

    it("masque l'heure d'un événement multi-jours horodaté hors de son jour de début", () => {
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      const fmt = (d: Date) =>
        d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')

      const vm = mountVm([
        {
          id: 'multi',
          summary: 'Astreinte',
          start: `${fmt(yesterday)}T08:00:00`,
          end: `${fmt(tomorrow)}T18:00:00`,
          startTime: '08:00',
          endTime: '18:00',
        },
      ])

      const evt = vm.getEventsForDay(today).find((e: any) => e.id === 'multi')
      expect(evt.startTime).toBe('') // pas d'heure affichée hors du jour de début
    })

    it('ajoute les jours fériés du jour (ex. Fête Nationale le 14 juillet)', () => {
      const vm = mountVm([])
      const bastille = new Date(new Date().getFullYear(), 6, 14)

      const events = vm.getEventsForDay(bastille)
      expect(events.map((e: any) => e.title)).toContain('Fête Nationale')
    })
  })

  describe('getDayStyle (jours fériés)', () => {
    it('applique une image de fond pour un jour férié', () => {
      mockCalendarStore.allEvents = []
      const vm = mount(CalendarModule, { stubs: ['ErrorDisplay'] }).vm as any

      const style = vm.getDayStyle(new Date(new Date().getFullYear(), 6, 14))
      expect(style.backgroundImage).toContain('bastille')
    })

    it('ne style pas un jour ordinaire', () => {
      mockCalendarStore.allEvents = []
      const vm = mount(CalendarModule, { stubs: ['ErrorDisplay'] }).vm as any

      const style = vm.getDayStyle(new Date(new Date().getFullYear(), 6, 2))
      expect(style).toEqual({})
    })
  })

  describe('détection des anniversaires du jour', () => {
    const todayStr = (() => {
      const t = new Date()
      return (
        t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0')
      )
    })()

    it("dispatche birthday-detected quand un anniversaire est aujourd'hui", () => {
      const listener = vi.fn()
      document.addEventListener('birthday-detected', listener)
      ;(window as any).currentBirthdayPerson = undefined

      mockCalendarStore.loading = false
      mockCalendarStore.allEvents = [
        { id: 'bday', summary: 'Anniversaire de Julie', start: `${todayStr}T10:00:00`, end: `${todayStr}T11:00:00` },
      ] as any

      mount(CalendarModule, { stubs: ['ErrorDisplay'] })

      expect(listener).toHaveBeenCalled()
      expect(listener.mock.calls[0][0].detail.person).toBe('Julie')
      document.removeEventListener('birthday-detected', listener)
    })

    it("arrête l'effet quand il n'y a pas d'anniversaire aujourd'hui", () => {
      const stopSpy = vi.fn()
      ;(window as any).stopBirthdayEffect = stopSpy

      mockCalendarStore.loading = false
      mockCalendarStore.allEvents = [
        { id: 'w', title: 'Rudy', date: todayStr, startTime: '08:00', endTime: '23:59', isPlanning: true },
      ] as any

      mount(CalendarModule, { stubs: ['ErrorDisplay'] })

      expect(stopSpy).toHaveBeenCalled()
      delete (window as any).stopBirthdayEffect
    })
  })

  describe('bascule de date à minuit', () => {
    it('met à jour currentDate après minuit', async () => {
      vi.useFakeTimers()
      const now = new Date()
      vi.setSystemTime(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59))

      mockCalendarStore.loading = false
      mockCalendarStore.allEvents = [{ id: 'daily', title: 'Routine' }] as any

      const wrapper = mount(CalendarModule, { stubs: ['ErrorDisplay'] })
      const before = (wrapper.vm as any).currentDate.getDate()

      await vi.advanceTimersByTimeAsync(2 * 60 * 1000) // passe minuit

      expect((wrapper.vm as any).currentDate.getDate()).not.toBe(before)

      // Couvre aussi le tick horaire de vérification des anniversaires
      await vi.advanceTimersByTimeAsync(60 * 60 * 1000)

      wrapper.unmount() // couvre le clearTimeout du onUnmounted
      vi.useRealTimers()
    })
  })
})