import router from '@adonisjs/core/services/router'
import WeatherController from '#controllers/weather'
import GoogleDataController from '#controllers/googleData'
import HorairesController from '#controllers/horaires'
import LogsController from '#controllers/logs'

const googleDataController = new GoogleDataController()
const horairesController = new HorairesController()
const logsController = new LogsController()

// État global pour le timer de progression
let progressCycleStart = Date.now();
const PROGRESS_CYCLE_DURATION = 5 * 60 * 1000; // 5 minutes pour les appels aux APIs externes

// Last refresh global pour tous les services (mis à jour quand un service fait un vrai refresh)
let globalLastRefresh = new Date().toISOString();

// Fonction pour mettre à jour le lastRefresh global
const updateGlobalLastRefresh = () => {
  globalLastRefresh = new Date().toISOString();
  console.log('Global lastRefresh updated:', globalLastRefresh);
};

// Vérifier et reset le cycle si nécessaire (appelé à chaque requête)
const checkAndResetCycle = () => {
  const now = Date.now();
  const elapsed = now - progressCycleStart;
  
  // Si le cycle est terminé, recommencer un nouveau cycle
  if (elapsed >= PROGRESS_CYCLE_DURATION) {
    progressCycleStart = now - (elapsed % PROGRESS_CYCLE_DURATION);
    console.log('Cycle de progression reset côté serveur');
  }
  
  return progressCycleStart;
};

router.get('/', async () => {
  return { hello: 'world' }
})

router.get('/weather', [WeatherController, 'getWeather'])
router.get('/calendar', googleDataController.getCalendarEvents.bind(googleDataController))
router.get('/calendar/past-year', googleDataController.getPastYearCalendarEvents.bind(googleDataController))
router.get('/stats/past-year', googleDataController.getPastYearStats.bind(googleDataController))
router.get('/stats/weather/past-year', googleDataController.getPastYearWeatherStats.bind(googleDataController))
router.get('/tasks', googleDataController.getTasks.bind(googleDataController))
router.patch('/tasks/:id', googleDataController.updateTask.bind(googleDataController))
router.get('/horaires', horairesController.getHoraires.bind(horairesController))
router.get('/recap', googleDataController.getRecapData.bind(googleDataController))
router.get('/photos', googleDataController.getPhotos.bind(googleDataController))
router.post('/photos/session', googleDataController.createPickerSession.bind(googleDataController))
router.get('/photos/session/:sessionId', googleDataController.getPickerSessionStatus.bind(googleDataController))

// Proxy pour servir les images Google Photos (avec conversion HEIC)
router.get('/photos/proxy', async ({ request, response }) => {
  const id = request.qs().id as string
  if (!id) {
    return response.status(400).send('ID invalide')
  }
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
      access_token: process.env.GOOGLE_ACCESS_TOKEN,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    })
    const token = (await oauth2Client.getAccessToken()).token
    if (!token) return response.status(500).send('Token invalide')

    const sessionId = process.env.GOOGLE_PICKER_SESSION_ID
    const itemsRes = await fetch(
      `https://photospicker.googleapis.com/v1/mediaItems?sessionId=${sessionId}&pageSize=100`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!itemsRes.ok) return response.status(502).send('Picker API error')
    const data = (await itemsRes.json()) as any
    const item = (data.mediaItems || []).find((m: any) => m.id === id)
    if (!item?.mediaFile?.baseUrl) return response.status(404).send('Photo non trouvée')

    const imageUrl = item.mediaFile.baseUrl + '=w1920-h1080'
    const imgRes = await fetch(imageUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!imgRes.ok) {
      console.log('Google image error:', imgRes.status, imageUrl.substring(0, 80))
      return response.status(imgRes.status).send('Erreur image')
    }
    
    let buffer = await imgRes.arrayBuffer()
    let contentType = imgRes.headers.get('content-type') || 'image/jpeg'
    
    // Convertir HEIC en JPEG si nécessaire
    if (contentType === 'image/heic' || contentType === 'image/heif') {
      try {
        const heicBuffer = Buffer.from(buffer)
        const jpegBuffer = await (heic.default as any)({
          blob: heicBuffer,
          toType: 'image/jpeg',
          quality: 0.9,
        })
        buffer = jpegBuffer
        contentType = 'image/jpeg'
      } catch (convertError) {
        console.error('HEIC conversion error:', convertError)
        buffer = await sharp.default(Buffer.from(buffer)).jpeg({ quality: 90 }).toBuffer()
        contentType = 'image/jpeg'
      }
    }
    
    response.header('Content-Type', contentType)
    response.header('Cache-Control', 'public, max-age=60')
    response.header('Access-Control-Allow-Origin', '*')
    return response.send(Buffer.from(buffer))
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
      access_token: process.env.GOOGLE_ACCESS_TOKEN,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    })
    const token = (await oauth2Client.getAccessToken()).token
    if (!token) return response.status(500).send('Token invalide')

    const sessionId = process.env.GOOGLE_PICKER_SESSION_ID
    const itemsRes = await fetch(
      `https://photospicker.googleapis.com/v1/mediaItems?sessionId=${sessionId}&pageSize=100`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!itemsRes.ok) return response.status(502).send('Picker API error')
    const data = (await itemsRes.json()) as any
    const item = (data.mediaItems || []).find((m: any) => m.id === id)
    if (!item?.mediaFile?.baseUrl) return response.status(404).send('Photo non trouvée')

    const imageUrl = item.mediaFile.baseUrl + '=w1920-h1080'
    const imgRes = await fetch(imageUrl, { headers: { Authorization: `Bearer ${token}` } })
    if (!imgRes.ok) return response.status(imgRes.status).send('Erreur image')
    
    // Extraire métadonnées EXIF AVANT conversion
    let buffer = Buffer.from(await imgRes.arrayBuffer())
    let contentType = imgRes.headers.get('content-type') || 'image/jpeg'
    let originalMetadata = await sharp.default(buffer).metadata()
    const exifDateTime = originalMetadata.exif?.DateTime
    
    // Convertir HEIC en JPEG si nécessaire
    if (contentType === 'image/heic' || contentType === 'image/heif') {
      try {
        const heicBuffer = Buffer.from(buffer)
        buffer = await (heic.default as any)({
          blob: heicBuffer,
          toType: 'image/jpeg',
          quality: 0.9,
        })
        // Réajouter l'EXIF après conversion HEIC → JPEG
        if (exifDateTime) {
          buffer = await sharp.default(Buffer.from(buffer))
            .withExif({
              IFD0: { DateTime: exifDateTime },
            })
            .jpeg({ quality: 90 })
            .toBuffer()
        }
      } catch {
        buffer = await sharp.default(Buffer.from(buffer)).jpeg({ quality: 90 }).toBuffer()
      }
    }

    // Extraire métadonnées EXIF avec Sharp
    const metadata = await sharp.default(Buffer.from(buffer)).metadata()
    let exifDate = null
    
    if (metadata.exif?.DateTime) {
      // Format EXIF: "YYYY:MM:DD HH:MM:SS" → ISO 8601
      const exifStr = metadata.exif.DateTime
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
  response.header('Access-Control-Allow-Origin', '*');
  return response.json({ globalLastRefresh });
})

router.get('/progress/sync', async ({ response }) => {
  try {
    checkAndResetCycle(); // Vérifier et reset si nécessaire
    const now = Date.now();
    const elapsed = now - progressCycleStart;

    const data = {
      serverTime: now,
      startTime: progressCycleStart,
      totalTime: PROGRESS_CYCLE_DURATION,
      elapsed: elapsed,
      progress: Math.min((elapsed / PROGRESS_CYCLE_DURATION) * 100, 100)
    };

    // Headers CORS explicites
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    console.log('Progress sync response:', data);
    return response.json(data);
  } catch (error) {
    console.error('Erreur dans /progress/sync:', error);
    
    // Headers CORS même en cas d'erreur
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response.status(500).json({ error: 'Internal server error' });
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
export { globalLastRefresh, updateGlobalLastRefresh };
