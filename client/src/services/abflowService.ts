import type { Photo } from './calendarService'

const ABFLOW_URL = (import.meta.env.VITE_ABFLOW_URL as string || '').replace(/\/$/, '')
const ABFLOW_KEY = import.meta.env.VITE_ABFLOW_API_KEY as string || ''

interface AbFlowImage {
  filename: string
  url: string
  uploadedAt: number
  size: number
  fileType: string
}

function cleanFilename(filename: string): string {
  return filename.replace(/^\d+-[a-f0-9]+-/, '').replace(/\.[^.]+$/, '')
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const abflowService = {
  isConfigured(): boolean {
    return Boolean(ABFLOW_URL && ABFLOW_KEY)
  },

  async getPhotos(): Promise<Photo[]> {
    const res = await fetch(
      `${ABFLOW_URL}/api/images?type=image&limit=200`,
      { headers: { 'X-API-Key': ABFLOW_KEY } },
    )
    if (!res.ok) throw new Error(`AbFlow /api/images error: ${res.status}`)
    const data = (await res.json()) as { images: AbFlowImage[] }

    const photos: Photo[] = (data.images || []).map(img => ({
      id: img.filename,
      // URL directe avec ?key= pour que <img src> fonctionne sans header custom
      url: `${ABFLOW_URL}${img.url}?key=${encodeURIComponent(ABFLOW_KEY)}`,
      title: cleanFilename(img.filename),
      description: '',
      location: '',
      createdAt: img.uploadedAt ? new Date(img.uploadedAt).toISOString() : '',
      width: 1920,
      height: 1080,
    }))

    return shuffle(photos)
  },
}
