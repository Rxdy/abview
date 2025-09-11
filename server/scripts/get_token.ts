import { createInterface } from 'readline/promises'
import { google } from 'googleapis'
import { execSync } from 'child_process'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/tasks.readonly',
]

async function main() {
  const client_id = process.env.GOOGLE_CLIENT_ID
  const client_secret = process.env.GOOGLE_CLIENT_SECRET
  const redirect_uri = process.env.GOOGLE_REDIRECT_URI

  console.log('GOOGLE_CLIENT_ID:', client_id)
  console.log('GOOGLE_CLIENT_SECRET:', client_secret)
  console.log('GOOGLE_REDIRECT_URI:', redirect_uri)

  if (!client_id || !client_secret || !redirect_uri) {
    console.error('Erreur : Une ou plusieurs variables d’environnement manquent.')
    process.exit(1)
  }

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri)

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
        console.error('Erreur lors de la mise à jour de Doppler:', error.message)
      }
    } else {
      console.warn('Aucun refresh_token généré, Doppler non mis à jour.')
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des jetons:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)
