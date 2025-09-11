// app/services/weather.ts
import axios from 'axios'

export interface WeatherDay {
  date: string
  temp: number
  tempMin: number
  tempMax: number
  feelsLike: number
  humidity: number
  precip: number
  precipProb: number
  windSpeed: number
  windGust: number
  description: string
  icon: string
  sunrise: string
  sunset: string
}

export interface WeatherData {
  location: string
  timezone: string
  current: {
    datetime: string
    temperature: number
    feelsLike: number
    humidity: number
    windSpeed: number
    windGust: number
    pressure: number
    visibility: number
    cloudCover: number
    uvIndex: number
    conditions: string
    icon: string
    sunrise: string
    sunset: string
  }
  forecast: WeatherDay[]
  lastUpdate: string
}

export default class WeatherService {
  private apiKey = process.env.OPENWEATHER_API_KEY!
  private location = 'saint just saint rambert'
  private baseUrl =
    'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline'
  private lastRefresh: number = 0
  private refreshInterval = 10 * 60 * 1000 // 10 minutes en ms
  private cachedData: WeatherData | null = null

  async getWeather(): Promise<WeatherData | null> {
    const now = Date.now()

    // Si pas de cache ou cache expiré → fetch API
    if (!this.cachedData || now - this.lastRefresh > this.refreshInterval) {
      try {
        const url = `${this.baseUrl}/${encodeURIComponent(this.location)}?unitGroup=metric&key=${this.apiKey}&contentType=json`
        const response = await axios.get(url)
        const data = response.data
        console.log('Nouvelles données récupérées:', data)

        const current = {
          datetime: data.currentConditions.datetime,
          temperature: data.currentConditions.temp,
          feelsLike: data.currentConditions.feelslike,
          humidity: data.currentConditions.humidity,
          windSpeed: data.currentConditions.windspeed,
          windGust: data.currentConditions.windgust,
          pressure: data.currentConditions.pressure,
          visibility: data.currentConditions.visibility,
          cloudCover: data.currentConditions.cloudcover,
          uvIndex: data.currentConditions.uvindex,
          conditions: data.currentConditions.conditions,
          icon: data.currentConditions.icon,
          sunrise: data.currentConditions.sunrise,
          sunset: data.currentConditions.sunset,
        }

        const forecast = data.days.slice(0).map((day: any) => ({
          date: day.datetime,
          temp: day.temp,
          tempMin: day.tempmin,
          tempMax: day.tempmax,
          feelsLike: day.feelslike,
          humidity: day.humidity,
          precip: day.precip,
          precipProb: day.precipprob,
          windSpeed: day.windspeed,
          windGust: day.windgust,
          description: day.conditions,
          icon: day.icon,
          sunrise: day.sunrise,
          sunset: day.sunset,
        }))

        // On met à jour le cache avec lastUpdate fixé une seule fois
        this.cachedData = {
          location: data.resolvedAddress,
          timezone: data.timezone,
          current,
          forecast,
          lastUpdate: new Date(now).toISOString(),
        }
        this.lastRefresh = now
      } catch (error) {
        console.error('Erreur récupération météo:', error)
        return null
      }
    }

    // Retourne le cache tel quel, lastUpdate ne change pas
    return this.cachedData
  }

  // Rafraîchissement automatique toutes les 10 minutes
  static startRefresh() {
    const service = new WeatherService()
    setInterval(
      async () => {
        await service.getWeather()
      },
      10 * 60 * 1000
    )
  }
}
