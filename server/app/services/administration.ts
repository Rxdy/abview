import type { HttpContext } from '@adonisjs/core/http'
import { timingSafeEqual } from 'node:crypto'

/**
 * Écrire (configurations de l'écran, mode veille…) demande le jeton ABVIEW_ADMIN_TOKEN, en en-tête
 * « Authorization: Bearer … ». Sans jeton réglé sur le serveur, l'écriture est coupée (503) : la lecture, elle, reste libre.
 * Rend true si la requête est autorisée ; sinon la réponse d'erreur est déjà envoyée.
 */
export function autoriser({ request, response }: HttpContext): boolean {
  const attendu = process.env.ABVIEW_ADMIN_TOKEN
  if (!attendu) {
    response.status(503).json({ error: 'Écriture désactivée : ABVIEW_ADMIN_TOKEN non défini' })
    return false
  }
  const recu = (request.header('authorization') || '').replace(/^Bearer /, '')
  const a = Buffer.from(recu)
  const b = Buffer.from(attendu)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    response.status(401).json({ error: 'Jeton refusé' })
    return false
  }
  return true
}
