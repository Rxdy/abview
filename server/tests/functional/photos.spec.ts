import { test } from '@japa/runner'
import axios from 'axios'
import { Readable } from 'node:stream'

// PhotosController garde un singleton PhotosService (et sa liste en cache) : ce fichier est le seul à taper
// sur ces routes, avec une seule bibliothèque simulée.
test.group('Routes /photos', (group) => {
  const originalGet = axios.get
  const url = process.env.ABFLOW_URL
  const cle = process.env.ABFLOW_API_KEY
  let fichiersDemandes: string[]

  group.each.setup(() => {
    fichiersDemandes = []
    process.env.ABFLOW_URL = 'http://abflow:3000'
    process.env.ABFLOW_API_KEY = 'cle-de-test'
    axios.get = (async (u: string, opts: any) => {
      if (u.endsWith('/api/images')) {
        return {
          data: {
            total: 2,
            images: [
              { filename: 'paysage.jpg', width: 1600, height: 1000 },
              { filename: 'portrait.jpg', width: 1000, height: 1600 },
            ],
          },
        }
      }
      fichiersDemandes.push(u)
      exigerCle(opts.headers['X-API-Key'] === 'cle-de-test')
      if (u.endsWith('/absent.jpg'))
        throw Object.assign(new Error('404'), { response: { status: 404 } })
      return {
        data: Readable.from([Buffer.from('FAUSSE-IMAGE')]),
        headers: { 'content-type': 'image/jpeg' },
      }
    }) as typeof axios.get
    return () => {
      axios.get = originalGet
      if (url === undefined) delete process.env.ABFLOW_URL
      else process.env.ABFLOW_URL = url
      if (cle === undefined) delete process.env.ABFLOW_API_KEY
      else process.env.ABFLOW_API_KEY = cle
    }
  })

  function exigerCle(condition: boolean) {
    if (!condition) throw new Error('clé d’API absente de la requête vers abflow')
  }

  test('GET /photos/aleatoires rend une photo par orientation, avec une adresse relayée par AbView', async ({
    client,
    assert,
  }) => {
    const r = await client.get('/photos/aleatoires').qs({ orientations: 'portrait,paysage' })
    r.assertStatus(200)
    const { photos, source } = r.body()
    assert.equal(source, 'abflow')
    assert.deepEqual(
      photos.map((p: any) => p.id),
      ['portrait.jpg', 'paysage.jpg']
    )
    assert.equal(photos[0].url, '/photos/fichier/portrait.jpg') // jamais l'adresse d'abflow ni sa clé
    assert.notInclude(JSON.stringify(photos), 'cle-de-test')
    assert.notInclude(JSON.stringify(photos), 'abflow:3000')
  })

  test('refuse des orientations inconnues (400) et ignore le reste', async ({ client }) => {
    const inconnue = await client.get('/photos/aleatoires').qs({ orientations: 'panorama' })
    inconnue.assertStatus(400)
    const melangee = await client.get('/photos/aleatoires').qs({ orientations: 'panorama,paysage' })
    melangee.assertStatus(200)
  })

  test('accepte un mur de galerie : jusqu\'à 30 orientations dans une demande, pas davantage', async ({ client, assert }) => {
    const trente = Array(30).fill('portrait').join(',')
    const r = await client.get('/photos/aleatoires').qs({ orientations: `${trente},paysage` })
    r.assertStatus(200)
    assert.isAtMost(r.body().photos.length, 30)
  })

  test('GET /photos/fichier/:nom relaie le fichier avec la clé, et le garde en cache côté navigateur', async ({
    client,
    assert,
  }) => {
    const r = await client.get('/photos/fichier/paysage.jpg')
    r.assertStatus(200)
    r.assertHeader('content-type', 'image/jpeg')
    assert.include(r.header('cache-control'), 'max-age=86400')
    assert.equal(Buffer.from(r.body()).toString(), 'FAUSSE-IMAGE')
    assert.deepEqual(fichiersDemandes, ['http://abflow:3000/uploads/paysage.jpg'])
  })

  test('refuse un nom de fichier qui sortirait du dossier, sans appeler abflow', async ({
    client,
    assert,
  }) => {
    const cache = await client.get('/photos/fichier/.env')
    cache.assertStatus(400)
    const chemin = await client.get('/photos/fichier/a%2F..%2Fb')
    chemin.assertStatus(400)
    assert.lengthOf(fichiersDemandes, 0)
  })

  test('une photo absente d’abflow : 404', async ({ client }) => {
    const r = await client.get('/photos/fichier/absent.jpg')
    r.assertStatus(404)
  })
})

test.group('Routes /photos sans abflow', (group) => {
  const url = process.env.ABFLOW_URL
  const cle = process.env.ABFLOW_API_KEY
  group.each.setup(() => {
    delete process.env.ABFLOW_URL
    delete process.env.ABFLOW_API_KEY
    return () => {
      if (url !== undefined) process.env.ABFLOW_URL = url
      if (cle !== undefined) process.env.ABFLOW_API_KEY = cle
    }
  })

  test('aucune photo (l’écran montre alors des images de démonstration) et pas d’erreur', async ({
    client,
    assert,
  }) => {
    const r = await client.get('/photos/aleatoires')
    r.assertStatus(200)
    assert.deepEqual(r.body(), { photos: [], source: 'absente' })
  })

  test('un fichier demandé : 404', async ({ client }) => {
    const r = await client.get('/photos/fichier/a.jpg')
    r.assertStatus(404)
  })
})
