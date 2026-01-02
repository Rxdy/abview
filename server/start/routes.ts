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
