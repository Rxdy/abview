import { test } from '@japa/runner'
import { google } from 'googleapis'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import GooglePhotosService from '#services/photos'
import { savePickerSessionId } from '#services/config_store'

class FakeOAuth2 {
  setCredentials() {}
  async getAccessToken() {
    return { token: 'fake-access-token' }
  }
}

test.group('GooglePhotosService', (group) => {
  let originalOAuth2: typeof google.auth.OAuth2
  let originalFetch: typeof fetch
  let tmpDir: string
  let originalCwd: string

  group.each.setup(() => {
    originalOAuth2 = google.auth.OAuth2
    originalFetch = globalThis.fetch
    google.auth.OAuth2 = FakeOAuth2 as unknown as typeof google.auth.OAuth2

    originalCwd = process.cwd()
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'abview-photos-'))
    process.chdir(tmpDir)

    return () => {
      google.auth.OAuth2 = originalOAuth2
      globalThis.fetch = originalFetch
      process.chdir(originalCwd)
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  function mockFetch(handler: (url: string, init?: RequestInit) => Promise<Response>) {
    globalThis.fetch = handler as unknown as typeof fetch
  }

  test('getPhotos retourne [] sans session Picker configurée', async ({ assert }) => {
    const service = new GooglePhotosService()
    const photos = await service.getPhotos()
    assert.deepEqual(photos, [])
  })

  test('getPhotos récupère et transforme les photos depuis la session', async ({ assert }) => {
    savePickerSessionId('session-1')
    mockFetch(async (url) => {
      assert.include(String(url), 'session-1')
      return new Response(
        JSON.stringify({
          mediaItems: [
            {
              id: 'photo-1',
              type: 'PHOTO',
              createTime: '2026-01-01T10:00:00Z',
              mediaFile: {
                baseUrl: 'https://example.com/photo1',
                filename: 'IMG_1.jpg',
                mimeType: 'image/jpeg',
                mediaFileMetadata: { cameraMake: 'Canon', width: '4000', height: '3000' },
              },
            },
          ],
        }),
        { status: 200 }
      )
    })

    const service = new GooglePhotosService()
    const photos = await service.getPhotos()

    assert.lengthOf(photos, 1)
    assert.equal(photos[0].id, 'photo-1')
    assert.equal(photos[0].title, 'IMG_1.jpg')
    assert.equal(photos[0].createdAt, '2026-01-01T10:00:00Z')
    assert.equal(photos[0].width, 4000)
    assert.equal(photos[0].height, 3000)
  })

  test('getPhotos filtre les items qui ne sont pas des photos', async ({ assert }) => {
    savePickerSessionId('session-1')
    mockFetch(
      async () =>
        new Response(
          JSON.stringify({
            mediaItems: [
              { id: 'video-1', type: 'VIDEO', mediaFile: { mimeType: 'video/mp4' } },
              {
                id: 'photo-1',
                type: 'PHOTO',
                mediaFile: { baseUrl: 'x', filename: 'a.jpg', mimeType: 'image/jpeg' },
              },
            ],
          }),
          { status: 200 }
        )
    )

    const service = new GooglePhotosService()
    const photos = await service.getPhotos()

    assert.lengthOf(photos, 1)
    assert.equal(photos[0].id, 'photo-1')
  })

  test('getPhotos n’affiche pas createdAt sans métadonnées EXIF', async ({ assert }) => {
    savePickerSessionId('session-1')
    mockFetch(
      async () =>
        new Response(
          JSON.stringify({
            mediaItems: [
              {
                id: 'photo-1',
                type: 'PHOTO',
                createTime: '2026-01-01T10:00:00Z',
                mediaFile: { baseUrl: 'x', filename: 'a.jpg', mimeType: 'image/jpeg' },
              },
            ],
          }),
          { status: 200 }
        )
    )

    const service = new GooglePhotosService()
    const photos = await service.getPhotos()

    assert.equal(photos[0].createdAt, '')
  })

  test('getPhotos retourne [] et ne plante pas si l’API échoue', async ({ assert }) => {
    savePickerSessionId('session-1')
    mockFetch(async () => new Response('server error', { status: 500 }))

    const service = new GooglePhotosService()
    const photos = await service.getPhotos()

    assert.deepEqual(photos, [])
  })

  test('getPhotos met en cache et ne refait pas d’appel avant expiration', async ({ assert }) => {
    savePickerSessionId('session-1')
    let callCount = 0
    mockFetch(async () => {
      callCount++
      return new Response(
        JSON.stringify({
          mediaItems: [
            {
              id: 'photo-1',
              type: 'PHOTO',
              mediaFile: { baseUrl: 'x', filename: 'a.jpg', mimeType: 'image/jpeg' },
            },
          ],
        }),
        { status: 200 }
      )
    })

    const service = new GooglePhotosService()
    await service.getPhotos()
    await service.getPhotos()

    assert.equal(callCount, 1)
  })

  test('setPickerSessionId invalide le cache et sauvegarde la session', async ({ assert }) => {
    const service = new GooglePhotosService()
    service.setPickerSessionId('new-session')

    const { getPickerSessionId } = await import('#services/config_store')
    assert.equal(getPickerSessionId(), 'new-session')
  })

  test('createPickerSession retourne les infos de session', async ({ assert }) => {
    mockFetch(async (_url, init) => {
      assert.equal(init?.method, 'POST')
      return new Response(
        JSON.stringify({
          id: 'sess-1',
          pickerUri: 'https://picker.google.com/x',
          mediaItemsSet: false,
        }),
        { status: 200 }
      )
    })

    const service = new GooglePhotosService()
    const session = await service.createPickerSession()

    assert.equal(session.id, 'sess-1')
    assert.equal(session.pickerUri, 'https://picker.google.com/x')
    assert.isFalse(session.mediaItemsSet)
  })

  test('createPickerSession lève une erreur si l’API échoue', async ({ assert }) => {
    mockFetch(async () => new Response('nope', { status: 403 }))

    const service = new GooglePhotosService()
    await assert.rejects(() => service.createPickerSession())
  })

  test('getPickerSession retourne l’état de la session', async ({ assert }) => {
    mockFetch(
      async () =>
        new Response(
          JSON.stringify({
            id: 'sess-1',
            pickerUri: 'https://picker.google.com/x',
            mediaItemsSet: true,
          }),
          { status: 200 }
        )
    )

    const service = new GooglePhotosService()
    const session = await service.getPickerSession('sess-1')

    assert.isTrue(session.mediaItemsSet)
  })

  test('getPickerSession lève une erreur si l’API échoue', async ({ assert }) => {
    mockFetch(async () => new Response('nope', { status: 404 }))

    const service = new GooglePhotosService()
    await assert.rejects(() => service.getPickerSession('inconnu'))
  })
})
