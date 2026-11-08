import type { HttpContext } from '@adonisjs/core/http'
import { timingSafeEqual } from 'node:crypto'
import ConfigurationsService, {
  type Configuration,
  idValide,
  verifierForme,
} from '#services/configurations'

const service = new ConfigurationsService()

/** Écrire demande le jeton ABVIEW_ADMIN_TOKEN (en-tête Authorization: Bearer …). Sans jeton réglé, l'écriture est coupée. */
function autoriser({ request, response }: HttpContext): boolean {
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

export default class ConfigurationsController {
  /** Ce que le kiosque lit : la configuration active, ou null (disposition standard). */
  public async active({ response }: HttpContext) {
    const active = service.active()
    return response.json({ id: active?.id ?? null, configuration: active?.configuration ?? null })
  }

  public async liste({ response }: HttpContext) {
    return response.json(service.liste())
  }

  public async obtenir({ params, response }: HttpContext) {
    const configuration = service.obtenir(params.id)
    if (!configuration) return response.status(404).json({ error: 'Configuration introuvable' })
    return response.json({ id: params.id, configuration })
  }

  public async enregistrer(ctx: HttpContext) {
    if (!autoriser(ctx)) return
    const { params, request, response } = ctx
    if (!idValide(params.id)) {
      return response
        .status(400)
        .json({ error: 'Identifiant : lettres minuscules, chiffres et tirets (40 au plus)' })
    }
    const erreurs = verifierForme(request.body())
    if (erreurs.length)
      return response.status(422).json({ error: 'Configuration invalide', details: erreurs })
    service.enregistrer(params.id, request.body() as Configuration)
    return response.json({ id: params.id })
  }

  public async supprimer(ctx: HttpContext) {
    if (!autoriser(ctx)) return
    const resultat = service.supprimer(ctx.params.id)
    if (resultat === 'absente')
      return ctx.response.status(404).json({ error: 'Configuration introuvable' })
    if (resultat === 'active') {
      return ctx.response
        .status(409)
        .json({ error: 'Configuration active : en activer une autre avant de la supprimer' })
    }
    return ctx.response.json({ id: ctx.params.id })
  }

  /** Corps : { id: "semaine" }, ou { id: null } pour revenir à la disposition standard. */
  public async activer(ctx: HttpContext) {
    if (!autoriser(ctx)) return
    const id = ctx.request.input('id')
    if (id !== null && typeof id !== 'string')
      return ctx.response.status(400).json({ error: 'id attendu (texte ou null)' })
    if (!service.activer(id))
      return ctx.response.status(404).json({ error: 'Configuration introuvable' })
    return ctx.response.json({ id })
  }
}
