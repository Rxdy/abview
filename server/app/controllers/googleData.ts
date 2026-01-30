import type { HttpContext } from '@adonisjs/core/http'
import GoogleCalendarService from '#services/calendar'
import GoogleTasksService from '#services/tasks'
import StatsService from '#services/stats'
import { globalLastRefresh } from '#start/routes'

// Instances singleton pour éviter les dépendances circulaires
let calendarServiceInstance: GoogleCalendarService | null = null
let tasksServiceInstance: GoogleTasksService | null = null
let statsServiceInstance: StatsService | null = null

function getCalendarService(): GoogleCalendarService {
  if (!calendarServiceInstance) {
    calendarServiceInstance = new GoogleCalendarService()
  }
  return calendarServiceInstance
}

function getTasksService(): GoogleTasksService {
  if (!tasksServiceInstance) {
    tasksServiceInstance = new GoogleTasksService()
  }
  return tasksServiceInstance
}

function getStatsService(): StatsService {
  if (!statsServiceInstance) {
    statsServiceInstance = new StatsService()
  }
  return statsServiceInstance
}

export default class GoogleDataController {
  public async getCalendarEvents({ response }: HttpContext) {
    const calendarService = getCalendarService()
    const events = await calendarService.listEvents()
    return response.json({
      events,
      lastRefresh: globalLastRefresh,
    })
  }

  public async getPastYearCalendarEvents({ response }: HttpContext) {
    const calendarService = getCalendarService()
    const events = await calendarService.listPastYearEvents()
    return response.json({
      events,
    })
  }

  public async getPastYearWeatherStats({ response }: HttpContext) {
    const statsService = getStatsService()
    const stats = statsService.getPastYearWeatherStats()
    return response.json({
      stats,
    })
  }

  public async getPastYearStats({ response }: HttpContext) {
    const statsService = getStatsService()
    const stats = statsService.getPastYearStats()
    return response.json({
      stats,
    })
  }

  public async getTasks({ response }: HttpContext) {
    const tasksService = getTasksService()
    const lists = await tasksService.listAllTasks()
    return response.json({
      lists,
      lastRefresh: globalLastRefresh,
    })
  }

  public async updateTask({ request, response }: HttpContext) {
    const tasksService = getTasksService()
    const taskId = request.param('id')
    const { status } = request.only(['status'])
    const success = await tasksService.updateTask(taskId, status)
    if (success) {
      return response.json({ success: true })
    } else {
      return response.status(404).json({ error: 'Task not found' })
    }
  }

  public async getRecapData({ response }: HttpContext) {
    try {
      const statsService = getStatsService()
      const calendarService = getCalendarService()
      
      // Lire les données archivées de l'année passée
      const pastYearStats = statsService.getPastYearStats()
      const weatherStats = statsService.getPastYearWeatherStats()
      const events = await calendarService.listPastYearEvents()

      return response.json({
        year: new Date().getFullYear() - 1, // Année passée
        tasks: pastYearStats, // Données archivées de l'année passée
        weather: weatherStats, // Données archivées de l'année passée
        events: events, // Événements de l'année passée
        generatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error getting recap data:', error)
      return response.status(500).json({ error: 'Failed to load recap data' })
    }
  }
}
