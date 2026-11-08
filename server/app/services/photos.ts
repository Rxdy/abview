import axios from 'axios'

/**
 * Photos du module « Photos » d'AbView, prises dans abflow (la bibliothèque de photos de la maison).
 *
 * abflow expose une API en lecture seule pour les intégrations (clé X-API-Key) : la liste des images avec leurs
 * dimensions, et les fichiers. AbView garde la clé côté serveur : l'écran ne parle qu'à AbView, qui lui donne
 * des photos tirées au hasard dans TOUTE la bibliothèque (pas seulement les plus récentes), avec l'orientation
 * demandée (une photo en paysage ne va jamais dans un emplacement en portrait).
 *
 * Réglé par ABFLOW_URL et ABFLOW_API_KEY. Sans eux, le service répond « aucune photo » et l'écran montre
 * des images de démonstration.
 */
export type Orientation = 'paysage' | 'portrait' | 'carre'
export const ORIENTATIONS: Orientation[] = ['paysage', 'portrait', 'carre']

export interface Photo {
  /** Nom du fichier dans abflow : sert d'identifiant. */
  id: string
  /** Adresse à demander à AbView (pas à abflow : la clé reste ici). */
  url: string
  orientation: Orientation | null
  largeur: number | null
  hauteur: number | null
}

const DUREE_CACHE = 10 * 60 * 1000
const PAR_PAGE = 200
const MAX_PAGES = 50 // 10 000 photos au plus : garde-fou

/** paysage au-delà de 15 % plus large que haut, portrait au-delà de 15 % plus haut que large. */
export function orientationDe(largeur: number | null, hauteur: number | null): Orientation | null {
  if (!largeur || !hauteur || largeur <= 0 || hauteur <= 0) return null
  const ratio = largeur / hauteur
  if (ratio > 1.15) return 'paysage'
  if (ratio < 0.87) return 'portrait'
  return 'carre'
}

/** Un nom de fichier sûr : jamais de chemin, jamais de fichier caché. */
export function nomValide(nom: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,200}$/.test(nom)
}

export default class PhotosService {
  private cache: { le: number; photos: Photo[] } | null = null

  private get base() {
    return (process.env.ABFLOW_URL || '').replace(/\/$/, '')
  }
  private get cle() {
    return process.env.ABFLOW_API_KEY || ''
  }

  get configure(): boolean {
    return !!this.base && !!this.cle
  }

  /** Toutes les photos de la bibliothèque (gardées dix minutes). En cas de panne d'abflow, la dernière liste connue. */
  async lister(): Promise<Photo[]> {
    if (!this.configure) return []
    if (this.cache && Date.now() - this.cache.le < DUREE_CACHE) return this.cache.photos
    try {
      const photos: Photo[] = []
      for (let page = 0; page < MAX_PAGES; page++) {
        const { data } = await axios.get(`${this.base}/api/images`, {
          headers: { 'X-API-Key': this.cle },
          params: { limit: PAR_PAGE, offset: page * PAR_PAGE },
          timeout: 10000,
        })
        const images: any[] = Array.isArray(data?.images) ? data.images : []
        for (const i of images) {
          if (typeof i?.filename !== 'string' || !nomValide(i.filename)) continue
          const largeur = Number(i.width) || null
          const hauteur = Number(i.height) || null
          photos.push({
            id: i.filename,
            url: `/photos/fichier/${i.filename}`,
            orientation: orientationDe(largeur, hauteur),
            largeur,
            hauteur,
          })
        }
        if (images.length < PAR_PAGE || photos.length >= (data?.total ?? 0)) break
      }
      this.cache = { le: Date.now(), photos }
      return photos
    } catch (e) {
      console.error('abflow : liste des photos indisponible', e instanceof Error ? e.message : e)
      return this.cache?.photos ?? []
    }
  }

  /**
   * Une photo par orientation demandée, tirées au hasard. Les photos déjà montrées (`exclure`) sont évitées
   * tant qu'il en reste d'autres. Une photo n'est jamais donnée deux fois dans la même réponse, sauf si la
   * bibliothèque n'en contient pas assez.
   */
  async aleatoires(
    orientations: Orientation[],
    exclure: string[] = [],
    hasard: () => number = Math.random
  ): Promise<Photo[]> {
    const toutes = await this.lister()
    const pris = new Set<string>()
    const resultat: Photo[] = []
    const tirer = (candidats: Photo[]) => candidats[Math.floor(hasard() * candidats.length)]

    for (const voulue of orientations) {
      const libres = (p: Photo) => !pris.has(p.id) && !exclure.includes(p.id)
      let choix =
        tirer(toutes.filter((p) => p.orientation === voulue && libres(p))) ??
        // pas d'autre photo de cette orientation : le même format d'abord, jamais l'orientation opposée
        tirer(toutes.filter((p) => p.orientation === voulue && !pris.has(p.id)))
      // un emplacement carré (cadre rond) se contente de n'importe quelle photo, recadrée au centre
      if (!choix && voulue === 'carre') {
        choix = tirer(toutes.filter(libres)) ?? tirer(toutes.filter((p) => !pris.has(p.id)))
      }
      if (choix) {
        pris.add(choix.id)
        resultat.push(choix)
      }
    }
    return resultat
  }

  /** Le fichier d'une photo, en flux, tel que le sert abflow. */
  async fichier(nom: string) {
    return axios.get(`${this.base}/uploads/${nom}`, {
      headers: { 'X-API-Key': this.cle },
      responseType: 'stream',
      timeout: 15000,
    })
  }
}
