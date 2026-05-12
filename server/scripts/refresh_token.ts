import { google } from 'googleapis'
import { execSync } from 'child_process'

async function refreshAccessToken() {
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
  const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    console.error('❌ Manquent: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN')
    process.exit(1)
  }

  console.log('🔄 Rafraîchissement du token Google...')
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET)
  oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN })

  try {
    const { token } = await oauth2Client.getAccessToken()
    if (!token) throw new Error('Impossible d\'obtenir le token')

    console.log('✅ Nouveau token obtenu')
    console.log('Token:', token.substring(0, 50) + '...')

    // Mettre à jour Doppler
    try {
      execSync(
        `doppler secrets set GOOGLE_ACCESS_TOKEN="${token}" --project abview --config dev`,
        { stdio: 'inherit' }
      )
      console.log('✅ Token sauvegardé dans Doppler')
    } catch (e) {
      console.error('⚠️ Erreur Doppler (mais token obtenu):', e)
    }
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

refreshAccessToken()
