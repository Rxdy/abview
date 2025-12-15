import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'
import WeatherService from '#services/weather'

/**
 * Error handler
 */
server.errorHandler(() => import('#exceptions/handler'))

/**
 * Global server middleware
 */
server.use([
  () => import('#middleware/container_bindings_middleware'),
  () => import('#middleware/force_json_response_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
])

/**
 * Router middleware
 */
router.use([() => import('@adonisjs/core/bodyparser_middleware')])

/**
 * Named middleware
 */
export const middleware = router.named({})

/**
 * Start weather service auto-refresh
 */
WeatherService.startRefresh()
