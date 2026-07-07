import { createInterface } from 'node:readline/promises'
import { google } from 'googleapis'
import { execSync } from 'node:child_process'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/tasks.readonly',
  'https://www.googleapis.com/auth/photospicker.mediaitems.readonly',
]

async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI

  console.log('GOOGLE_CLIENT_ID:', clientId)
  console.log('GOOGLE_CLIENT_SECRET:', clientSecret)
  console.log('GOOGLE_REDIRECT_URI:', redirectUri)

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('Erreur : Une ou plusieurs variables d’environnement manquent.')
    process.exit(1)
  }

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  })

  console.log('Autorise cette app en visitant cette URL :', authUrl)

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const code = await rl.question('Entre le code ici : ')
  rl.close()

  try {
    const { tokens } = await oAuth2Client.getToken(code)

    // Afficher les scopes du token
    console.log('\n=== TOKEN OBTENU ===')
    console.log('Scopes inclus:', tokens.scope || 'AUCUN!')
    console.log('Type:', tokens.token_type)
    console.log(
      'Expiration:',
      tokens.expiry_date ? new Date(tokens.expiry_date).toLocaleString() : 'N/A'
    )
    console.log('===========================\n')

    if (tokens.refresh_token) {
      try {
        console.log('Mise à jour de GOOGLE_REFRESH_TOKEN dans Doppler...')
        execSync(
          `doppler secrets set GOOGLE_REFRESH_TOKEN=${tokens.refresh_token} --project abview --config dev`,
          { stdio: 'inherit' }
        )
        console.log('✅ GOOGLE_REFRESH_TOKEN mis à jour dans Doppler')
        if (tokens.access_token) {
          execSync(
            `doppler secrets set GOOGLE_ACCESS_TOKEN=${tokens.access_token} --project abview --config dev`,
            { stdio: 'inherit' }
          )
          console.log('✅ GOOGLE_ACCESS_TOKEN mis à jour dans Doppler')
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour de Doppler:', (error as Error).message)
      }
    } else {
      console.warn('Aucun refresh_token généré, Doppler non mis à jour.')
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des jetons:', (error as Error).message)
    process.exit(1)
  }
}

main().catch(console.error)
