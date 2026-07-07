import type { HttpContext } from '@adonisjs/core/http'
import { OAuth2Client } from 'google-auth-library'

export default class OauthController {
  private oauth2Client: OAuth2Client

  constructor() {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI!
    )
  }

  public redirectToGoogle({ response }: HttpContext) {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/tasks.readonly',
    ]

    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    })

    return response.redirect(url)
  }

  public async handleGoogleCallback({ request, response }: HttpContext) {
    const code = request.input('code')

    if (!code) return response.status(400).send('Code manquant dans la requête')

    try {
      const { tokens } = await this.oauth2Client.getToken(code)
      this.oauth2Client.setCredentials(tokens)

      console.log('Copie ces tokens dans Doppler :', JSON.stringify(tokens, null, 2))

      return response.send('Token récupéré ! Copie-le dans Doppler pour sécuriser ton projet.')
    } catch (error) {
      console.error(error)
      return response.status(500).send('Erreur lors de la récupération du token')
    }
  }
}
