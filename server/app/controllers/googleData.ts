import type { HttpContext } from '@adonisjs/core/http'
import GoogleCalendarService from '#services/calendar'
import GoogleTasksService from '#services/tasks'
import StatsService from '#services/stats'
import GooglePhotosService from '#services/photos'
import { globalLastRefresh } from '#start/routes'

// Instances singleton pour éviter les dépendances circulaires
let calendarServiceInstance: GoogleCalendarService | null = null
let tasksServiceInstance: GoogleTasksService | null = null
let statsServiceInstance: StatsService | null = null
let photosServiceInstance: GooglePhotosService | null = null

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

function getPhotosService(): GooglePhotosService {
  if (!photosServiceInstance) {
    photosServiceInstance = new GooglePhotosService()
  }
  return photosServiceInstance
}

export default class GoogleDataController {
  public async getCalendarEvents({ response }: HttpContext) {
    const calendarService = getCalendarService()
    const events = await calendarService.listEvents()
    // Déplier les événements all-day multi-jours en un événement par jour
    const expandedEvents = events.flatMap(event => {
      // On ne déplie que les événements all-day (date sans T) et vraiment multi-jours
      const isAllDay = typeof event.start === 'string' && !event.start.includes('T') && typeof event.end === 'string' && !event.end.includes('T');
      if (isAllDay) {
        const start = new Date(event.start);
        const end = new Date(event.end);
        // Calculer la différence en jours
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Ne déplier que si c'est vraiment multi-jours (différence > 1 jour)
        if (diffDays > 1) {
          // Google Calendar: end est exclusif
          const days = [];
          for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            days.push({
              ...event,
              id: `${event.id}_${dateStr}`,
              start: dateStr,
              end: dateStr,
            });
          }
          return days;
        }
      }
      return [event];
    });
    
    // Supprimer les doublons basés sur l'ID
    const seenIds = new Set<string>();
    const uniqueEvents = expandedEvents.filter(event => {
      if (seenIds.has(event.id)) {
        return false;
      }
      seenIds.add(event.id);
      return true;
    });
    
    return response.json({
      events: uniqueEvents,
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

  public async getPhotos({ response }: HttpContext) {
    try {
      const photosService = getPhotosService()
      const photos = await photosService.getPhotos()
      return response.json({ photos })
    } catch (error) {
      console.error('Error getting photos:', error)
      return response.status(500).json({ error: 'Failed to load photos' })
    }
  }

  public async createPickerSession({ response }: HttpContext) {
    try {
      const photosService = getPhotosService()
      const session = await photosService.createPickerSession()
      return response.json({
        sessionId: session.id,
        pickerUri: session.pickerUri,
        instructions: `1. Visitez le pickerUri pour sélectionner vos photos\n2. Une fois sélectionnées, ajoutez GOOGLE_PICKER_SESSION_ID=${session.id} dans Doppler\n3. Redémarrez les conteneurs Docker`,
      })
    } catch (error: any) {
      console.error('Error creating picker session:', error)
      return response.status(500).json({ error: error.message })
    }
  }

  public async getPickerSessionStatus({ params, response }: HttpContext) {
    try {
      const photosService = getPhotosService()
      const session = await photosService.getPickerSession(params.sessionId)
      return response.json(session)
    } catch (error: any) {
      return response.status(500).json({ error: error.message })
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
