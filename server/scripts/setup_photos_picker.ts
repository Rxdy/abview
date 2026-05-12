/**
 * Script de configuration de la session Google Photos Picker.
 *
 * Usage: doppler run --project abview --config dev -- node server/scripts/setup_photos_picker.ts
 *
 * Ce script:
 * 1. Crée une session Picker API
 * 2. Affiche l'URL à visiter pour sélectionner les photos
 * 3. Attend que la sélection soit faite
 * 4. Sauvegarde le sessionId dans Doppler
 */
import { google } from 'googleapis'
import { execSync } from 'child_process'

async function getAccessToken(): Promise<string> {
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
  if (!token) throw new Error("Impossible d'obtenir un access token")
  return token
}

async function createSession(accessToken: string): Promise<{ id: string; pickerUri: string }> {
  const res = await fetch('https://photospicker.googleapis.com/v1/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Picker API error: ${res.status} ${err}`)
  }
  const data = (await res.json()) as any
  return { id: data.id, pickerUri: data.pickerUri }
}

async function pollSession(
  sessionId: string,
  accessToken: string
): Promise<boolean> {
  const res = await fetch(`https://photospicker.googleapis.com/v1/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return false
  const data = (await res.json()) as any
  return data.mediaItemsSet === true
}

async function main() {
  console.log('=== Setup Google Photos Picker ===\n')

  const accessToken = await getAccessToken()
  console.log('✅ Token obtenu')

  const session = await createSession(accessToken)
  console.log('\n📸 Session Picker créée!')
  console.log(`\n➡️  Visitez cette URL pour sélectionner vos photos:\n   ${session.pickerUri}\n`)
  console.log('   (Vous pouvez aussi partager cette URL sur votre téléphone)\n')
  console.log('Attente de la sélection des photos...')

  // Polling jusqu'à ce que l'utilisateur ait sélectionné ses photos
  let selected = false
  let attempts = 0
  while (!selected && attempts < 120) {
    await new Promise((r) => setTimeout(r, 5000)) // 5 secondes entre chaque check
    attempts++
    try {
      selected = await pollSession(session.id, accessToken)
      if (selected) {
        console.log('\n✅ Photos sélectionnées!')
      } else {
        process.stdout.write('.')
      }
    } catch (e) {
      // Ignorer les erreurs de polling temporaires
    }
  }

  if (!selected) {
    console.error('\n❌ Timeout: aucune sélection après 10 minutes')
    process.exit(1)
  }

  console.log(`\nSauvegarde de GOOGLE_PICKER_SESSION_ID dans Doppler...`)
  try {
    execSync(
      `doppler secrets set GOOGLE_PICKER_SESSION_ID=${session.id} --project abview --config dev`,
      { stdio: 'inherit' }
    )
    console.log('✅ GOOGLE_PICKER_SESSION_ID sauvegardé dans Doppler')
  } catch (e: any) {
    console.error('❌ Erreur Doppler:', e.message)
    console.log(`\n⚠️  Ajoutez manuellement dans Doppler:\n   GOOGLE_PICKER_SESSION_ID=${session.id}`)
  }

  console.log('\n=== Configuration terminée! ===')
  console.log('Redémarrez les conteneurs Docker pour appliquer les changements.')
}

main().catch(console.error)
