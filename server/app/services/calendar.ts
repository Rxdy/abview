import { google } from 'googleapis'

export interface Event {
  id: string
  summary: string
  start: string
  end: string
  description: string
  location: string
}
export default class GoogleCalendarService {
  private calendar: any
  private cachedEvents: Event[] = []
  private lastRefresh: number = 0
  private refreshInterval = 5 * 60 * 1000 // 5 minutes en ms

  private async getAuthClient() {
    const client_id = process.env.GOOGLE_CLIENT_ID!
    const client_secret = process.env.GOOGLE_CLIENT_SECRET!
    const redirect_uri = process.env.GOOGLE_REDIRECT_URI!

    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri)

    // Injecter le token depuis Doppler ou fichier sécurisé si nécessaire
    oauth2Client.setCredentials({
      access_token: process.env.GOOGLE_ACCESS_TOKEN,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    })

    return oauth2Client
  }

  private async fetchEvents(calendarId = 'primary', maxResults = 100): Promise<Event[]> {
    if (!this.calendar) {
      const authClient = await this.getAuthClient()
      this.calendar = google.calendar({ version: 'v3', auth: authClient })
    }
    // Récupérer les événements des 8 prochains jours
    const now = new Date()
    const eightDaysLater = new Date(now)
    eightDaysLater.setDate(now.getDate() + 8)
    const res = await this.calendar.events.list({
      calendarId,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
      timeMin: now.toISOString(),
      timeMax: eightDaysLater.toISOString(),
    })
    return (res.data.items || []).map((e: any) => ({
      id: e.id,
      summary: e.summary || '',
      start: e.start?.dateTime || e.start?.date || '',
      end: e.end?.dateTime || e.end?.date || '',
      description: e.description || '',
      location: e.location || '',
    }))
  }

  private async fetchPastYearEvents(calendarId = 'primary', maxResults = 1000): Promise<Event[]> {
    if (!this.calendar) {
      const authClient = await this.getAuthClient()
      this.calendar = google.calendar({ version: 'v3', auth: authClient })
    }
    // Récupérer les événements de l'année passée
    const now = new Date()
    const oneYearAgo = new Date(now)
    oneYearAgo.setFullYear(now.getFullYear() - 1)
    const res = await this.calendar.events.list({
      calendarId,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
      timeMin: oneYearAgo.toISOString(),
      timeMax: now.toISOString(),
    })
    return (res.data.items || []).map((e: any) => ({
      id: e.id,
      summary: e.summary || '',
      start: e.start?.dateTime || e.start?.date || '',
      end: e.end?.dateTime || e.end?.date || '',
      description: e.description || '',
      location: e.location || '',
    }))
  }

  async listEvents(calendarId = 'primary', maxResults = 100): Promise<Event[]> {
    const now = Date.now()
    if (now - this.lastRefresh > this.refreshInterval || this.cachedEvents.length === 0) {
      this.cachedEvents = await this.fetchEvents(calendarId, maxResults)
      this.lastRefresh = now
    }
    return this.cachedEvents
  }

  async listPastYearEvents(calendarId = 'primary', maxResults = 1000): Promise<Event[]> {
    // Pas de cache pour les événements passés, toujours fetcher
    return await this.fetchPastYearEvents(calendarId, maxResults)
  }

  getLastRefresh(): Date | null {
    return this.lastRefresh ? new Date(this.lastRefresh) : null
  }
}
