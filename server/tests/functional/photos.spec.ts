import { test } from '@japa/runner'
import axios from 'axios'
import { Readable } from 'node:stream'
import sharp from 'sharp'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

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

// Les photos des téléphones sont énormes : l'écran du Raspberry Pi les reçoit réduites à 1600 px, gardées sur disque.
test.group('Photos réduites pour l’écran', (group) => {
  const originalGet = axios.get
  const env = {
    url: process.env.ABFLOW_URL,
    cle: process.env.ABFLOW_API_KEY,
    donnees: process.env.DONNEES_DIR,
  }
  let donnees: string
  let appelsAbflow: string[]
  let grande: Buffer
  let petite: Buffer

  group.setup(async () => {
    // une vraie image, assez grande pour que la réduction se voie : 4032 × 3024, comme un téléphone
    grande = await sharp({
      create: { width: 4032, height: 3024, channels: 3, background: '#c0a060' },
    })
      .jpeg({ quality: 92 })
      .toBuffer()
    petite = await sharp({
      create: { width: 800, height: 600, channels: 3, background: '#2060c0' },
    })
      .jpeg()
      .toBuffer()
  })

  group.each.setup(() => {
    appelsAbflow = []
    donnees = fs.mkdtempSync(path.join(os.tmpdir(), 'abview-photos-'))
    process.env.DONNEES_DIR = donnees
    process.env.ABFLOW_URL = 'http://abflow:3000'
    process.env.ABFLOW_API_KEY = 'cle-de-test'
    axios.get = (async (u: string) => {
      appelsAbflow.push(u)
      await new Promise((r) => setTimeout(r, 20)) // le temps que deux demandes se croisent
      return {
        data: Readable.from([u.endsWith('/petite.jpg') ? petite : grande]),
        headers: { 'content-type': 'image/jpeg' },
      }
    }) as typeof axios.get
    return () => {
      axios.get = originalGet
      fs.rmSync(donnees, { recursive: true, force: true })
      for (const [k, v] of Object.entries({
        ABFLOW_URL: env.url,
        ABFLOW_API_KEY: env.cle,
        DONNEES_DIR: env.donnees,
      })) {
        if (v === undefined) delete process.env[k]
        else process.env[k] = v
      }
    }
  })

  test('une grande photo arrive réduite à 1600 px sur son grand côté, bien plus légère', async ({
    client,
    assert,
  }) => {
    const r = await client.get('/photos/fichier/grande.jpg')
    r.assertStatus(200)
    r.assertHeader('content-type', 'image/jpeg')
    const corps = Buffer.from(r.body())
    const meta = await sharp(corps).metadata()
    assert.equal(meta.width, 1600)
    assert.equal(meta.height, 1200) // les proportions sont gardées
    assert.isBelow(corps.length, grande.length / 4)
  })

  test('une photo déjà petite n’est pas agrandie', async ({ client, assert }) => {
    const r = await client.get('/photos/fichier/petite.jpg')
    r.assertStatus(200)
    const meta = await sharp(Buffer.from(r.body())).metadata()
    assert.equal(meta.width, 800)
    assert.equal(meta.height, 600)
  })

  test('la photo réduite est gardée sur disque : la deuxième demande ne rappelle pas abflow', async ({
    client,
    assert,
  }) => {
    await client.get('/photos/fichier/grande.jpg')
    assert.lengthOf(appelsAbflow, 1)
    assert.isTrue(fs.existsSync(path.join(donnees, 'cache-photos', 'grande.jpg.1600.jpg')))
    const encore = await client.get('/photos/fichier/grande.jpg')
    encore.assertStatus(200)
    assert.lengthOf(appelsAbflow, 1)
    const meta = await sharp(Buffer.from(encore.body())).metadata()
    assert.equal(meta.width, 1600)
  })

  test('deux demandes simultanées de la même photo ne la réduisent qu’une fois', async ({
    client,
    assert,
  }) => {
    const [a, b] = await Promise.all([
      client.get('/photos/fichier/grande.jpg'),
      client.get('/photos/fichier/grande.jpg'),
    ])
    a.assertStatus(200)
    b.assertStatus(200)
    assert.lengthOf(appelsAbflow, 1)
  })

  test('les photos réduites sont rangées dans le volume des données, sans fichier temporaire oublié', async ({
    client,
    assert,
  }) => {
    await client.get('/photos/fichier/grande.jpg')
    assert.deepEqual(fs.readdirSync(path.join(donnees, 'cache-photos')), ['grande.jpg.1600.jpg'])
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
