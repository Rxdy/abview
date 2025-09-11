import type { HttpContext } from '@adonisjs/core/http'
import WeatherService from '#services/weather'

// Crée une instance unique en dehors du controller
const weatherService = new WeatherService()

export default class WeatherController {
  async getWeather({ response }: HttpContext) {
    const weather = await weatherService.getWeather()

    return response.json({
      weather: weather || null,
    })
  }
}
