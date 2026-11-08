import axios from 'axios'
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

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
/**
 * Les photos de la bibliothèque sont des originaux de téléphone (jusqu'à 5712 × 4284 et 12 Mo) : les envoyer tels
 * quels à l'écran du Raspberry Pi, qui en décode sept à la fois, le sature (charge de 30, redémarrages). On les
 * réduit donc à COTE_MAX pixels sur le grand côté, une seule fois, et on garde le résultat sur disque.
 */
const COTE_MAX = 1600
const QUALITE_JPEG = 82
/** Réductions en parallèle : une seule, pour ne pas peser sur le Pi (et dans les 384 Mo du conteneur). */
const REDUCTIONS_SIMULTANEES = 1
sharp.cache(false)
sharp.concurrency(1)
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

/** Une photo prête à être envoyée à l'écran. */
export interface FichierAffichable {
  contentType: string
  corps: Buffer
}

async function enTampon(flux: NodeJS.ReadableStream): Promise<Buffer> {
  const morceaux: Buffer[] = []
  for await (const m of flux) morceaux.push(Buffer.isBuffer(m) ? m : Buffer.from(m as string))
  return Buffer.concat(morceaux)
}

export default class PhotosService {
  private cache: { le: number; photos: Photo[] } | null = null
  private reductionsEnCours = new Map<string, Promise<FichierAffichable>>()
  private reductionsActives = 0
  private reductionsEnAttente: Array<() => void> = []

  /** Où sont gardées les photos réduites : dans le volume des données, donc conservées entre deux mises à jour. */
  private get dossierCache() {
    return path.join(process.env.DONNEES_DIR || path.join(process.cwd(), 'donnees'), 'cache-photos')
  }

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

  /**
   * La photo réduite à COTE_MAX pixels (JPEG), prête pour l'écran. Réduite une seule fois puis lue sur disque ;
   * deux demandes simultanées de la même photo n'en font qu'une. Un fichier que sharp ne sait pas lire est rendu
   * tel que l'envoie abflow.
   */
  async fichierAffichable(nom: string): Promise<FichierAffichable> {
    const chemin = path.join(this.dossierCache, `${nom}.${COTE_MAX}.jpg`)
    try {
      return { contentType: 'image/jpeg', corps: await fs.promises.readFile(chemin) }
    } catch {
      /* pas encore réduite */
    }
    const enCours = this.reductionsEnCours.get(nom)
    if (enCours) return enCours
    const travail = this.enFile(() => this.reduire(nom, chemin)).finally(() =>
      this.reductionsEnCours.delete(nom)
    )
    this.reductionsEnCours.set(nom, travail)
    return travail
  }

  private async enFile<T>(travail: () => Promise<T>): Promise<T> {
    while (this.reductionsActives >= REDUCTIONS_SIMULTANEES) {
      await new Promise<void>((suite) => this.reductionsEnAttente.push(suite))
    }
    this.reductionsActives++
    try {
      return await travail()
    } finally {
      this.reductionsActives--
      this.reductionsEnAttente.shift()?.()
    }
  }

  private async reduire(nom: string, chemin: string): Promise<FichierAffichable> {
    const amont = await this.fichier(nom)
    const original = await enTampon(amont.data)
    const contentType = String(amont.headers['content-type'] || 'application/octet-stream')
    try {
      const corps = await sharp(original, { limitInputPixels: 120_000_000 })
        .rotate() // applique l'orientation EXIF : le navigateur le ferait aussi, la photo réduite n'en a plus besoin
        .resize({ width: COTE_MAX, height: COTE_MAX, fit: 'inside', withoutEnlargement: true })
        .flatten({ background: '#ffffff' }) // un PNG transparent ne devient pas noir en JPEG
        .jpeg({ quality: QUALITE_JPEG })
        .toBuffer()
      try {
        await fs.promises.mkdir(path.dirname(chemin), { recursive: true })
        const temporaire = `${chemin}.${process.pid}.tmp`
        await fs.promises.writeFile(temporaire, corps)
        await fs.promises.rename(temporaire, chemin)
      } catch {
        /* disque plein ou en lecture seule : on sert la photo réduite sans la garder */
      }
      return { contentType: 'image/jpeg', corps }
    } catch {
      return { contentType, corps: original }
    }
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
