import router from '@adonisjs/core/services/router'
import WeatherController from '#controllers/weather'
import GoogleDataController from '#controllers/googleData'
import HorairesController from '#controllers/horaires'

const googleDataController = new GoogleDataController()
const horairesController = new HorairesController()

router.get('/', async () => {
  return { hello: 'world' }
})

router.get('/weather', [WeatherController, 'getWeather'])
router.get('/calendar', googleDataController.getCalendarEvents.bind(googleDataController))
router.get('/tasks', googleDataController.getTasks.bind(googleDataController))
router.get('/horaires', horairesController.getHoraires.bind(horairesController))

// Nouvelle route temporaire pour capturer le code d'autorisation OAuth
router.get('/oauth2callback', async ({ request, response }) => {
  const code = request.input('code')
  if (code) {
    return response.send(`Code d'autorisation : ${code}`)
  }
  return response.status(400).send("Aucun code d'autorisation fourni")
})
