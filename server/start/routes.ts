import router from '@adonisjs/core/services/router'
const WeatherController = () => import('#controllers/weather')
import GoogleDataController from '#controllers/google_data'
import HorairesController from '#controllers/horaires'
import LogsController from '#controllers/logs'
import { photosService } from '#services/photos'

const googleDataController = new GoogleDataController()
const horairesController = new HorairesController()
const logsController = new LogsController()

// État global pour le timer de progression
let progressCycleStart = Date.now()
const PROGRESS_CYCLE_DURATION = 5 * 60 * 1000 // 5 minutes pour les appels aux APIs externes

// Last refresh global pour tous les services (mis à jour quand un service fait un vrai refresh)
let globalLastRefresh = new Date().toISOString()

// Fonction pour mettre à jour le lastRefresh global
const updateGlobalLastRefresh = () => {
  globalLastRefresh = new Date().toISOString()
  console.log('Global lastRefresh updated:', globalLastRefresh)
}

// Vérifier et reset le cycle si nécessaire (appelé à chaque requête)
const checkAndResetCycle = () => {
  const now = Date.now()
  const elapsed = now - progressCycleStart

  // Si le cycle est terminé, recommencer un nouveau cycle
  if (elapsed >= PROGRESS_CYCLE_DURATION) {
    progressCycleStart = now - (elapsed % PROGRESS_CYCLE_DURATION)
    console.log('Cycle de progression reset côté serveur')
  }

  return progressCycleStart
}

router.get('/', async () => {
  return { hello: 'world' }
})

router.get('/weather', [WeatherController, 'getWeather'])
router.get('/calendar', googleDataController.getCalendarEvents.bind(googleDataController))
router.get(
  '/calendar/past-year',
  googleDataController.getPastYearCalendarEvents.bind(googleDataController)
)
router.get('/stats/past-year', googleDataController.getPastYearStats.bind(googleDataController))
router.get(
  '/stats/weather/past-year',
  googleDataController.getPastYearWeatherStats.bind(googleDataController)
)
router.get('/tasks', googleDataController.getTasks.bind(googleDataController))
router.patch('/tasks/:id', googleDataController.updateTask.bind(googleDataController))
router.get('/horaires', horairesController.getHoraires.bind(horairesController))
router.get('/recap', googleDataController.getRecapData.bind(googleDataController))
router.get('/photos', googleDataController.getPhotos.bind(googleDataController))
router.post('/photos/session', googleDataController.createPickerSession.bind(googleDataController))
router.post(
  '/photos/session/confirm',
  googleDataController.confirmPickerSession.bind(googleDataController)
)
router.get(
  '/photos/session/:sessionId',
  googleDataController.getPickerSessionStatus.bind(googleDataController)
)

// Proxy pour servir les images Google Photos (avec conversion HEIC)
router.get('/photos/proxy', async ({ request, response }) => {
  const id = request.qs().id as string
  if (!id) {
    return response.status(400).send('ID invalide')
  }
  try {
    const sharp = await import('sharp')
    const heic = await import('heic-convert')

    // Utiliser le cache du service plutôt que de re-fetch l'API Picker à chaque image
    const photos = await photosService.getPhotos()
    const photo = photos.find((p) => p.id === id)
    if (!photo?.baseUrl) {
      return response.status(404).send('Photo non trouvée')
    }

    const imageUrl = photo.baseUrl + '=w1920-h1080'
    // Les baseUrls Google sont des URLs signées — pas besoin d'Authorization header
    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) {
      console.log('Google image error:', imgRes.status, imageUrl.substring(0, 80))
      return response.status(imgRes.status).send('Erreur image')
    }

    let arrayBuffer = await imgRes.arrayBuffer()
    let buffer: Buffer = Buffer.from(arrayBuffer as ArrayBuffer)
    let contentType = imgRes.headers.get('content-type') || 'image/jpeg'

    // Convertir HEIC en JPEG si nécessaire
    if (contentType === 'image/heic' || contentType === 'image/heif') {
      try {
        const jpegBuffer = await (heic.default as any)({
          blob: buffer,
          toType: 'image/jpeg',
          quality: 0.9,
        })
        buffer = Buffer.from(jpegBuffer)
        contentType = 'image/jpeg'
      } catch (convertError) {
        console.error('HEIC conversion error:', convertError)
        buffer = await sharp.default(buffer).jpeg({ quality: 90 }).toBuffer()
        contentType = 'image/jpeg'
      }
    }

    response.header('Content-Type', contentType)
    response.header('Cache-Control', 'public, max-age=3600')
    response.header('Access-Control-Allow-Origin', '*')
    return response.send(buffer)
  } catch (e) {
    console.error('Proxy error:', e)
    return response.status(500).send('Erreur proxy')
  }
})

// Endpoint pour récupérer les métadonnées EXIF (vraie date de prise)
router.get('/photos/:id/metadata', async ({ params, response }) => {
  const id = params.id as string
  if (!id) return response.status(400).send('ID invalide')
  try {
    const { google } = await import('googleapis')
    const sharp = await import('sharp')
    const heic = await import('heic-convert')

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
    if (!token) return response.status(500).send('Token invalide')

    // Utiliser la Google Photos Library API
    const itemsRes = await fetch(
      'https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=100',
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!itemsRes.ok) return response.status(502).send('Library API error')
    const data = (await itemsRes.json()) as any
    const item = (data.mediaItems || []).find((m: any) => m.id === id)
    if (!item?.baseUrl) return response.status(404).send('Photo non trouvée')

    const imageUrl = item.baseUrl + '=w1920-h1080'
    const imgRes = await fetch(imageUrl, { headers: { Authorization: `Bearer ${token}` } })
    if (!imgRes.ok) return response.status(imgRes.status).send('Erreur image')

    // Extraire métadonnées EXIF AVANT conversion
    let arrayBuffer2 = await imgRes.arrayBuffer()
    let buffer: Buffer = Buffer.from(arrayBuffer2 as ArrayBuffer)
    let contentType = imgRes.headers.get('content-type') || 'image/jpeg'
    let originalMetadata = await sharp.default(buffer).metadata()
    // NOTE: sharp retourne `exif` en Buffer brut (non parsé), pas un objet avec
    // `.DateTime` — cette extraction n'a jamais été fonctionnelle. Cast conservé
    // tel quel (comportement inchangé) faute de lib de parsing EXIF (ex. exifr).
    const exifDateTime = (originalMetadata.exif as any)?.DateTime as string | undefined

    // Convertir HEIC en JPEG si nécessaire
    if (contentType === 'image/heic' || contentType === 'image/heif') {
      try {
        const jpegResult = await (heic.default as any)({
          blob: buffer,
          toType: 'image/jpeg',
          quality: 0.9,
        })
        buffer = Buffer.from(jpegResult) as Buffer
        // Réajouter l'EXIF après conversion HEIC → JPEG
        if (exifDateTime) {
          buffer = (await sharp
            .default(buffer)
            .withExif({
              IFD0: { DateTime: exifDateTime },
            })
            .jpeg({ quality: 90 })
            .toBuffer()) as Buffer
        }
      } catch {
        buffer = (await sharp.default(buffer).jpeg({ quality: 90 }).toBuffer()) as Buffer
      }
    }

    // Extraire métadonnées EXIF avec Sharp
    const metadata = await sharp.default(buffer).metadata()
    let exifDate = null

    const metadataExif = metadata.exif as any
    if (metadataExif?.DateTime) {
      // Format EXIF: "YYYY:MM:DD HH:MM:SS" → ISO 8601
      const exifStr = metadataExif.DateTime as string
      const match = exifStr.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/)
      if (match) {
        exifDate = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`
      }
    }

    return response.json({ createdAt: exifDate })
  } catch (e) {
    console.error('Metadata error:', e)
    return response.status(500).json({ createdAt: null })
  }
})

// Routes pour les logs
router.get('/logs', logsController.getLogs.bind(logsController))
router.get('/logs/:category', logsController.getLogs.bind(logsController))
router.post('/logs', logsController.createLog.bind(logsController))
router.get('/logs-files', logsController.getLogFiles.bind(logsController))

// Route de debug pour voir globalLastRefresh
router.get('/debug/last-refresh', async ({ response }) => {
  response.header('Access-Control-Allow-Origin', '*')
  return response.json({ globalLastRefresh })
})

router.get('/progress/sync', async ({ response }) => {
  try {
    checkAndResetCycle() // Vérifier et reset si nécessaire
    const now = Date.now()
    const elapsed = now - progressCycleStart

    const data = {
      serverTime: now,
      startTime: progressCycleStart,
      totalTime: PROGRESS_CYCLE_DURATION,
      elapsed: elapsed,
      progress: Math.min((elapsed / PROGRESS_CYCLE_DURATION) * 100, 100),
    }

    // Headers CORS explicites
    response.header('Access-Control-Allow-Origin', '*')
    response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    console.log('Progress sync response:', data)
    return response.json(data)
  } catch (error) {
    console.error('Erreur dans /progress/sync:', error)

    // Headers CORS même en cas d'erreur
    response.header('Access-Control-Allow-Origin', '*')
    response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    return response.status(500).json({ error: 'Internal server error' })
  }
})

// Nouvelle route temporaire pour capturer le code d'autorisation OAuth
router.get('/oauth2callback', async ({ request, response }) => {
  const code = request.input('code')
  if (code) {
    return response.send(`Code d'autorisation : ${code}`)
  }
  return response.status(400).send("Aucun code d'autorisation fourni")
})

// Exports pour les contrôleurs
export { globalLastRefresh, updateGlobalLastRefresh }
