import type { HttpContext } from '@adonisjs/core/http'
import { autoriser } from '#services/administration'

/**
 * Mode veille : quand il est actif, l'écran affiche le mur de cadres photo à la place du tableau de bord.
 * L'écran demande l'état toutes les quelques secondes. Aujourd'hui on l'active par une commande (make veille-on) ;
 * le capteur de présence appellera la même route.
 * L'état vit en mémoire : après un redémarrage du serveur, l'écran est en mode normal.
 */
let actif = false
let depuis: string | null = null

export default class VeilleController {
  /** GET /veille : { actif, depuis } (lecture libre, comme la configuration de l'écran). */
  public async etat({ response }: HttpContext) {
    return response.json({ actif, depuis })
  }

  /** PUT /veille avec { "actif": true | false } et le jeton d'administration. */
  public async regler(ctx: HttpContext) {
    if (!autoriser(ctx)) return
    const demande = ctx.request.input('actif')
    if (typeof demande !== 'boolean') {
      return ctx.response.status(400).json({ error: 'actif : true ou false attendu' })
    }
    if (demande !== actif) depuis = demande ? new Date().toISOString() : null
    actif = demande
    return ctx.response.json({ actif, depuis })
  }
}
