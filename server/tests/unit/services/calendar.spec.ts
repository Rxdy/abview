import { test } from '@japa/runner'
import { google } from 'googleapis'
import GoogleCalendarService from '#services/calendar'

const fakeEvent = (overrides: Partial<any> = {}) => ({
  id: 'evt-1',
  summary: 'Réunion',
  start: { dateTime: '2026-01-01T10:00:00Z' },
  end: { dateTime: '2026-01-01T11:00:00Z' },
  description: 'Desc',
  location: 'Bureau',
  ...overrides,
})

test.group('GoogleCalendarService', (group) => {
  let originalCalendar: typeof google.calendar

  group.each.setup(() => {
    originalCalendar = google.calendar
    return () => {
      google.calendar = originalCalendar
    }
  })

  function mockCalendarApi(listImpl: (params: any) => Promise<any>) {
    google.calendar = (() => ({
      events: { list: listImpl },
    })) as unknown as typeof google.calendar
  }

  test('listEvents transforme les événements Google Calendar', async ({ assert }) => {
    mockCalendarApi(async () => ({ data: { items: [fakeEvent()] } }))

    const service = new GoogleCalendarService()
    const events = await service.listEvents()

    assert.lengthOf(events, 1)
    assert.equal(events[0].id, 'evt-1')
    assert.equal(events[0].summary, 'Réunion')
    assert.equal(events[0].start, '2026-01-01T10:00:00Z')
  })

  test('listEvents gère les événements sans champs optionnels', async ({ assert }) => {
    mockCalendarApi(async () => ({
      data: {
        items: [
          {
            id: 'evt-2',
            start: { date: '2026-01-02' },
            end: { date: '2026-01-03' },
          },
        ],
      },
    }))

    const service = new GoogleCalendarService()
    const events = await service.listEvents()

    assert.equal(events[0].summary, '')
    assert.equal(events[0].description, '')
    assert.equal(events[0].location, '')
    assert.equal(events[0].start, '2026-01-02')
  })

  test('listEvents retourne un tableau vide si pas d’items', async ({ assert }) => {
    mockCalendarApi(async () => ({ data: {} }))

    const service = new GoogleCalendarService()
    const events = await service.listEvents()

    assert.deepEqual(events, [])
  })

  test('listEvents met en cache et ne refait pas d’appel avant expiration', async ({ assert }) => {
    let callCount = 0
    mockCalendarApi(async () => {
      callCount++
      return { data: { items: [fakeEvent()] } }
    })

    const service = new GoogleCalendarService()
    await service.listEvents()
    await service.listEvents()

    assert.equal(callCount, 1)
  })

  test('listPastYearEvents ne met jamais en cache (toujours un appel)', async ({ assert }) => {
    let callCount = 0
    mockCalendarApi(async () => {
      callCount++
      return { data: { items: [fakeEvent()] } }
    })

    const service = new GoogleCalendarService()
    await service.listPastYearEvents()
    await service.listPastYearEvents()

    assert.equal(callCount, 2)
  })

  test('listEvents gère un événement sans start ni end', async ({ assert }) => {
    mockCalendarApi(async () => ({ data: { items: [{ id: 'evt-3', summary: 'Sans dates' }] } }))

    const service = new GoogleCalendarService()
    const events = await service.listEvents()

    assert.equal(events[0].start, '')
    assert.equal(events[0].end, '')
  })

  test('listPastYearEvents applique les valeurs par défaut sur les champs manquants', async ({
    assert,
  }) => {
    mockCalendarApi(async () => ({
      data: {
        items: [{ id: 'evt-4', start: { date: '2025-06-01' }, end: { date: '2025-06-02' } }],
      },
    }))

    const service = new GoogleCalendarService()
    const events = await service.listPastYearEvents()

    assert.equal(events[0].summary, '')
    assert.equal(events[0].start, '2025-06-01')
    assert.equal(events[0].end, '2025-06-02')
    assert.equal(events[0].description, '')
    assert.equal(events[0].location, '')
  })

  test('listPastYearEvents retourne un tableau vide si pas d’items', async ({ assert }) => {
    mockCalendarApi(async () => ({ data: {} }))

    const service = new GoogleCalendarService()
    const events = await service.listPastYearEvents()

    assert.deepEqual(events, [])
  })

  test('getLastRefresh retourne null avant le premier fetch', ({ assert }) => {
    const service = new GoogleCalendarService()
    assert.isNull(service.getLastRefresh())
  })

  test('getLastRefresh retourne une date après un fetch', async ({ assert }) => {
    mockCalendarApi(async () => ({ data: { items: [] } }))

    const service = new GoogleCalendarService()
    await service.listEvents()

    assert.instanceOf(service.getLastRefresh(), Date)
  })
})
