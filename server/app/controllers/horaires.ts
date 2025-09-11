import type { HttpContext } from '@adonisjs/core/http'
import fs from 'fs'
import path from 'path'

export default class HorairesController {
  public async getHoraires({ response }: HttpContext) {
    try {
      const filePath = path.join(process.cwd(), 'app/database/data/horaires.json')
      const data = fs.readFileSync(filePath, 'utf-8')
      const horaires = JSON.parse(data)

      return response.json({
        horaires,
      })
    } catch (error) {
      console.error(error)
      return response.status(500).json({ error: 'Erreur récupération horaires' })
    }
  }
}
