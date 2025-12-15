import { google } from 'googleapis'

export interface Task {
  id: string
  title: string
  status: string
  due?: string | null
  completed?: string | null
  updated?: string | null
  notes?: string | null
  taskListTitle?: string
  taskListId?: string
}

export default class GoogleTasksService {
  private tasks: any
  private cachedTasks: Task[] = []
  private lastRefresh: number = 0
  private refreshInterval = 5 * 60 * 1000 // 5 minutes en ms

  private async getAuthClient() {
    const client_id = process.env.GOOGLE_CLIENT_ID!
    const client_secret = process.env.GOOGLE_CLIENT_SECRET!
    const redirect_uri = process.env.GOOGLE_REDIRECT_URI!

    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri)

    oauth2Client.setCredentials({
      access_token: process.env.GOOGLE_ACCESS_TOKEN,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    })

    return oauth2Client
  }

  private async fetchAllTasks(): Promise<Task[]> {
    if (!this.tasks) {
      const authClient = await this.getAuthClient()
      this.tasks = google.tasks({ version: 'v1', auth: authClient })
    }

    const allTasks: Task[] = []

    const taskListsResponse = await this.tasks.tasklists.list()
    const taskLists = taskListsResponse.data.items || []

    for (const list of taskLists) {
      const res = await this.tasks.tasks.list({
        tasklist: list.id,
        showCompleted: true,
        maxResults: 100,
        showHidden: true,
      })

      const tasks = (res.data.items || []).map((t: any) => ({
        id: t.id,
        title: t.title || '',
        status: t.status || '',
        due: t.due || null,
        completed: t.completed || null,
        updated: t.updated || null,
        notes: t.notes || null,
        taskListTitle: list.title || 'Unknown',
        taskListId: list.id,
      }))

      allTasks.push(...tasks)
    }

    return allTasks
  }

  async listAllTasks(): Promise<Task[]> {
    const now = Date.now()
    // Toujours rafraîchir les données pour avoir les dernières tâches
    this.cachedTasks = await this.fetchAllTasks()
    this.lastRefresh = now
    return this.cachedTasks
  }

  /** Retourne la date du dernier refresh (null si jamais fait) */
  getLastRefresh(): Date | null {
    return this.lastRefresh ? new Date(this.lastRefresh) : null
  }
}
