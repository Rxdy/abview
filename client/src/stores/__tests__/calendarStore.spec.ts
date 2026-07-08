import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCalendarStore } from '../calendarStore'
import { calendarService } from '../../services/calendarService'

vi.mock('../../services/calendarService', () => ({
  calendarService: {
    getHoraires: vi.fn(),
    getCalendarEvents: vi.fn(),
    getPastYearCalendarEvents: vi.fn(),
    getPastYearStats: vi.fn(),
    getPastYearWeatherStats: vi.fn(),
    getTasks: vi.fn(),
    getRecapData: vi.fn()
  }
}))

describe('useCalendarStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Store State Management', () => {
    it('should initialize with empty horaires', () => {
      const store = useCalendarStore()
      expect(store.horaires).toEqual([])
    })

    it('should store horaires data', () => {
      const store = useCalendarStore()
      const mockHoraires = [
        { name: "Caroline", type: "shift" }
      ]

      store.horaires = mockHoraires
      expect(store.horaires).toHaveLength(1)
      expect(store.horaires[0].name).toBe('Caroline')
    })

    it('should initialize with empty calendar events', () => {
      const store = useCalendarStore()
      expect(store.calendarEvents).toEqual([])
    })

    it('should store calendar events', () => {
      const store = useCalendarStore()
      const mockEvents = [
        { id: '1', title: 'Event 1', date: '2026-01-20' }
      ]

      store.calendarEvents = mockEvents
      expect(store.calendarEvents).toHaveLength(1)
    })

    it('should initialize with loading false', () => {
      const store = useCalendarStore()
      expect(store.loading).toBe(false)
    })

    it('should initialize with no error', () => {
      const store = useCalendarStore()
      expect(store.error).toBeNull()
    })
  })

  describe('Event Access', () => {
    it('should provide allEvents getter', () => {
      const store = useCalendarStore()
      const events = store.allEvents
      expect(Array.isArray(events)).toBe(true)
    })

    it('should combine horaires and calendar events in allEvents', () => {
      const store = useCalendarStore()
      
      store.horaires = [{ name: "Luis", type: "shift", date: '2026-01-20' }]
      store.calendarEvents = [{ id: '1', title: 'Event', date: '2026-01-20' }]

      const events = store.allEvents
      expect(Array.isArray(events)).toBe(true)
    })

    it('should keep multi-day calendar events active while the interval is still ongoing', () => {
      const store = useCalendarStore()
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-04-20T12:00:00Z'))

      store.calendarEvents = [{
        id: '805472o3nf47o3tckttqtep268',
        summary: 'Quentin et Julie Canaries☀️☀️',
        start: '2026-04-18T13:30:00+02:00',
        end: '2026-04-25T21:10:00+02:00',
        description: '',
        location: 'Lanzarote, 35340 Lanzarote, Las Palmas, Espagne'
      }]

      const events = store.allEvents
      expect(events.some(event => event.id === '805472o3nf47o3tckttqtep268')).toBe(true)

      vi.useRealTimers()
    })

    it('should provide pastYearStats', () => {
      const store = useCalendarStore()
      const stats = store.pastYearStats
      expect(typeof stats).toBe('object')
    })
  })

  describe('Event Display', () => {
    it('should store multiple team members', () => {
      const store = useCalendarStore()
      const mockHoraires = [
        { name: "Luis", type: "shift" },
        { name: "Caroline", type: "shift" }
      ]

      store.horaires = mockHoraires
      expect(store.horaires).toHaveLength(2)
    })
  })

  describe('Past Event Filtering', () => {
    it('should hide events that have already ended', () => {
      const store = useCalendarStore()
      vi.useFakeTimers()
      // Set time to 17:30 (5:30 PM)
      vi.setSystemTime(new Date('2026-05-05T17:30:00'))

      store.calendarEvents = [{
        id: '1',
        summary: 'Past Event',
        start: '2026-05-05T08:00:00',
        end: '2026-05-05T17:00:00'  // Ended at 5 PM, current time is 5:30 PM
      }]

      const events = store.allEvents
      // Event should be filtered out because end time < current time
      expect(events.some(e => e.id === '1')).toBe(false)

      vi.useRealTimers()
    })

    it('should show events that are currently ongoing', () => {
      const store = useCalendarStore()
      vi.useFakeTimers()
      // Set time to 16:00 (4 PM)
      vi.setSystemTime(new Date('2026-05-05T16:00:00'))

      store.calendarEvents = [{
        id: '2',
        summary: 'Ongoing Event',
        start: '2026-05-05T14:00:00',
        end: '2026-05-05T18:00:00'  // Started at 2 PM, ends at 6 PM
      }]

      const events = store.allEvents
      // Event should be visible because current time is between start and end
      expect(events.some(e => e.id === '2')).toBe(true)

      vi.useRealTimers()
    })

    it('should show future events', () => {
      const store = useCalendarStore()
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-05-05T10:00:00'))

      store.calendarEvents = [{
        id: '3',
        summary: 'Future Event',
        start: '2026-05-05T18:00:00',
        end: '2026-05-05T20:00:00'
      }]

      const events = store.allEvents
      expect(events.some(e => e.id === '3')).toBe(true)

      vi.useRealTimers()
    })
  })

  describe('Midnight-Crossing Shifts', () => {
    it('should handle Luis night shift 21:00-05:00 correctly', () => {
      const store = useCalendarStore()
      store.horaires = [{
        name: "Luis",
        type: "shift",
        rotation: [{
          week: 1,
          shift: "Nuit",
          hours: ["21:00-05:00"]
        }],
        offset: 0
      }]

      const events = store.allEvents
      // Should have events created for the shift
      const luisEvents = events.filter(e => e.title === 'Luis')
      // The start and end times should have correct datetime format
      const eventWithMidnight = luisEvents.find(e => e.start?.includes('T21:00'))
      expect(eventWithMidnight).toBeDefined()
      
      // End date should be next day (05:00)
      if (eventWithMidnight) {
        const startDate = eventWithMidnight.start?.split('T')[0]
        const endDate = eventWithMidnight.end?.split('T')[0]
        // They should be different dates (next day)
        expect(startDate).not.toEqual(endDate)
      }
    })

    it('should correctly calculate end date for shifts crossing midnight', () => {
      const store = useCalendarStore()
      store.horaires = [{
        name: "Caroline",
        type: "shift",
        rotation: [{
          week: 1,
          shift: "Nuit",
          hours: ["21:00-05:00"]
        }],
        cycleLength: 1
      }]

      const events = store.allEvents
      const nightShift = events.find(e => e.title === 'Caroline' && e.startTime === '21:00')
      
      if (nightShift) {
        expect(nightShift.start).toBeDefined()
        expect(nightShift.end).toBeDefined()
        
        const [startDate, startTime] = nightShift.start!.split('T')
        const [endDate, endTime] = nightShift.end!.split('T')
        
        // End should be next day
        const start = new Date(startDate)
        const end = new Date(endDate)
        expect(end.getTime()).toBeGreaterThan(start.getTime())
        expect(endTime).toBe('05:00:00')
      }
    })
  })

  describe('Actions (fetch)', () => {
    afterEach(() => {
      vi.useRealTimers()
      vi.mocked(calendarService.getHoraires).mockReset()
      vi.mocked(calendarService.getCalendarEvents).mockReset()
    })

    it('fetchHoraires stocke les horaires', async () => {
      vi.mocked(calendarService.getHoraires).mockResolvedValue({
        horaires: [{ name: 'Rudy', type: 'fixed' }],
        lastRefresh: null,
      })

      const store = useCalendarStore()
      await store.fetchHoraires()

      expect(store.horaires).toHaveLength(1)
    })

    it('fetchHoraires vide les horaires en cas d’erreur', async () => {
      vi.mocked(calendarService.getHoraires).mockRejectedValue(new Error('down'))

      const store = useCalendarStore()
      store.horaires = [{ name: 'Rudy' }]
      await store.fetchHoraires()

      expect(store.horaires).toEqual([])
    })

    it('fetchCalendarEvents stocke les événements et lastRefresh', async () => {
      const lastRefresh = new Date('2026-07-08T10:00:00Z')
      vi.mocked(calendarService.getCalendarEvents).mockResolvedValue({
        events: [{ id: 'e1', summary: 'Réunion', start: '2026-07-09T10:00:00' }],
        lastRefresh,
      })

      const store = useCalendarStore()
      await store.fetchCalendarEvents()

      expect(store.calendarEvents).toHaveLength(1)
      expect(store.lastRefresh).toEqual(lastRefresh)
    })

    it('fetchCalendarEvents vide les événements en cas d’erreur', async () => {
      vi.mocked(calendarService.getCalendarEvents).mockRejectedValue(new Error('down'))

      const store = useCalendarStore()
      store.calendarEvents = [{ id: 'e1' }]
      await store.fetchCalendarEvents()

      expect(store.calendarEvents).toEqual([])
    })

    it('fetchAll charge tout et reset la progression quand les données changent', async () => {
      vi.mocked(calendarService.getHoraires).mockResolvedValue({
        horaires: [{ name: 'Rudy', type: 'fixed' }],
        lastRefresh: null,
      })
      vi.mocked(calendarService.getCalendarEvents).mockResolvedValue({
        events: [],
        lastRefresh: null,
      })

      const store = useCalendarStore()
      await store.fetchAll()

      expect(store.horaires).toHaveLength(1)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()

      // Deuxième appel avec les mêmes données : la branche « unchanged »
      await store.fetchAll()
      expect(store.error).toBeNull()
    })

    it('fetchAll stocke l’erreur si un sous-fetch lève', async () => {
      const store = useCalendarStore()
      // Les sous-fetchs attrapent leurs erreurs : on force un rejet direct
      store.fetchHoraires = vi.fn().mockRejectedValue(new Error('fatal'))

      await store.fetchAll()

      expect(store.error).toBe('fatal')
      expect(store.loading).toBe(false)
    })

    it('startPolling relance fetchAll chaque minute', async () => {
      vi.useFakeTimers()
      const store = useCalendarStore()
      store.fetchAll = vi.fn().mockResolvedValue(undefined)

      store.startPolling()
      await vi.advanceTimersByTimeAsync(60 * 1000)

      expect(store.fetchAll).toHaveBeenCalledWith(true)
    })
  })

  describe('Getters placeholders', () => {
    it('pastYearEvents et pastYearStats retournent des valeurs vides', () => {
      const store = useCalendarStore()
      expect(store.pastYearEvents).toEqual([])
      expect(store.pastYearStats).toEqual({})
    })
  })

  describe('allEvents — cas limites', () => {
    it('filtre les événements sans date ou avec date invalide', () => {
      const store = useCalendarStore()
      store.calendarEvents = [
        { id: 'no-date', summary: 'Sans date' },
        { id: 'bad-date', summary: 'Date pourrie', start: 'not-a-date' },
      ]

      expect(store.allEvents).toEqual([])
    })

    it('étend les événements all-day (date seule) jusqu’au lendemain', () => {
      const store = useCalendarStore()
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      store.calendarEvents = [{ id: 'allday', summary: 'Férié', start: todayStr }]

      // Sans extension au lendemain, un all-day d'aujourd'hui serait déjà « fini »
      expect(store.allEvents.map((e) => e.id)).toContain('allday')
    })

    it('retombe sur la date de début si la date de fin est invalide', () => {
      const store = useCalendarStore()
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      store.calendarEvents = [
        { id: 'bad-end', summary: 'Fin invalide', start: tomorrow.toISOString(), end: 'nawak' },
      ]

      expect(store.allEvents.map((e) => e.id)).toContain('bad-end')
    })

    it('marque les anniversaires avec le type birthday', () => {
      const store = useCalendarStore()
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      store.calendarEvents = [
        { id: 'bday', summary: 'Anniversaire Julie', start: tomorrow.toISOString() },
      ]

      const bday = store.allEvents.find((e) => e.id === 'bday')
      expect(bday?.type).toBe('birthday')
    })
  })

  describe('Transformation du planning (horaires)', () => {
    // Override couvrant toute l'année : les enfants sont « Chez Papa »
    // quelle que soit la parité de la semaine courante
    const gardeChezPapa = {
      name: 'Lyam & Noah',
      type: 'garde_alternee',
      weeks: { odd: 'Chez Papa', even: 'Chez Papa' },
      overrides: [
        { month_start: 1, day_start: 1, month_end: 12, day_end: 31, location: 'Chez Papa' },
      ],
    }
    const gardeChezMaman = {
      name: 'Lyam & Noah',
      type: 'garde_alternee',
      weeks: { odd: 'Chez Maman', even: 'Chez Maman' },
      overrides: [
        { month_start: 1, day_start: 1, month_end: 12, day_end: 31, location: 'Chez Maman' },
      ],
    }
    const allDays = {
      monday: ['08:30-17:00'],
      tuesday: ['08:30-17:00'],
      wednesday: ['08:30-17:00'],
      thursday: ['08:30-17:00'],
      friday: ['08:30-17:00'],
      saturday: ['08:30-17:00'],
      sunday: ['08:30-17:00'],
    }

    it('génère les événements de garde alternée quand les enfants sont chez Papa', () => {
      const store = useCalendarStore()
      store.horaires = [gardeChezPapa]

      const gardes = store.allEvents.filter((e) => e.type === 'garde-alternee')
      expect(gardes.length).toBeGreaterThan(0)
      expect(gardes[0]).toMatchObject({
        title: 'Lyam & Noah',
        location: 'Chez Papa',
        isAllDay: true,
      })
    })

    it('utilise la parité de semaine quand aucun override ne correspond', () => {
      const store = useCalendarStore()
      store.horaires = [
        {
          name: 'Lyam & Noah',
          type: 'garde_alternee',
          weeks: { odd: 'Chez Papa', even: 'Chez Papa' },
          overrides: [],
        },
      ]

      // Semaine paire ou impaire : les deux mènent « Chez Papa »
      const gardes = store.allEvents.filter((e) => e.type === 'garde-alternee')
      expect(gardes.length).toBeGreaterThan(0)
    })

    it('ne génère rien pour la garde quand les enfants sont chez Maman', () => {
      const store = useCalendarStore()
      store.horaires = [gardeChezMaman]

      expect(store.allEvents.filter((e) => e.type === 'garde-alternee')).toEqual([])
    })

    it('masque les événements liés à la garde quand les enfants ne sont pas là', () => {
      const store = useCalendarStore()
      store.horaires = [
        gardeChezMaman,
        { name: 'Rugby Lyam', type: 'fixed', schedule: allDays, linkedTo: 'Lyam & Noah' },
      ]

      expect(store.allEvents.filter((e) => e.title === 'Rugby Lyam')).toEqual([])
    })

    it('affiche les événements rugby quand les enfants sont chez Papa', () => {
      const store = useCalendarStore()
      store.horaires = [
        gardeChezPapa,
        { name: 'Rugby Lyam', type: 'fixed', schedule: allDays, linkedTo: 'Lyam & Noah' },
      ]

      const rugby = store.allEvents.filter((e) => e.title === 'Rugby Lyam')
      expect(rugby.length).toBeGreaterThan(0)
      expect(rugby[0].type).toBe('rugby')
    })

    it('génère les horaires fixes avec le type work pour Caroline', () => {
      const store = useCalendarStore()
      store.horaires = [{ name: 'Caroline', type: 'fixed', schedule: allDays, location: 'Clinique' }]

      const events = store.allEvents.filter((e) => e.title === 'Caroline')
      expect(events.length).toBeGreaterThan(0)
      expect(events[0]).toMatchObject({ type: 'work', startTime: '08:30', endTime: '17:00' })
    })

    it('gère les horaires fixes qui passent minuit', () => {
      const store = useCalendarStore()
      store.horaires = [
        {
          name: 'Luis',
          type: 'fixed',
          schedule: {
            monday: ['21:00-05:00'],
            tuesday: ['21:00-05:00'],
            wednesday: ['21:00-05:00'],
            thursday: ['21:00-05:00'],
            friday: ['21:00-05:00'],
            saturday: ['21:00-05:00'],
            sunday: ['21:00-05:00'],
          },
        },
      ]

      const night = store.allEvents.find((e) => e.title === 'Luis' && e.startTime === '21:00')
      expect(night).toBeDefined()
      const startDay = night!.start.split('T')[0]
      const endDay = night!.end.split('T')[0]
      expect(new Date(endDay).getTime()).toBeGreaterThan(new Date(startDay).getTime())
    })

    it('ignore les créneaux mal formés', () => {
      const store = useCalendarStore()
      store.horaires = [
        {
          name: 'Cassé',
          type: 'fixed',
          schedule: {
            monday: ['nawak', '8-17'],
            tuesday: ['nawak', '8-17'],
            wednesday: ['nawak', '8-17'],
            thursday: ['nawak', '8-17'],
            friday: ['nawak', '8-17'],
            saturday: ['nawak', '8-17'],
            sunday: ['nawak', '8-17'],
          },
        },
      ]

      expect(store.allEvents.filter((e) => e.title === 'Cassé')).toEqual([])
    })

    it('masque « Echange enfants » quand les enfants ne sont pas chez Papa', () => {
      const store = useCalendarStore()
      store.horaires = [
        gardeChezMaman,
        { name: 'Echange enfants', type: 'fixed', schedule: allDays },
      ]

      expect(store.allEvents.filter((e) => e.title === 'Echange enfants')).toEqual([])
    })

    it('type garde-alternee pour « Echange enfants » quand les enfants sont chez Papa', () => {
      const store = useCalendarStore()
      store.horaires = [gardeChezPapa, { name: 'Echange enfants', type: 'fixed', schedule: allDays }]

      const echanges = store.allEvents.filter((e) => e.title === 'Echange enfants')
      expect(echanges.length).toBeGreaterThan(0)
      expect(echanges[0].type).toBe('garde-alternee')
    })

    it('alterne le type de poubelle selon la parité de la semaine', () => {
      const store = useCalendarStore()
      store.horaires = [
        {
          name: 'Poubelle',
          type: 'fixed',
          rotationType: 'alternate',
          alternating: [
            { weekMod2: 0, type: 'Jaune' },
            { weekMod2: 1, type: 'Verte' },
          ],
          schedule: allDays,
        },
      ]

      const poubelles = store.allEvents.filter((e) => e.title === 'Poubelle')
      expect(poubelles.length).toBeGreaterThan(0)
      expect(['jaune', 'verte']).toContain(poubelles[0].type)
    })

    it('génère les shifts avec ancre de cycle (cycleAnchor)', () => {
      const store = useCalendarStore()
      store.horaires = [
        {
          name: 'Luis',
          type: 'shift',
          cycleLength: 2,
          cycleAnchor: { year: 2026, week: 1, position: 0 },
          rotation: [{ hours: ['13:00-21:00'] }, { hours: ['05:00-13:00'] }],
        },
      ]

      const shifts = store.allEvents.filter((e) => e.title === 'Luis')
      expect(shifts.length).toBeGreaterThan(0)
      expect(['13:00', '05:00']).toContain(shifts[0].startTime)
    })

    it('applique les weekOverrides des shifts en priorité', () => {
      // Reproduit le calcul de numéro de semaine du store pour cibler les 2
      // semaines couvrant les 8 prochains jours
      const weekNumber = (date: Date) => {
        const d = new Date(date)
        d.setHours(0, 0, 0, 0)
        d.setDate(d.getDate() + 4 - (d.getDay() || 7))
        const yearStart = new Date(d.getFullYear(), 0, 1)
        return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
      }
      const overrides: Record<string, any> = {}
      for (const offset of [0, 7]) {
        const d = new Date()
        d.setDate(d.getDate() + offset)
        overrides[`${d.getFullYear()}-${weekNumber(d)}`] = { hours: ['06:00-12:00'] }
      }

      const store = useCalendarStore()
      store.horaires = [
        {
          name: 'Caroline',
          type: 'shift',
          cycleLength: 2,
          offset: 0,
          rotation: [{ hours: ['13:00-21:00'] }, { hours: ['13:00-21:00'] }],
          weekOverrides: overrides,
        },
      ]

      const shifts = store.allEvents.filter((e) => e.title === 'Caroline')
      expect(shifts.length).toBeGreaterThan(0)
      expect(shifts.every((e) => e.startTime === '06:00')).toBe(true)
    })

    it('applique les exceptions par jour des shifts', () => {
      const exceptions = {
        monday: ['07:00-15:00'],
        tuesday: ['07:00-15:00'],
        wednesday: ['07:00-15:00'],
        thursday: ['07:00-15:00'],
        friday: ['07:00-15:00'],
        saturday: ['07:00-15:00'],
        sunday: ['07:00-15:00'],
      }
      const store = useCalendarStore()
      store.horaires = [
        {
          name: 'Luis',
          type: 'shift',
          cycleLength: 1,
          offset: 0,
          rotation: [{ hours: ['13:00-21:00'], exceptions }],
        },
      ]

      const shifts = store.allEvents.filter((e) => e.title === 'Luis')
      expect(shifts.length).toBeGreaterThan(0)
      expect(shifts.every((e) => e.startTime === '07:00')).toBe(true)
    })

    it('ignore les créneaux de shift mal formés', () => {
      const store = useCalendarStore()
      store.horaires = [
        {
          name: 'CasséShift',
          type: 'shift',
          cycleLength: 1,
          offset: 0,
          rotation: [{ hours: ['nawak', '8-17'] }],
        },
      ]

      expect(store.allEvents.filter((e) => e.title === 'CasséShift')).toEqual([])
    })

    it('génère les événements allday sur les jours configurés', () => {
      const store = useCalendarStore()
      store.horaires = [
        {
          name: 'Ramassage',
          type: 'allday',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          colorType: 'info',
          description: 'Sortir les poubelles',
        },
      ]

      const alldays = store.allEvents.filter((e) => e.title === 'Ramassage')
      expect(alldays.length).toBeGreaterThan(0)
      expect(alldays[0]).toMatchObject({
        isAllDay: true,
        type: 'info',
        description: 'Sortir les poubelles',
      })
    })

    it('alterne le titre/type des allday en rotation', () => {
      const store = useCalendarStore()
      store.horaires = [
        {
          name: 'Poubelle',
          type: 'allday',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          rotationType: 'alternate',
          alternating: [
            { weekMod2: 0, type: 'Jaune' },
            { weekMod2: 1, type: 'Verte' },
          ],
        },
      ]

      const alldays = store.allEvents.filter((e) => e.title === 'Poubelle')
      expect(alldays.length).toBeGreaterThan(0)
      expect(['jaune', 'verte']).toContain(alldays[0].type)
    })
  })
})