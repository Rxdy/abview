import { test } from '@japa/runner'
import { google } from 'googleapis'

class FakeOAuth2 {
  setCredentials() {}
  async getAccessToken() {
    return { token: 'fake-token' }
  }
}

// photosService est un singleton exporté par photos.ts, partagé par toutes
// les routes /photos/*. On mocke google.auth.OAuth2 + fetch une seule fois
// pour tout le fichier.
test.group('Routes /photos', (group) => {
  let originalOAuth2: typeof google.auth.OAuth2
  let originalFetch: typeof fetch

  group.each.setup(() => {
    originalOAuth2 = google.auth.OAuth2
    originalFetch = globalThis.fetch
    google.auth.OAuth2 = FakeOAuth2 as unknown as typeof google.auth.OAuth2
    return () => {
      google.auth.OAuth2 = originalOAuth2
      globalThis.fetch = originalFetch
    }
  })

  test('POST /photos/session crée une session Picker', async ({ client, assert }) => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ id: 'sess-1', pickerUri: 'https://picker.google.com/x' }), {
        status: 200,
      })) as unknown as typeof fetch

    const response = await client.post('/photos/session')

    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.sessionId, 'sess-1')
    assert.include(body.instructions, 'GOOGLE_PICKER_SESSION_ID=sess-1')
  })

  test('POST /photos/session retourne 500 si l’API échoue', async ({ client }) => {
    globalThis.fetch = (async () =>
      new Response('nope', { status: 500 })) as unknown as typeof fetch

    const response = await client.post('/photos/session')

    response.assertStatus(500)
  })

  test('GET /photos/session/:sessionId retourne l’état de la session', async ({
    client,
    assert,
  }) => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ id: 'sess-1', pickerUri: 'x', mediaItemsSet: true }), {
        status: 200,
      })) as unknown as typeof fetch

    const response = await client.get('/photos/session/sess-1')

    response.assertStatus(200)
    assert.isTrue(response.body().mediaItemsSet)
  })

  test('POST /photos/session/confirm sauvegarde la session', async ({ client, assert }) => {
    const response = await client.post('/photos/session/confirm').json({ sessionId: 'sess-42' })

    response.assertStatus(200)
    response.assertBody({ success: true, sessionId: 'sess-42' })

    // getPhotos utilise maintenant cette session
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ mediaItems: [] }), { status: 200 })) as unknown as typeof fetch
    const photosResponse = await client.get('/photos')
    photosResponse.assertStatus(200)
    assert.deepEqual(photosResponse.body().photos, [])
  })

  test('POST /photos/session/confirm sans sessionId retourne 400', async ({ client }) => {
    const response = await client.post('/photos/session/confirm').json({})
    response.assertStatus(400)
  })

  test('GET /photos/proxy sans id retourne 400', async ({ client }) => {
    const response = await client.get('/photos/proxy')
    response.assertStatus(400)
  })

  test('GET /photos/proxy avec un id inconnu retourne 404', async ({ client }) => {
    // Réutilise la session confirmée précédemment (cache photos vide).
    const response = await client.get('/photos/proxy').qs({ id: 'inconnu' })
    response.assertStatus(404)
  })

  test('GET /photos/proxy sert l’image en la faisant transiter depuis Google', async ({
    client,
    assert,
  }) => {
    // Nouvelle session + cache pour avoir une vraie photo avec baseUrl.
    await client.post('/photos/session/confirm').json({ sessionId: 'sess-proxy' })

    globalThis.fetch = (async (url: string) => {
      if (String(url).includes('photospicker.googleapis.com')) {
        return new Response(
          JSON.stringify({
            mediaItems: [
              {
                id: 'photo-proxy-1',
                type: 'PHOTO',
                mediaFile: {
                  baseUrl: 'https://example.com/base',
                  filename: 'a.jpg',
                  mimeType: 'image/jpeg',
                },
              },
            ],
          }),
          { status: 200 }
        )
      }
      // Requête de l'image elle-même
      return new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { 'content-type': 'image/jpeg' },
      })
    }) as unknown as typeof fetch

    await client.get('/photos') // peuple le cache avec photo-proxy-1

    const response = await client.get('/photos/proxy').qs({ id: 'photo-proxy-1' })

    response.assertStatus(200)
    assert.equal(response.headers()['content-type'], 'image/jpeg')
  })
})
