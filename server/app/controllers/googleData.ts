import type { HttpContext } from '@adonisjs/core/http'
import GoogleCalendarService from '#services/calendar'
import GoogleTasksService from '#services/tasks'
import StatsService from '#services/stats'

export default class GoogleDataController {
  private calendarService = new GoogleCalendarService()
  private tasksService = new GoogleTasksService()
  private statsService = new StatsService()

  public async getCalendarEvents({ response }: HttpContext) {
    const events = await this.calendarService.listEvents()
    return response.json({
      events,
      lastUpdate: this.calendarService.getLastRefresh(),
    })
  }

  public async getPastYearCalendarEvents({ response }: HttpContext) {
    const events = await this.calendarService.listPastYearEvents()
    return response.json({
      events,
    })
  }

  public async getPastYearWeatherStats({ response }: HttpContext) {
    const stats = this.statsService.getPastYearWeatherStats()
    return response.json({
      stats,
    })
  }

  public async getPastYearStats({ response }: HttpContext) {
    const stats = this.statsService.getPastYearStats()
    return response.json({
      stats,
    })
  }

  public async getTasks({ response }: HttpContext) {
    const lists = await this.tasksService.listAllTasks()
    return response.json({
      lists,
      lastUpdate: this.tasksService.getLastRefresh(),
    })
  }

  public async updateTask({ request, response }: HttpContext) {
    const taskId = request.param('id')
    const { status } = request.only(['status'])
    const success = await this.tasksService.updateTask(taskId, status)
    if (success) {
      return response.json({ success: true })
    } else {
      return response.status(404).json({ error: 'Task not found' })
    }
  }

  public async getRecapData({ response }: HttpContext) {
    try {
      // Lire les données actuelles depuis les fichiers
      const currentStats = this.statsService.getCurrentYearStats()
      const weatherStats = this.statsService.getPastYearWeatherStats() // Retourne actuelles si pas d'archives
      const events = await this.calendarService.listPastYearEvents()

      return response.json({
        year: 2025,
        tasks: currentStats, // Données actuelles de 2025
        weather: weatherStats, // Données actuelles de 2025
        events: events, // Événements de l'année passée (2024)
        generatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error getting recap data:', error)
      return response.status(500).json({ error: 'Failed to load recap data' })
    }
  }
}
