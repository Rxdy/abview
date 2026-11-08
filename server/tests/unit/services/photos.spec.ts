import { test } from '@japa/runner'
import axios from 'axios'
import PhotosService, { nomValide, orientationDe } from '#services/photos'

const image = (filename: string, width: number | null, height: number | null) => ({
  filename,
  width,
  height,
})

test.group('PhotosService : orientation et noms', () => {
  test('orientationDe : paysage, portrait, carré, inconnue', ({ assert }) => {
    assert.equal(orientationDe(1600, 1000), 'paysage')
    assert.equal(orientationDe(1000, 1600), 'portrait')
    assert.equal(orientationDe(1000, 1000), 'carre')
    assert.equal(orientationDe(1100, 1000), 'carre') // 10 % de plus : encore carré
    assert.equal(orientationDe(1200, 1000), 'paysage')
    assert.isNull(orientationDe(null, 1000))
    assert.isNull(orientationDe(0, 0))
  })

  test('nomValide refuse les chemins et les fichiers cachés', ({ assert }) => {
    for (const bon of ['a.jpg', 'IMG_2024-01-01.png', '1700000000-photo.webp'])
      assert.isTrue(nomValide(bon))
    for (const mauvais of [
      '../etc/passwd',
      'a/b.jpg',
      '.env',
      '',
      'a b.jpg',
      'a\\b.jpg',
      '%2e%2e',
    ]) {
      assert.isFalse(nomValide(mauvais), mauvais)
    }
  })
})

test.group('PhotosService : liste et tirage', (group) => {
  const originalGet = axios.get
  const url = process.env.ABFLOW_URL
  const cle = process.env.ABFLOW_API_KEY
  let appels: { url: string; params: any; headers: any }[]

  group.each.setup(() => {
    appels = []
    process.env.ABFLOW_URL = 'http://abflow:3000/'
    process.env.ABFLOW_API_KEY = 'cle-de-test'
    return () => {
      axios.get = originalGet
      if (url === undefined) delete process.env.ABFLOW_URL
      else process.env.ABFLOW_URL = url
      if (cle === undefined) delete process.env.ABFLOW_API_KEY
      else process.env.ABFLOW_API_KEY = cle
    }
  })

  const bibliotheque = (images: any[]) => {
    axios.get = (async (u: string, opts: any) => {
      appels.push({ url: u, params: opts?.params, headers: opts?.headers })
      const debut = opts.params.offset
      return {
        data: { total: images.length, images: images.slice(debut, debut + opts.params.limit) },
      }
    }) as typeof axios.get
  }

  test('sans configuration, aucune photo et aucun appel', async ({ assert }) => {
    delete process.env.ABFLOW_URL
    bibliotheque([image('a.jpg', 1600, 1000)])
    const s = new PhotosService()
    assert.isFalse(s.configure)
    assert.deepEqual(await s.lister(), [])
    assert.lengthOf(appels, 0)
  })

  test('liste toutes les pages avec la clé, en gardant orientation et adresse relayée', async ({
    assert,
  }) => {
    const images = Array.from({ length: 450 }, (_, n) =>
      image(`p${n}.jpg`, n % 2 ? 1000 : 1600, n % 2 ? 1600 : 1000)
    )
    bibliotheque(images)
    const photos = await new PhotosService().lister()
    assert.lengthOf(photos, 450) // trois pages de 200, pas seulement les plus récentes
    assert.lengthOf(appels, 3)
    assert.equal(appels[0]!.url, 'http://abflow:3000/api/images')
    assert.equal(appels[0]!.headers['X-API-Key'], 'cle-de-test')
    assert.deepInclude(photos[0]!, {
      id: 'p0.jpg',
      url: '/photos/fichier/p0.jpg',
      orientation: 'paysage',
    })
    assert.equal(photos[1]!.orientation, 'portrait')
  })

  test('ignore les fichiers au nom douteux', async ({ assert }) => {
    bibliotheque([
      image('ok.jpg', 100, 100),
      image('../secret', 100, 100),
      image('.cache', 100, 100),
    ])
    const listees = await new PhotosService().lister()
    assert.deepEqual(
      listees.map((p) => p.id),
      ['ok.jpg']
    )
  })

  test('garde la liste dix minutes, et la dernière connue si abflow tombe', async ({ assert }) => {
    bibliotheque([image('a.jpg', 1600, 1000)])
    const s = new PhotosService()
    await s.lister()
    await s.lister()
    assert.lengthOf(appels, 1) // en cache
    ;(s as any).cache.le = Date.now() - 11 * 60 * 1000 // cache expiré
    axios.get = (async () => {
      throw new Error('abflow éteint')
    }) as typeof axios.get
    const connue = await s.lister()
    assert.deepEqual(
      connue.map((p) => p.id),
      ['a.jpg']
    ) // dernière liste connue
  })

  test('tire une photo par orientation demandée, sans jamais confondre paysage et portrait', async ({
    assert,
  }) => {
    bibliotheque([
      ...Array.from({ length: 5 }, (_, n) => image(`l${n}.jpg`, 1600, 1000)),
      ...Array.from({ length: 5 }, (_, n) => image(`p${n}.jpg`, 1000, 1600)),
    ])
    const s = new PhotosService()
    for (let essai = 0; essai < 30; essai++) {
      const r = await s.aleatoires(['paysage', 'portrait', 'paysage', 'portrait'])
      assert.deepEqual(
        r.map((p) => p.orientation),
        ['paysage', 'portrait', 'paysage', 'portrait']
      )
      assert.lengthOf(new Set(r.map((p) => p.id)), 4) // jamais deux fois la même dans une réponse
    }
  })

  test('évite les photos déjà montrées tant qu’il en reste d’autres', async ({ assert }) => {
    bibliotheque([
      image('a.jpg', 1600, 1000),
      image('b.jpg', 1600, 1000),
      image('c.jpg', 1600, 1000),
    ])
    const s = new PhotosService()
    for (let essai = 0; essai < 20; essai++) {
      const [photo] = await s.aleatoires(['paysage'], ['a.jpg', 'b.jpg'])
      assert.equal(photo!.id, 'c.jpg')
    }
  })

  test('si toutes sont déjà montrées, il en rend une quand même (la bibliothèque est petite)', async ({
    assert,
  }) => {
    bibliotheque([image('a.jpg', 1600, 1000)])
    const [photo] = await new PhotosService().aleatoires(['paysage'], ['a.jpg'])
    assert.equal(photo!.id, 'a.jpg')
  })

  test('sans photo de l’orientation voulue, n’en rend pas : jamais une photo dans le mauvais sens', async ({
    assert,
  }) => {
    bibliotheque([image('l.jpg', 1600, 1000)])
    assert.deepEqual(await new PhotosService().aleatoires(['portrait']), [])
  })

  test('le tirage suit le hasard fourni (uniforme sur toute la bibliothèque)', async ({
    assert,
  }) => {
    bibliotheque(Array.from({ length: 100 }, (_, n) => image(`p${n}.jpg`, 1600, 1000)))
    const s = new PhotosService()
    const premiere = await s.aleatoires(['paysage'], [], () => 0)
    const derniere = await s.aleatoires(['paysage'], [], () => 0.999)
    assert.equal(premiere[0]!.id, 'p0.jpg')
    assert.equal(derniere[0]!.id, 'p99.jpg') // les anciennes comme les récentes
  })
})
