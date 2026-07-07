import { test } from '@japa/runner'
import { google } from 'googleapis'

// GoogleDataController garde un singleton GoogleCalendarService créé au
// premier appel à /calendar ou /calendar/past-year : ce fichier est le seul
// à taper sur ces deux routes pour ne mocker google.calendar qu'une fois.
test.group('Routes /calendar', (group) => {
  let originalCalendar: typeof google.calendar

  group.each.setup(() => {
    originalCalendar = google.calendar
    return () => {
      google.calendar = originalCalendar
    }
  })

  test('GET /calendar déplie les événements all-day multi-jours', async ({ client, assert }) => {
    google.calendar = (() => ({
      events: {
        list: async () => ({
          data: {
            items: [
              {
                id: 'evt-multi',
                summary: 'Vacances',
                start: { date: '2026-01-01' },
                end: { date: '2026-01-04' }, // 3 jours (fin exclusive)
              },
              {
                id: 'evt-simple',
                summary: 'RDV',
                start: { dateTime: '2026-01-05T10:00:00Z' },
                end: { dateTime: '2026-01-05T11:00:00Z' },
              },
            ],
          },
        }),
      },
    })) as unknown as typeof google.calendar

    const response = await client.get('/calendar')

    response.assertStatus(200)
    const body = response.body()
    // 3 jours dépliés pour l'event multi-jours + 1 event simple = 4
    const expandedIds = body.events.map((e: any) => e.id)
    assert.include(expandedIds, 'evt-multi_2026-01-01')
    assert.include(expandedIds, 'evt-multi_2026-01-02')
    assert.include(expandedIds, 'evt-multi_2026-01-03')
    assert.include(expandedIds, 'evt-simple')
    assert.lengthOf(body.events, 4)
    assert.isString(body.lastRefresh)
  })
})
