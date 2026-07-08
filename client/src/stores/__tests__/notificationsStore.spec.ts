import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotificationsStore } from '../notificationsStore'
import { useCalendarStore } from '../calendarStore'

// Fabrique un événement calendrier démarrant dans `minutes` minutes
function eventIn(minutes: number, id = `evt-${minutes}`) {
  const start = new Date(Date.now() + minutes * 60 * 1000)
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  return {
    id,
    summary: `Événement ${id}`,
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

describe('notificationsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with empty notifications', () => {
    const store = useNotificationsStore()
    expect(store.notifications).toEqual([])
    expect(store.currentNotification).toBeNull()
    expect(store.isModalVisible).toBe(false)
  })

  it('programme un rappel 1h pour un événement dans 45 minutes', () => {
    const calendarStore = useCalendarStore()
    calendarStore.calendarEvents = [eventIn(45)]

    const store = useNotificationsStore()
    store.checkUpcomingEvents()

    expect(store.notifications).toHaveLength(1)
    expect(store.notifications[0].type).toBe('1h')
    expect(store.notifications[0].shown).toBe(false)
  })

  it('programme un rappel 30min pour un événement dans 20 minutes', () => {
    const calendarStore = useCalendarStore()
    calendarStore.calendarEvents = [eventIn(20)]

    const store = useNotificationsStore()
    store.checkUpcomingEvents()

    expect(store.notifications).toHaveLength(1)
    expect(store.notifications[0].type).toBe('30min')
  })

  it('ignore les événements au-delà d’une heure', () => {
    const calendarStore = useCalendarStore()
    calendarStore.calendarEvents = [eventIn(120)]

    const store = useNotificationsStore()
    store.checkUpcomingEvents()

    expect(store.notifications).toEqual([])
  })

  it('ne programme pas deux fois le même rappel', () => {
    const calendarStore = useCalendarStore()
    calendarStore.calendarEvents = [eventIn(45, 'evt-fixe')]

    const store = useNotificationsStore()
    store.checkUpcomingEvents()
    store.checkUpcomingEvents()

    expect(store.notifications).toHaveLength(1)
  })

  it('affiche la notification quand le rappel arrive à échéance', () => {
    const calendarStore = useCalendarStore()
    calendarStore.calendarEvents = [eventIn(20, 'evt-proche')]

    const store = useNotificationsStore()
    store.checkUpcomingEvents()

    expect(store.isModalVisible).toBe(false)
    // Le rappel 30min part à timeToEvent - 30min (donc dans le passé proche → immédiat)
    vi.runOnlyPendingTimers()

    expect(store.isModalVisible).toBe(true)
    expect(store.currentNotification?.type).toBe('30min')
    expect(store.currentNotification?.event.id).toBe('evt-proche')
  })

  it('gère les événements avec un champ date au lieu de start', () => {
    const calendarStore = useCalendarStore()
    const date = new Date(Date.now() + 20 * 60 * 1000).toISOString()
    calendarStore.calendarEvents = [{ id: 'evt-date', summary: 'Sans start', date }]

    const store = useNotificationsStore()
    store.checkUpcomingEvents()

    expect(store.notifications).toHaveLength(1)
    expect(store.notifications[0].type).toBe('30min')
  })

  it('ne programme pas deux fois le même rappel 30min', () => {
    const calendarStore = useCalendarStore()
    calendarStore.calendarEvents = [eventIn(20, 'evt-30')]

    const store = useNotificationsStore()
    store.checkUpcomingEvents()
    store.checkUpcomingEvents()

    expect(store.notifications).toHaveLength(1)
    expect(store.notifications[0].type).toBe('30min')
  })

  it('showNotification / closeNotification pilotent la modale', () => {
    const store = useNotificationsStore()
    const event = { id: 'evt-1', summary: 'Réunion' }

    store.showNotification(event, '1h')
    expect(store.isModalVisible).toBe(true)
    expect(store.currentNotification).toMatchObject({ event, type: '1h', shown: true })

    store.closeNotification()
    expect(store.isModalVisible).toBe(false)
    expect(store.currentNotification).toBeNull()
  })
})
