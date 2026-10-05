import { test } from '@japa/runner'
import axios from 'axios'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import StatsService from '#services/stats'
import WeatherService from '#services/weather'

const fakeApiResponse = {
  resolvedAddress: 'Saint-Just-Saint-Rambert',
  timezone: 'Europe/Paris',
  currentConditions: {
    temp: 20,
    feelslike: 19,
    humidity: 60,
    windspeed: 10,
    windgust: 15,
    winddir: 180,
    pressure: 1015,
    visibility: 10,
    cloudcover: 20,
    uvindex: 3,
    conditions: 'Clear',
    icon: 'clear-day',
    sunrise: '06:00',
    sunset: '21:00',
  },
  days: [
    {
      datetime: '2026-01-01',
      temp: 18,
      tempmin: 10,
      tempmax: 22,
      feelslike: 17,
      humidity: 55,
      precip: 0,
      precipprob: 5,
      windspeed: 8,
      windgust: 12,
      conditions: 'Clear',
      icon: 'clear-day',
      sunrise: '06:00',
      sunset: '21:00',
    },
  ],
}

// axios est un singleton ESM : monkey-patcher axios.get affecte aussi
// l'appel interne fait par weather.ts (même référence d'objet).
test.group('WeatherService', (group) => {
  let originalGet: typeof axios.get
  let originalRecordWeatherDay: typeof StatsService.prototype.recordWeatherDay
  let tmpDir: string
  let originalCwd: string
  let recordWeatherDayCalls: any[]

  group.each.setup(() => {
    originalGet = axios.get
    originalRecordWeatherDay = StatsService.prototype.recordWeatherDay
    originalCwd = process.cwd()
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'abview-weather-'))
    process.chdir(tmpDir)

    recordWeatherDayCalls = []
    StatsService.prototype.recordWeatherDay = function (day: any) {
      recordWeatherDayCalls.push(day)
    }

    return () => {
      axios.get = originalGet
      StatsService.prototype.recordWeatherDay = originalRecordWeatherDay
      process.chdir(originalCwd)
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  test('récupère et transforme les données météo depuis l’API', async ({ assert }) => {
    let calledUrl = ''
    axios.get = (async (url: string) => {
      calledUrl = url
      return { data: fakeApiResponse }
    }) as typeof axios.get

    const service = new WeatherService()
    const result = await service.getWeather()

    assert.include(calledUrl, 'saint%20just%20saint%20rambert')
    assert.isNotNull(result)
    assert.equal(result!.location, 'Saint-Just-Saint-Rambert')
    assert.equal(result!.current.temperature, 20)
    assert.equal(result!.current.feelsLike, 19)
    assert.lengthOf(result!.forecast, 1)
    assert.equal(result!.forecast[0].temp, 18)
    assert.equal(result!.forecast[0].tempMin, 10)
    assert.lengthOf(recordWeatherDayCalls, 1)
  })

  test('retourne le cache si appelé de nouveau avant expiration', async ({ assert }) => {
    let callCount = 0
    axios.get = (async () => {
      callCount++
      return { data: fakeApiResponse }
    }) as typeof axios.get

    const service = new WeatherService()
    const first = await service.getWeather()
    const second = await service.getWeather()

    assert.equal(callCount, 1)
    assert.strictEqual(first, second)
  })

  test('retourne null si l’API échoue', async ({ assert }) => {
    axios.get = (async () => {
      throw new Error('network down')
    }) as typeof axios.get

    const service = new WeatherService()
    const result = await service.getWeather()

    assert.isNull(result)
  })

  test('startRefresh programme un rafraîchissement toutes les 10 minutes', async ({ assert }) => {
    const originalSetInterval = global.setInterval
    let capturedCallback: (() => Promise<void>) | null = null
    let capturedDelay = 0
    global.setInterval = ((cb: any, delay: number) => {
      capturedCallback = cb
      capturedDelay = delay
      return 0 as any
    }) as typeof setInterval

    let callCount = 0
    axios.get = (async () => {
      callCount++
      return { data: fakeApiResponse }
    }) as typeof axios.get

    try {
      WeatherService.startRefresh()
      assert.equal(capturedDelay, 10 * 60 * 1000)
      assert.isFunction(capturedCallback)

      await capturedCallback!()
      assert.equal(callCount, 1)
    } finally {
      global.setInterval = originalSetInterval
    }
  })

  test('ne plante pas si forecast est vide (pas de recordWeatherDay)', async ({ assert }) => {
    axios.get = (async () => ({
      data: { ...fakeApiResponse, days: [] },
    })) as typeof axios.get

    const service = new WeatherService()
    const result = await service.getWeather()

    assert.isNotNull(result)
    assert.lengthOf(result!.forecast, 0)
    assert.lengthOf(recordWeatherDayCalls, 0)
  })
})
