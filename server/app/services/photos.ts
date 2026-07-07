import { google } from 'googleapis'
import { getPickerSessionId, savePickerSessionId } from './config_store.js'

export interface Photo {
  id: string
  url: string
  baseUrl: string
  title: string
  description: string
  location: string
  createdAt: string
  width: number
  height: number
}

export interface PickerSession {
  id: string
  pickerUri: string
  mediaItemsSet: boolean
}

export default class GooglePhotosService {
  private cachedPhotos: Photo[] = []
  private lastRefresh: number = 0
  private refreshInterval = 50 * 60 * 1000 // 50 minutes (Google baseUrls valid ~60 min)

  private async getAccessToken(): Promise<string> {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI!
    )
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      expiry_date: 0,
    })
    const { token } = await oauth2Client.getAccessToken()
    if (!token) throw new Error("Impossible d'obtenir un access token Google")
    return token
  }

  /**
   * Crée une nouvelle session Picker API.
   * L'utilisateur doit visiter pickerUri pour sélectionner ses photos.
   */
  async createPickerSession(): Promise<PickerSession> {
    const accessToken = await this.getAccessToken()
    const res = await fetch('https://photospicker.googleapis.com/v1/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Picker API createSession error: ${res.status} ${err}`)
    }
    const data = (await res.json()) as any
    return {
      id: data.id,
      pickerUri: data.pickerUri,
      mediaItemsSet: data.mediaItemsSet ?? false,
    }
  }

  /**
   * Vérifie l'état d'une session Picker.
   */
  async getPickerSession(sessionId: string): Promise<PickerSession> {
    const accessToken = await this.getAccessToken()
    const res = await fetch(`https://photospicker.googleapis.com/v1/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Picker API getSession error: ${res.status} ${err}`)
    }
    const data = (await res.json()) as any
    return {
      id: data.id,
      pickerUri: data.pickerUri,
      mediaItemsSet: data.mediaItemsSet ?? false,
    }
  }

  /**
   * Récupère les photos depuis une session Picker (après que l'utilisateur a sélectionné).
   */
  /**
   * Sauvegarde une nouvelle session ID et invalide le cache.
   * Appelé après que l'utilisateur a sélectionné ses photos via QR code.
   */
  setPickerSessionId(sessionId: string): void {
    savePickerSessionId(sessionId)
    this.cachedPhotos = []
    this.lastRefresh = 0
    console.log('🔄 Cache photos invalidé, nouvelle session:', sessionId)
  }

  private async fetchPhotos(): Promise<Photo[]> {
    const sessionId = getPickerSessionId()
    if (!sessionId) {
      console.warn(
        '⚠️ Aucune session Picker configurée. POST /photos/session pour créer une session.'
      )
      return []
    }

    const accessToken = await this.getAccessToken()
    const res = await fetch(
      `https://photospicker.googleapis.com/v1/mediaItems?sessionId=${sessionId}&pageSize=100`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!res.ok) {
      const errorText = await res.text()
      console.error(`❌ Google Photos Picker API error: ${res.status} ${res.statusText}`, errorText)
      throw new Error(`Google Photos Picker API error: ${res.status} ${res.statusText}`)
    }

    const data = (await res.json()) as any
    const items: any[] = data.mediaItems || []
    console.log(`✅ Google Photos Picker: ${items.length} photos récupérées`)

    const photos: Photo[] = items
      .filter(
        (item: any) => item.type === 'PHOTO' || item.mediaFile?.mimeType?.startsWith('image/')
      )
      .map((item: any) => ({
        id: item.id,
        url: `/photos/proxy?id=${encodeURIComponent(item.id)}`,
        baseUrl: item.mediaFile?.baseUrl || '',
        title: item.mediaFile?.filename || 'Photo',
        description: '',
        location: '',
        // N'afficher la date que si Google a de vraies métadonnées EXIF (cameraMake ou photoMetadata)
        createdAt:
          item.mediaFile?.mediaFileMetadata?.cameraMake ||
          item.mediaFile?.mediaFileMetadata?.photoMetadata
            ? item.createTime || ''
            : '',
        width: Number.parseInt(item.mediaFile?.mediaFileMetadata?.width || '1920'),
        height: Number.parseInt(item.mediaFile?.mediaFileMetadata?.height || '1080'),
      }))
      .filter((p) => p.url !== '')

    // Mélange aléatoire (Fisher-Yates)
    for (let i = photos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[photos[i], photos[j]] = [photos[j], photos[i]]
    }

    return photos
  }

  async getPhotos(): Promise<Photo[]> {
    const now = Date.now()
    // Vérifier si on a une session avant de tenter
    if (!getPickerSessionId()) return []
    if (now - this.lastRefresh > this.refreshInterval || this.cachedPhotos.length === 0) {
      try {
        this.cachedPhotos = await this.fetchPhotos()
        this.lastRefresh = now
      } catch (error) {
        console.error('❌ Erreur lors du chargement des photos Google:', error)
        this.cachedPhotos = []
      }
    }
    return this.cachedPhotos
  }
}
// Singleton partagé entre routes.ts et googleData.ts
export const photosService = new GooglePhotosService()
