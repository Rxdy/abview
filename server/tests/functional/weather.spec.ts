import { test } from '@japa/runner'
import axios from 'axios'

// WeatherController garde un singleton WeatherService créé au premier appel :
// on ne mocke qu'une fois, ce fichier est le seul à taper sur /weather.
test.group('Route /weather', (group) => {
  let originalGet: typeof axios.get

  group.each.setup(() => {
    originalGet = axios.get
    return () => {
      axios.get = originalGet
    }
  })

  test('GET /weather retourne les données météo transformées', async ({ client, assert }) => {
    axios.get = (async () => ({
      data: {
        resolvedAddress: 'Saint-Just-Saint-Rambert',
        timezone: 'Europe/Paris',
        currentConditions: {
          temp: 22,
          feelslike: 21,
          humidity: 50,
          windspeed: 5,
          windgust: 8,
          winddir: 90,
          pressure: 1013,
          visibility: 10,
          cloudcover: 10,
          uvindex: 4,
          conditions: 'Clear',
          icon: 'clear-day',
          sunrise: '06:00',
          sunset: '21:30',
        },
        days: [
          {
            datetime: '2026-01-01',
            temp: 20,
            tempmin: 14,
            tempmax: 24,
            feelslike: 19,
            humidity: 45,
            precip: 0,
            precipprob: 0,
            windspeed: 6,
            windgust: 9,
            conditions: 'Clear',
            icon: 'clear-day',
            sunrise: '06:00',
            sunset: '21:30',
          },
        ],
      },
    })) as typeof axios.get

    const response = await client.get('/weather')

    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.weather.location, 'Saint-Just-Saint-Rambert')
    assert.equal(body.weather.current.temperature, 22)
    assert.isString(body.lastRefresh)
  })
})
