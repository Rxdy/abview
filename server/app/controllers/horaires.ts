import type { HttpContext } from '@adonisjs/core/http'
import fs from 'fs'
import path from 'path'
import { globalLastRefresh } from '#start/routes'

export default class HorairesController {
  private lastRefresh: string = new Date().toISOString()
  private cachedHoraires: any = null
  private lastFileCheck: number = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  public async getHoraires({ response }: HttpContext) {
    try {
      const now = Date.now()
      
      // Si cache expiré ou pas de cache, recharger le fichier
      if (!this.cachedHoraires || (now - this.lastFileCheck) > this.CACHE_DURATION) {
        const filePath = path.join(process.cwd(), 'app/database/data/horaires.json')
        const data = fs.readFileSync(filePath, 'utf-8')
        this.cachedHoraires = JSON.parse(data)
        this.lastRefresh = new Date(now).toISOString()
        this.lastFileCheck = now
      }

      return response.json({
        horaires: this.cachedHoraires,
        lastRefresh: globalLastRefresh,
      })
    } catch (error) {
      console.error(error)
      return response.status(500).json({ error: 'Erreur récupération horaires' })
    }
  }
}
