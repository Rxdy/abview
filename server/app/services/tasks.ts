import { google } from 'googleapis'
import StatsService from '#services/stats'
import { updateGlobalLastRefresh } from '#start/routes'

export interface Task {
  id: string
  title: string
  status: string
  due?: string | null
  completed?: string | null
  updated?: string | null
  notes?: string | null
  parent?: string | null
  level: number
}

export interface TaskList {
  id: string
  title: string
  color: string
  tasks: Task[]
}

export default class GoogleTasksService {
  private tasks: any
  private cachedLists: TaskList[] = []
  private lastRefresh: number = 0
  private refreshInterval = 5 * 60 * 1000 // 5 minutes en ms
  private statsService = new StatsService()
  private previousTasksState: { [listId: string]: { [taskId: string]: Task } } = {}

  private trackTaskChanges(currentLists: TaskList[]): void {
    const currentState: { [listId: string]: { [taskId: string]: Task } } = {}

    // Build current state
    currentLists.forEach(list => {
      currentState[list.id] = {}
      list.tasks.forEach(task => {
        currentState[list.id][task.id] = { ...task }
      })
    })

    // Ensure previousTasksState is initialized
    if (!this.previousTasksState) {
      this.previousTasksState = {}
    }

    // Compare with previous state
    Object.keys(currentState).forEach(listId => {
      const currentTasks = currentState[listId]
      const previousTasks = this.previousTasksState[listId] || {}

      Object.keys(currentTasks).forEach(taskId => {
        const currentTask = currentTasks[taskId]
        const previousTask = previousTasks[taskId]

        if (!previousTask) {
          // New task created
          this.statsService.recordTaskCreated(listId, currentLists.find(l => l.id === listId)?.title || 'Unknown', taskId)
        } else if (currentTask.status === 'completed' && previousTask.status !== 'completed') {
          // Task completed
          this.statsService.recordTaskCompleted(listId, currentLists.find(l => l.id === listId)?.title || 'Unknown', taskId)
        }
      })
    })

    // Update previous state
    this.previousTasksState = currentState
  }

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

  private getPostItColor(listTitle: string): string {
    // Couleurs spécifiques par nom de liste
    const colorMap: { [key: string]: string } = {
      'Luis': '#004C99',      // Bleu FC Porto
      'Julie': '#ffd1dc',     // Rose
      'Courses': '#e74c3c',   // Rouge
      'Caroline': '#f39c12',  // Orange
      'Rudy': '#1e293b',      // Bleu header/footer
      'Général': '#9b59b6',   // Violet (complémentaire)
    };

    // Couleurs aléatoires pour les autres listes
    const randomColors = [
      "#fff9a6",  // Jaune
      "#ffd1dc",  // Rose
      "#c3f7d6",  // Vert
      "#cce0ff",  // Bleu clair
      "#ffe6b3",  // Orange clair
    ];

    // Chercher correspondance (insensible à la casse)
    const normalizedTitle = listTitle?.trim();
    for (const [name, color] of Object.entries(colorMap)) {
      if (normalizedTitle?.toLowerCase() === name.toLowerCase()) {
        return color;
      }
    }

    // Couleur aléatoire pour les listes inconnues
    const hash = listTitle.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return randomColors[Math.abs(hash) % randomColors.length];
  }

  private computeTaskLevel(taskMap: Map<string, Task>): void {
    // Build hierarchy
    const rootTasks: Task[] = [];
    const childTasks: Map<string, Task[]> = new Map();

    for (const task of taskMap.values()) {
      if (task.parent) {
        if (!childTasks.has(task.parent)) {
          childTasks.set(task.parent, []);
        }
        childTasks.get(task.parent)!.push(task);
      } else {
        rootTasks.push(task);
      }
    }

    // Sort root tasks by position - but since we don't have position in Task, assume order
    // Recursive function to set levels
    const setLevel = (task: Task, level: number) => {
      task.level = level;
      const children = childTasks.get(task.id) || [];
      for (const child of children) {
        setLevel(child, level + 1);
      }
    };

    for (const rootTask of rootTasks) {
      setLevel(rootTask, 0);
    }
  }

  private async fetchAllLists(): Promise<TaskList[]> {
    if (!this.tasks) {
      const authClient = await this.getAuthClient()
      this.tasks = google.tasks({ version: 'v1', auth: authClient })
    }

    const taskListsResponse = await this.tasks.tasklists.list()
    const taskLists = taskListsResponse.data.items || []

    const lists: TaskList[] = []

    for (const list of taskLists) {
      const res = await this.tasks.tasks.list({
        tasklist: list.id,
        showCompleted: true,
        maxResults: 100,
        showHidden: true,
      })

      const rawTasks = res.data.items || []
      if (rawTasks.length === 0) continue // Skip lists with no tasks

      const taskMap = new Map<string, any>()
      const tasks: Task[] = rawTasks.map((t: any) => {
        const task = {
          id: t.id,
          title: t.title || '',
          status: t.status || '',
          due: t.due || null,
          completed: t.completed || null,
          updated: t.updated || null,
          notes: t.notes || null,
          parent: t.parent || null,
          level: 0, // Will be set later
        }
        taskMap.set(t.id, task)
        return task
      })

      // Compute levels
      this.computeTaskLevel(taskMap)

      lists.push({
        id: list.id,
        title: list.title || 'Unknown',
        color: this.getPostItColor(list.title || 'Unknown'),
        tasks: tasks,
      })
    }

    // Track task changes for stats
    this.trackTaskChanges(lists)

    return lists
  }

  async listAllTasks(): Promise<TaskList[]> {
    const now = Date.now()
    // Vérifier le cache : rafraîchir seulement toutes les 5 minutes
    if (now - this.lastRefresh > this.refreshInterval || this.cachedLists.length === 0) {
      this.cachedLists = await this.fetchAllLists()
      this.lastRefresh = now
      updateGlobalLastRefresh() // Mettre à jour le lastRefresh global seulement lors d'un vrai refresh

      // Update stats from current state
      this.statsService.updateTaskStatsFromCurrentState(this.cachedLists)
    }

    return this.cachedLists
  }

  async updateTask(taskId: string, status: string): Promise<boolean> {
    if (!this.tasks) {
      const authClient = await this.getAuthClient()
      this.tasks = google.tasks({ version: 'v1', auth: authClient })
    }

    // Find the list for this task
    for (const list of this.cachedLists) {
      const task = list.tasks.find(t => t.id === taskId)
      if (task) {
        try {
          await this.tasks.tasks.patch({
            tasklist: list.id,
            task: taskId,
            requestBody: { status }
          })
          // Update cached
          task.status = status
          if (status === 'completed') {
            task.completed = new Date().toISOString()
          } else {
            task.completed = null
          }
          return true
        } catch (error) {
          console.error('Error updating task:', error)
          return false
        }
      }
    }
    return false
  }

  /** Retourne la date du dernier refresh (null si jamais fait) */
  getLastRefresh(): Date | null {
    return this.lastRefresh ? new Date(this.lastRefresh) : null
  }
}
