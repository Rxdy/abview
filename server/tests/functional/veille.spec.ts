import { test } from '@japa/runner'

const AUTH = { Authorization: 'Bearer secret-de-test' }

// VeilleController garde son état en mémoire : un seul fichier de tests le touche, et chaque test le remet à « normal ».
test.group('Mode veille', (group) => {
  const jetonOrigine = process.env.ABVIEW_ADMIN_TOKEN

  group.each.setup(() => {
    process.env.ABVIEW_ADMIN_TOKEN = 'secret-de-test'
    return async () => {
      if (jetonOrigine === undefined) delete process.env.ABVIEW_ADMIN_TOKEN
      else process.env.ABVIEW_ADMIN_TOKEN = jetonOrigine
    }
  })

  const regler = async (client: any, actif: boolean) => {
    const r = await client.put('/veille').headers(AUTH).json({ actif })
    r.assertStatus(200)
    return r.body()
  }

  test('par défaut l’écran est en mode normal', async ({ client, assert }) => {
    const r = await client.get('/veille')
    r.assertStatus(200)
    assert.deepEqual(r.body(), { actif: false, depuis: null })
  })

  test('on active puis on désactive : l’état suit, avec l’heure d’entrée en veille', async ({
    client,
    assert,
  }) => {
    const entree = await regler(client, true)
    assert.isTrue(entree.actif)
    assert.isFalse(Number.isNaN(Date.parse(entree.depuis)))
    const lu = await client.get('/veille')
    assert.deepEqual(lu.body(), entree)

    const sortie = await regler(client, false)
    assert.deepEqual(sortie, { actif: false, depuis: null })
  })

  test('réactiver une veille déjà active garde l’heure d’entrée', async ({ client, assert }) => {
    const premiere = await regler(client, true)
    const seconde = await regler(client, true)
    assert.equal(seconde.depuis, premiere.depuis)
    await regler(client, false)
  })

  test('refuse sans jeton ou avec un mauvais jeton, et ne change rien', async ({
    client,
    assert,
  }) => {
    const sans = await client.put('/veille').json({ actif: true })
    sans.assertStatus(401)
    const faux = await client
      .put('/veille')
      .headers({ Authorization: 'Bearer faux' })
      .json({ actif: true })
    faux.assertStatus(401)
    const etat = await client.get('/veille')
    assert.isFalse(etat.body().actif)
  })

  test('sans ABVIEW_ADMIN_TOKEN sur le serveur, l’écriture est coupée (503) mais la lecture marche', async ({
    client,
  }) => {
    delete process.env.ABVIEW_ADMIN_TOKEN
    const r = await client.put('/veille').headers(AUTH).json({ actif: true })
    r.assertStatus(503)
    const lecture = await client.get('/veille')
    lecture.assertStatus(200)
  })

  test('refuse une valeur qui n’est pas vrai ou faux (400)', async ({ client }) => {
    for (const actif of ['oui', 1, null, undefined]) {
      const r = await client.put('/veille').headers(AUTH).json({ actif })
      r.assertStatus(400)
    }
    const vide = await client.put('/veille').headers(AUTH).json({})
    vide.assertStatus(400)
  })
})
