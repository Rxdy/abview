import type { HttpContext } from '@adonisjs/core/http'
import GoogleCalendarService from '#services/calendar'
import GoogleTasksService from '#services/tasks'

export default class GoogleDataController {
  private calendarService = new GoogleCalendarService()
  private tasksService = new GoogleTasksService()

  public async getCalendarEvents({ response }: HttpContext) {
    const events = await this.calendarService.listEvents()
    return response.json({
      events,
      lastUpdate: this.calendarService.getLastRefresh(),
    })
  }

  public async getTasks({ response }: HttpContext) {
    const tasks = await this.tasksService.listAllTasks()
    return response.json({
      tasks,
      lastUpdate: this.tasksService.getLastRefresh(),
    })
  }
}
