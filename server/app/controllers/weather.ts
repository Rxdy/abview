import type { HttpContext } from '@adonisjs/core/http'
import WeatherService from '#services/weather'
import { globalLastRefresh } from '#start/routes'

// Instance singleton pour éviter les dépendances circulaires
let weatherServiceInstance: WeatherService | null = null

function getWeatherService(): WeatherService {
  if (!weatherServiceInstance) {
    weatherServiceInstance = new WeatherService()
  }
  return weatherServiceInstance
}

export default class WeatherController {
  async getWeather({ response }: HttpContext) {
    const weatherService = getWeatherService()
    const weather = await weatherService.getWeather()

    return response.json({
      weather: weather || null,
      lastRefresh: globalLastRefresh,
    })
  }
}
