import fs from 'fs'
import path from 'path'

export interface UserTaskStats {
  user: string
  totalCreated: number
  totalCompleted: number
  completionRate: number
  lists: {
    listId: string
    listTitle: string
    created: number
    completed: number
  }[]
}

export interface ListStats {
  listTitle: string
  totalTasks: number
  totalCreated: number
  totalCompleted: number
  completionRate: number
  userCount: number
}

export interface YearStats {
  year: number
  tasks: TaskStats[]
  userStats: UserTaskStats[]
  listStats: ListStats[]
}

export interface WeatherDayInput {
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

export interface WeatherDayStats {
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
  isRainy: boolean
  isSunny: boolean
}

export interface WeatherYearStats {
  year: number
  days: WeatherDayStats[]
  averageTemp: number
  rainyDays: number
  sunnyDays: number
  description: string
}

export interface TaskStats {
  listId: string
  listTitle: string
  createdIds: Set<string>
  completedIds: Set<string>
  created: number
  completed: number
}

export default class StatsService {
  private statsDir = path.join(process.cwd(), 'app', 'database', 'recap')
  private statsFile = path.join(this.statsDir, 'yearly-stats.json')
  private weatherStatsFile = path.join(this.statsDir, 'weather-yearly-stats.json')

  constructor() {
    // Ensure directory exists
    if (!fs.existsSync(this.statsDir)) {
      fs.mkdirSync(this.statsDir, { recursive: true })
    }
    // Initialize stats files if they don't exist
    if (!fs.existsSync(this.statsFile)) {
      this.saveStats({ year: new Date().getFullYear(), tasks: [], userStats: [], listStats: [] })
    }
    if (!fs.existsSync(this.weatherStatsFile)) {
      this.saveWeatherStats({ 
        year: new Date().getFullYear(), 
        days: [],
        averageTemp: 15,
        rainyDays: 0,
        sunnyDays: 0,
        description: 'ensoleillée'
      })
    }
  }

  private loadStats(): YearStats {
    try {
      const data = fs.readFileSync(this.statsFile, 'utf8')
      const parsed = JSON.parse(data)

      // Convert arrays back to Sets
      parsed.tasks = parsed.tasks.map((task: any) => ({
        ...task,
        createdIds: new Set(task.createdIds || []),
        completedIds: new Set(task.completedIds || [])
      }))

      return parsed
    } catch (error) {
      console.error('Error loading stats:', error)
      return { year: new Date().getFullYear(), tasks: [], userStats: [], listStats: [] }
    }
  }

  private saveStats(stats: YearStats): void {
    try {
      // Convert Sets to arrays for JSON serialization
      const serializableStats = {
        ...stats,
        tasks: stats.tasks.map(task => ({
          ...task,
          createdIds: Array.from(task.createdIds),
          completedIds: Array.from(task.completedIds)
        }))
      }

      fs.writeFileSync(this.statsFile, JSON.stringify(serializableStats, null, 2))
    } catch (error) {
      console.error('Error saving stats:', error)
    }
  }

  private loadWeatherStats(): WeatherYearStats {
    try {
      const data = fs.readFileSync(this.weatherStatsFile, 'utf8')
      return JSON.parse(data)
    } catch (error) {
      console.error('Error loading weather stats:', error)
      return { 
        year: new Date().getFullYear(), 
        days: [],
        averageTemp: 15,
        rainyDays: 0,
        sunnyDays: 0,
        description: 'ensoleillée'
      }
    }
  }

  private saveWeatherStats(stats: WeatherYearStats): void {
    try {
      fs.writeFileSync(this.weatherStatsFile, JSON.stringify(stats, null, 2))
    } catch (error) {
      console.error('Error saving weather stats:', error)
    }
  }

  public getCurrentYearStats(): YearStats {
    const currentYear = new Date().getFullYear()
    const stats = this.loadStats()

    // If it's a new year, reset stats
    if (stats.year !== currentYear) {
      const newStats = { 
        year: currentYear, 
        tasks: [],
        userStats: [],
        listStats: []
      }
      this.saveStats(newStats)
      return newStats
    }

    return stats
  }

  public recordTaskCreated(listId: string, listTitle: string, taskId?: string): void {
    const stats = this.getCurrentYearStats()
    let taskStat = stats.tasks.find(t => t.listId === listId)

    if (!taskStat) {
      taskStat = {
        listId,
        listTitle,
        createdIds: new Set<string>(),
        completedIds: new Set<string>(),
        created: 0,
        completed: 0
      }
      stats.tasks.push(taskStat)
    }

    // Only increment if this task hasn't been recorded yet
    if (taskId && !taskStat.createdIds.has(taskId)) {
      taskStat.createdIds.add(taskId)
      taskStat.created = taskStat.createdIds.size
      this.saveStats(stats)
    }
  }

  public recordTaskCompleted(listId: string, listTitle: string, taskId?: string): void {
    const stats = this.getCurrentYearStats()
    let taskStat = stats.tasks.find(t => t.listId === listId)

    if (!taskStat) {
      taskStat = {
        listId,
        listTitle,
        createdIds: new Set<string>(),
        completedIds: new Set<string>(),
        created: 0,
        completed: 0
      }
      stats.tasks.push(taskStat)
    }

    // Only increment if this task hasn't been recorded yet
    if (taskId && !taskStat.completedIds.has(taskId)) {
      taskStat.completedIds.add(taskId)
      taskStat.completed = taskStat.completedIds.size
      this.saveStats(stats)
    } else if (!taskId) {
      // Fallback for backward compatibility
      taskStat.completed += 1
      this.saveStats(stats)
    }
  }

  public updateTaskStatsFromCurrentState(taskLists: any[]): void {
    console.log('🔄 Updating task stats from current state, received lists:', taskLists.length)
    const stats = this.getCurrentYearStats()

    // Reset all counters
    stats.tasks.forEach(taskStat => {
      taskStat.createdIds.clear()
      taskStat.completedIds.clear()
      taskStat.created = 0
      taskStat.completed = 0
    })

    // Count current state from all task lists
    taskLists.forEach(list => {
      console.log(`📋 Processing list: ${list.title} (${list.id}) with ${list.tasks.length} tasks`)
      let taskStat = stats.tasks.find(t => t.listId === list.id)

      if (!taskStat) {
        taskStat = {
          listId: list.id,
          listTitle: list.title,
          createdIds: new Set<string>(),
          completedIds: new Set<string>(),
          created: 0,
          completed: 0
        }
        stats.tasks.push(taskStat)
        console.log(`➕ Created new stat entry for list: ${list.title}`)
      }

      // Count all tasks in this list
      let createdCount = 0
      let completedCount = 0

      list.tasks.forEach((task: any) => {
        // Every task is "created"
        if (!taskStat.createdIds.has(task.id)) {
          taskStat.createdIds.add(task.id)
          createdCount++
        }

        // Count completed tasks
        if (task.status === 'completed' && !taskStat.completedIds.has(task.id)) {
          taskStat.completedIds.add(task.id)
          completedCount++
          console.log(`✅ Found completed task: ${task.title} in list ${list.title}`)
        }
      })

      // Update counters
      taskStat.created = taskStat.createdIds.size
      taskStat.completed = taskStat.completedIds.size

      console.log(`📊 List ${list.title}: ${createdCount} created, ${completedCount} completed (total: ${taskStat.created}/${taskStat.completed})`)
    })

    this.saveStats(stats)
    console.log('💾 Stats saved:', stats.tasks.map(t => ({
      list: t.listTitle,
      created: t.created,
      completed: t.completed,
      createdIdsSize: t.createdIds.size,
      completedIdsSize: t.completedIds.size
    })))
  }

  public getPastYearStats(): YearStats | null {
    const currentYear = new Date().getFullYear()
    const pastYear = currentYear - 1
    const statsFile = path.join(this.statsDir, `yearly-stats-${pastYear}.json`)

    console.log(`📊 Looking for stats file: ${statsFile}`)
    console.log(`📅 Current year: ${currentYear}, Past year: ${pastYear}`)
    console.log(`📄 File exists: ${fs.existsSync(statsFile)}`)

    if (fs.existsSync(statsFile)) {
      try {
        const data = fs.readFileSync(statsFile, 'utf8')
        const stats = JSON.parse(data)

        // Convert arrays back to Sets if needed
        if (stats.tasks && Array.isArray(stats.tasks)) {
          stats.tasks = stats.tasks.map((task: any) => ({
            ...task,
            createdIds: new Set(task.createdIds || []),
            completedIds: new Set(task.completedIds || [])
          }))
        }

        // Generate user and list stats from task data
        stats.userStats = this.generateUserStats(stats.tasks)
        stats.listStats = this.generateListStats(stats.tasks)

        console.log(`✅ Loaded archived stats for ${pastYear}:`, {
          tasks: stats.tasks?.length || 0,
          totalCreated: stats.tasks?.reduce((sum, t) => sum + t.created, 0) || 0,
          totalCompleted: stats.tasks?.reduce((sum, t) => sum + t.completed, 0) || 0
        })

        return stats
      } catch (error) {
        console.error('❌ Error loading past year stats:', error)
        return null
      }
    }

    // For development/testing: if no archived data exists, return current year data as past year
    console.log(`📊 No archived data for ${pastYear}, returning current year data as past year data`)
    const currentStats = this.getCurrentYearStats()
    currentStats.year = pastYear // Pretend it's past year data
    return currentStats
  }

  public recordWeatherDay(weatherDay: any): void {
    const stats = this.loadWeatherStats()
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    // Check if we already have data for today
    const existingDay = stats.days.find(d => d.date === today)
    if (existingDay) {
      return // Already recorded for today
    }

    const isRainy = weatherDay.description.toLowerCase().includes('rain') || 
                   weatherDay.description.toLowerCase().includes('pluie') ||
                   weatherDay.description.toLowerCase().includes('snow') ||
                   weatherDay.icon.includes('rain') ||
                   weatherDay.icon.includes('snow')
    
    const isSunny = weatherDay.description.toLowerCase().includes('clear') || 
                   weatherDay.icon.includes('clear') ||
                   weatherDay.icon === 'clear-day'

    const dayStats: WeatherDayStats = {
      date: today,
      temp: weatherDay.temp,
      tempMin: weatherDay.tempMin,
      tempMax: weatherDay.tempMax,
      feelsLike: weatherDay.feelsLike,
      humidity: weatherDay.humidity,
      precip: weatherDay.precip,
      precipProb: weatherDay.precipProb,
      windSpeed: weatherDay.windSpeed,
      windGust: weatherDay.windGust,
      description: weatherDay.description,
      icon: weatherDay.icon,
      sunrise: weatherDay.sunrise,
      sunset: weatherDay.sunset,
      isRainy,
      isSunny
    }

    stats.days.push(dayStats)

    // Recalculate aggregates
    stats.averageTemp = stats.days.reduce((sum, day) => sum + day.temp, 0) / stats.days.length
    stats.rainyDays = stats.days.filter(d => d.isRainy).length
    stats.sunnyDays = stats.days.filter(d => d.isSunny).length

    // Generate description
    const totalDays = stats.days.length
    const sunnyPercentage = (stats.sunnyDays / totalDays) * 100
    const rainyPercentage = (stats.rainyDays / totalDays) * 100

    if (sunnyPercentage > 60) {
      stats.description = 'très ensoleillée'
    } else if (sunnyPercentage > 40) {
      stats.description = 'ensoleillée avec quelques nuages'
    } else if (rainyPercentage > 40) {
      stats.description = 'pluvieuse'
    } else {
      stats.description = 'variable'
    }

    this.saveWeatherStats(stats)
  }

  public getPastYearWeatherStats(): WeatherYearStats | null {
    const currentYear = new Date().getFullYear()
    const pastYear = currentYear - 1
    const statsFile = path.join(this.statsDir, `weather-yearly-stats-${pastYear}.json`)

    console.log(`🌤️ Looking for weather stats file: ${statsFile}`)
    console.log(`📅 Current year: ${currentYear}, Past year: ${pastYear}`)
    console.log(`📁 Stats dir: ${this.statsDir}`)
    console.log(`📄 File exists: ${fs.existsSync(statsFile)}`)

    if (fs.existsSync(statsFile)) {
      try {
        const data = fs.readFileSync(statsFile, 'utf8')
        const stats = JSON.parse(data)
        console.log(`✅ Loaded weather stats for ${pastYear}:`, {
          days: stats.days?.length || 0,
          averageTemp: stats.averageTemp,
          rainyDays: stats.rainyDays,
          sunnyDays: stats.sunnyDays
        })
        return stats
      } catch (error) {
        console.error('❌ Error loading past year weather stats:', error)
        return null
      }
    }

    // For development/testing: if no archived data exists, return current year data as past year
    console.log(`🌤️ No archived weather data for ${pastYear}, returning current year data as past year data`)
    const currentStats = this.loadWeatherStats()
    currentStats.year = pastYear // Pretend it's past year data
    return currentStats
  }

  public archiveCurrentYear(): void {
    const currentYear = new Date().getFullYear()
    const stats = this.loadStats()

    if (stats.year === currentYear) {
      const archiveFile = path.join(this.statsDir, `yearly-stats-${currentYear}.json`)

      // Convert Sets to arrays for JSON serialization
      const serializableStats = {
        ...stats,
        tasks: stats.tasks.map(task => ({
          ...task,
          createdIds: Array.from(task.createdIds),
          completedIds: Array.from(task.completedIds)
        }))
      }

      fs.writeFileSync(archiveFile, JSON.stringify(serializableStats, null, 2))

      // Reset for new year
      this.saveStats({ year: currentYear + 1, tasks: [], userStats: [], listStats: [] })
    }
    
    // Archive weather data
    this.archiveWeatherCurrentYear()
    
    // Clean old weather data in February
    this.cleanOldWeatherData()
  }

  public archiveWeatherCurrentYear(): void {
    const currentYear = new Date().getFullYear()
    const stats = this.loadWeatherStats()

    if (stats.year === currentYear) {
      const archiveFile = path.join(this.statsDir, `weather-yearly-stats-${currentYear}.json`)

      fs.writeFileSync(archiveFile, JSON.stringify(stats, null, 2))

      // Reset for new year
      const newStats: WeatherYearStats = {
        year: currentYear + 1,
        days: [],
        averageTemp: 15,
        rainyDays: 0,
        sunnyDays: 0,
        description: 'ensoleillée'
      }
      this.saveWeatherStats(newStats)
      
      console.log(`🌤️ Données météo archivées pour l'année ${currentYear}`)
    }
  }

  public checkAndArchiveIfNeeded(): void {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 1-12
    const currentDay = now.getDate()

    // Archive at the end of the year (December 31st)
    if (currentMonth === 12 && currentDay === 31) {
      console.log(`📅 Fin d'année ${currentYear} détectée - Archiving des données...`)
      this.archiveCurrentYear()
    }
  }

  // Vérification automatique quotidienne de l'archivage
  static startArchivingCheck() {
    const service = new StatsService()
    // Vérifier une fois par jour (toutes les 24 heures)
    setInterval(
      () => {
        service.checkAndArchiveIfNeeded()
      },
      24 * 60 * 60 * 1000
    )
    
    // Vérifier immédiatement au démarrage
    service.checkAndArchiveIfNeeded()
  }

  private cleanOldWeatherData(): void {
    const currentMonth = new Date().getMonth() + 1 // getMonth() returns 0-11, we want 1-12
    
    if (currentMonth === 2) { // February
      const stats = this.loadWeatherStats()
      stats.days = [] // Clear all weather data
      stats.averageTemp = 15
      stats.rainyDays = 0
      stats.sunnyDays = 0
      stats.description = 'ensoleillée'
      this.saveWeatherStats(stats)
      console.log('🧹 Données météo anciennes supprimées (février)')
    }  }

  private generateUserStats(tasks: TaskStats[]): UserTaskStats[] {
    const users = ['Rudy', 'Caroline', 'Julie', 'Luis', 'Courses']
    const userStats: UserTaskStats[] = []

    for (const user of users) {
      const userTasks = tasks.filter(task => 
        task.listTitle.toLowerCase() === user.toLowerCase()
      )

      const totalCreated = userTasks.reduce((sum, task) => sum + task.created, 0)
      const totalCompleted = userTasks.reduce((sum, task) => sum + task.completed, 0)
      const completionRate = totalCreated > 0 ? (totalCompleted / totalCreated) * 100 : 0

      userStats.push({
        user,
        totalCreated,
        totalCompleted,
        completionRate: Math.round(completionRate * 100) / 100, // Round to 2 decimal places
        lists: userTasks.map(task => ({
          listId: task.listId,
          listTitle: task.listTitle,
          created: task.created,
          completed: task.completed
        }))
      })
    }

    return userStats
  }

  private generateListStats(tasks: TaskStats[]): ListStats[] {
    const listMap = new Map<string, TaskStats[]>()

    // Group tasks by list title
    tasks.forEach(task => {
      const listTitle = task.listTitle
      if (!listMap.has(listTitle)) {
        listMap.set(listTitle, [])
      }
      listMap.get(listTitle)!.push(task)
    })

    const listStats: ListStats[] = []

    for (const [listTitle, listTasks] of listMap) {
      const totalCreated = listTasks.reduce((sum, task) => sum + task.created, 0)
      const totalCompleted = listTasks.reduce((sum, task) => sum + task.completed, 0)
      const totalTasks = totalCreated + totalCompleted // Assuming completed tasks were also created
      const completionRate = totalCreated > 0 ? (totalCompleted / totalCreated) * 100 : 0

      // Count unique users (though each list should belong to one user)
      const userCount = 1 // Since each list belongs to one user

      listStats.push({
        listTitle,
        totalTasks,
        totalCreated,
        totalCompleted,
        completionRate: Math.round(completionRate * 100) / 100,
        userCount
      })
    }

    // Sort by total tasks descending
    return listStats.sort((a, b) => b.totalTasks - a.totalTasks)
  }
}