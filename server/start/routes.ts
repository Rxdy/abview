import router from '@adonisjs/core/services/router'
import WeatherController from '#controllers/weather'
import GoogleDataController from '#controllers/googleData'
import HorairesController from '#controllers/horaires'
import LogsController from '#controllers/logs'

const googleDataController = new GoogleDataController()
const horairesController = new HorairesController()
const logsController = new LogsController()

// État global pour le timer de progression (simple pour cet exemple)
let progressCycleStart = Date.now();
const PROGRESS_CYCLE_DURATION = 5 * 60 * 1000; // 5 minutes

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

// Routes pour les logs
router.get('/logs', logsController.getLogs.bind(logsController))
router.get('/logs/:category', logsController.getLogs.bind(logsController))
router.post('/logs', logsController.createLog.bind(logsController))
router.get('/logs-files', logsController.getLogFiles.bind(logsController))

// Route pour la synchronisation du temps (timer dashboard)
router.get('/time', async ({ response }) => {
  response.header('Content-Type', 'application/json')
  return { serverTime: Date.now() }
})

// Route pour la synchronisation du timer de progression
router.get('/progress/sync', async ({ response }) => {
  try {
    const now = Date.now();
    const elapsed = now - progressCycleStart;

    // Si le cycle est terminé, recommencer un nouveau cycle
    if (elapsed >= PROGRESS_CYCLE_DURATION) {
      progressCycleStart = now;
      console.log('Nouveau cycle de progression démarré côté serveur');
    }

    const data = {
      serverTime: now,
      startTime: progressCycleStart,
      totalTime: PROGRESS_CYCLE_DURATION
    };

    console.log('Progress sync response:', data);
    return response.json(data);
  } catch (error) {
    console.error('Erreur dans /progress/sync:', error);
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
