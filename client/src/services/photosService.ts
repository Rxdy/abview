import { apiService } from './apiService'
import { photoDemo, type Orientation, type PhotoAffichee } from '../utils/photosDemo'

/**
 * Photos du module Photos : tirées au hasard dans toute la bibliothèque abflow par le serveur d'AbView.
 * Sans abflow (ou en cas de panne), des images de démonstration prennent le relais : l'écran n'est jamais vide.
 */
export const photosService = {
  /**
   * Une photo par orientation demandée, dans l'ordre. `exclure` : les photos déjà à l'écran, à éviter.
   * Une orientation sans photo reçoit une image de démonstration.
   */
  async aleatoires(orientations: Orientation[], exclure: string[] = []): Promise<PhotoAffichee[]> {
    let recues: PhotoAffichee[] = []
    try {
      const requete = `/photos/aleatoires?orientations=${orientations.join(',')}${
        exclure.length ? `&exclure=${encodeURIComponent(exclure.join(','))}` : ''
      }`
      const { photos } = await apiService.get(requete)
      recues = Array.isArray(photos) ? photos : []
    } catch {
      /* serveur ou abflow indisponible : images de démonstration */
    }
    // Chaque emplacement reçoit une photo de SON orientation ; à défaut, une image de démonstration. Un emplacement
    // « carré » (les cadres ronds) accepte une photo d'une autre orientation, recadrée au centre : jamais l'inverse.
    const libres = [...recues]
    const resultat: (PhotoAffichee | undefined)[] = orientations.map((o) => {
      const i = libres.findIndex((p) => p.orientation === o)
      return i >= 0 ? libres.splice(i, 1)[0] : undefined
    })
    return orientations.map((o, k) => {
      if (resultat[k]) return resultat[k]!
      if (o === 'carre' && libres.length) return libres.shift()!
      return photoDemo(o)
    })
  },
}
