import type { HttpContext } from '@adonisjs/core/http'
import PhotosService, { nomValide, ORIENTATIONS, type Orientation } from '#services/photos'

const service = new PhotosService()

export default class PhotosController {
  /**
   * GET /photos/aleatoires?orientations=paysage,portrait,paysage&exclure=a.jpg,b.jpg
   * Une photo par orientation demandée (12 au plus), tirée au hasard dans toute la bibliothèque abflow.
   * Sans abflow réglé : { photos: [], source: "absente" } (l'écran montre alors des images de démonstration).
   */
  public async aleatoires({ request, response }: HttpContext) {
    const demandees = String(request.input('orientations', 'paysage'))
      .split(',')
      .map((o) => o.trim())
      .filter((o): o is Orientation => (ORIENTATIONS as string[]).includes(o))
      .slice(0, 12)
    if (!demandees.length)
      return response.status(400).json({ error: 'orientations : paysage, portrait ou carre' })
    const exclure = String(request.input('exclure', ''))
      .split(',')
      .map((e) => e.trim())
      .filter(nomValide)
      .slice(0, 50)

    if (!service.configure) return response.json({ photos: [], source: 'absente' })
    const photos = await service.aleatoires(demandees, exclure)
    return response.json({ photos, source: 'abflow' })
  }

  /** GET /photos/fichier/:nom : la photo, réduite à 1600 px et relayée depuis abflow (la clé d'API reste sur le serveur). */
  public async fichier({ params, response }: HttpContext) {
    if (!nomValide(params.nom))
      return response.status(400).json({ error: 'Nom de fichier invalide' })
    if (!service.configure) return response.status(404).json({ error: 'abflow non configuré' })
    try {
      // Réduite à 1600 px et gardée sur disque (voir PhotosService.fichierAffichable) : l'écran n'a pas besoin des originaux
      const photo = await service.fichierAffichable(params.nom)
      response.header('Content-Type', photo.contentType)
      response.header('Cache-Control', 'public, max-age=86400')
      return response.send(photo.corps)
    } catch (e: any) {
      return response
        .status(e?.response?.status === 404 ? 404 : 502)
        .json({ error: 'Photo indisponible' })
    }
  }
}
