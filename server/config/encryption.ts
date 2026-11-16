import env from '#start/env'
import { defineConfig, drivers } from '@adonisjs/core/encryption'

/**
 * Chiffrement (obligatoire depuis AdonisJS 7). Pilote « legacy » : même format qu'AdonisJS 6 (AES-256-CBC avec APP_KEY),
 * donc tout ce qui aurait été chiffré avant la migration reste lisible.
 */
const encryptionConfig = defineConfig({
  default: 'legacy',
  list: {
    legacy: drivers.legacy({
      keys: [env.get('APP_KEY')],
    }),
  },
})

export default encryptionConfig
