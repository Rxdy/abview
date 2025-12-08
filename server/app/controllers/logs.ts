import type { HttpContext } from '@adonisjs/core/http'
import fs from 'fs'
import path from 'path'

export default class LogsController {
  async getLogs({ request, response }: HttpContext) {
    const category = request.param('category') || 'all'
    const hours = request.input('hours', 24)

    const logDir = path.join(process.cwd(), 'logs')

    if (!fs.existsSync(logDir)) {
      return response.json({ logs: [] })
    }

    let logs: any[] = []

    if (category === 'all') {
      // Tous les fichiers de logs
      const files = fs.readdirSync(logDir)
      files.forEach(file => {
        const filePath = path.join(logDir, file)
        if (fs.existsSync(filePath)) {
          try {
            const content = fs.readFileSync(filePath, 'utf8')
            const lines = content.trim().split('\n')
            lines.forEach(line => {
              try {
                if (line.trim()) {
                  logs.push(JSON.parse(line))
                }
              } catch (e) {
                // Ignorer les lignes malformées
              }
            })
          } catch (e) {
            // Ignorer les fichiers illisibles
          }
        }
      })
    } else {
      // Logs d'une catégorie spécifique
      const today = new Date().toISOString().split('T')[0]
      const logFile = path.join(logDir, `${category}_${today}.log`)

      if (fs.existsSync(logFile)) {
        try {
          const content = fs.readFileSync(logFile, 'utf8')
          const lines = content.trim().split('\n')
          lines.forEach(line => {
            try {
              if (line.trim()) {
                logs.push(JSON.parse(line))
              }
            } catch (e) {
              // Ignorer les lignes malformées
            }
          })
        } catch (e) {
          // Ignorer le fichier illisible
        }
      }
    }

    // Filtrer par heures et trier par timestamp
    const cutoff = Date.now() - (hours * 60 * 60 * 1000)
    logs = logs
      .filter(log => log.timestamp && new Date(log.timestamp).getTime() > cutoff)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return response.json({
      logs,
      count: logs.length,
      category,
      hours
    })
  }

  async getLogFiles({ response }: HttpContext) {
    const logDir = path.join(process.cwd(), 'logs')

    if (!fs.existsSync(logDir)) {
      return response.json({ files: [] })
    }

    const files = fs.readdirSync(logDir)
      .map(file => {
        const filePath = path.join(logDir, file)
        try {
          const stats = fs.statSync(filePath)
          return {
            name: file,
            size: stats.size,
            modified: stats.mtime,
            modifiedISO: stats.mtime.toISOString()
          }
        } catch (e) {
          return null
        }
      })
      .filter(file => file !== null)
      .sort((a, b) => new Date(b!.modified) - new Date(a!.modified))

    return response.json({
      files,
      count: files.length
    })
  }

  async createLog({ request, response }: HttpContext) {
    const logEntry = request.body()

    // Validation basique
    if (!logEntry.timestamp || !logEntry.category || !logEntry.message) {
      return response.status(400).json({ error: 'Log entry invalide' })
    }

    const logDir = path.join(process.cwd(), 'logs')
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }

    // Créer le fichier de log pour cette catégorie et date
    const date = new Date(logEntry.timestamp).toISOString().split('T')[0]
    const logFile = path.join(logDir, `${logEntry.category}_${date}.log`)

    // Écrire le log dans le fichier
    const logLine = JSON.stringify(logEntry) + '\n'
    fs.appendFileSync(logFile, logLine)

    // Nettoyer les anciens logs (garder 7 jours)
    this.cleanupOldLogs(logEntry.category)

    return response.status(201).json({ success: true })
  }

  private cleanupOldLogs(category: string) {
    const logDir = path.join(process.cwd(), 'logs')
    if (!fs.existsSync(logDir)) return

    const files = fs.readdirSync(logDir)
      .filter(file => file.startsWith(`${category}_`))
      .map(file => ({
        name: file,
        path: path.join(logDir, file),
        date: file.match(/\d{4}-\d{2}-\d{2}/)?.[0]
      }))
      .filter(f => f.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Garder seulement les 7 plus récents
    files.slice(7).forEach(file => {
      try {
        fs.unlinkSync(file.path)
      } catch (e) {
        // Ignore les erreurs de suppression
      }
    })
  }
}