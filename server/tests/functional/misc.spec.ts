import { test } from '@japa/runner'

test.group('Routes diverses', () => {
  test('GET / répond hello world', async ({ client, assert }) => {
    const response = await client.get('/')
    response.assertStatus(200)
    assert.equal(response.body().hello, 'world')
  })

  test('GET /debug/last-refresh retourne globalLastRefresh', async ({ client }) => {
    const response = await client.get('/debug/last-refresh')
    response.assertStatus(200)
    response.assertBodyContains({ globalLastRefresh: response.body().globalLastRefresh })
  })

  test('GET /progress/sync retourne un objet de progression valide', async ({ client, assert }) => {
    const response = await client.get('/progress/sync')
    response.assertStatus(200)
    const body = response.body()
    assert.isNumber(body.serverTime)
    assert.isNumber(body.startTime)
    assert.isNumber(body.totalTime)
    assert.isNumber(body.elapsed)
    assert.isNumber(body.progress)
    assert.isAtLeast(body.progress, 0)
    assert.isAtMost(body.progress, 100)
  })

  test('GET /oauth2callback avec un code retourne le code', async ({ client }) => {
    const response = await client.get('/oauth2callback').qs({ code: 'abc123' })
    response.assertStatus(200)
    response.assertTextIncludes("Code d'autorisation : abc123")
  })

  test('GET /oauth2callback sans code retourne 400', async ({ client }) => {
    const response = await client.get('/oauth2callback')
    response.assertStatus(400)
  })
})

test.group('Cycle de progression (/progress/sync)', (group) => {
  const dateNowOrigine = Date.now
  group.each.teardown(() => {
    Date.now = dateNowOrigine
  })

  test('le cycle dure 5 minutes et la progression suit le temps écoulé', async ({
    client,
    assert,
  }) => {
    const reponse = await client.get('/progress/sync')
    const body = reponse.body()
    assert.equal(body.totalTime, 5 * 60 * 1000)
    assert.equal(body.elapsed, body.serverTime - body.startTime)
    assert.approximately(body.progress, (body.elapsed / body.totalTime) * 100, 0.01)
  })

  test('deux appels rapprochés partagent le même début de cycle', async ({ client, assert }) => {
    const reponseA = await client.get('/progress/sync')
    const a = reponseA.body()
    const reponseB = await client.get('/progress/sync')
    const b = reponseB.body()
    assert.equal(a.startTime, b.startTime)
    assert.isAtLeast(b.elapsed, a.elapsed)
  })

  test('à la fin du cycle, un nouveau commence en gardant le rythme', async ({
    client,
    assert,
  }) => {
    const reponseAvant = await client.get('/progress/sync')
    const avant = reponseAvant.body()
    const cycle = avant.totalTime
    Date.now = () => avant.startTime + cycle + 10_000 // 10 s après la fin du cycle
    const reponseApres = await client.get('/progress/sync')
    const apres = reponseApres.body()

    assert.equal(apres.startTime, avant.startTime + cycle) // pas de dérive : aligné sur le cycle précédent
    assert.equal(apres.elapsed, 10_000)
    assert.approximately(apres.progress, (10_000 / cycle) * 100, 0.01)
  })

  test('après plusieurs cycles manqués, le début reste aligné sur la durée du cycle', async ({
    client,
    assert,
  }) => {
    const reponseAvant = await client.get('/progress/sync')
    const avant = reponseAvant.body()
    const cycle = avant.totalTime
    Date.now = () => avant.startTime + 3 * cycle + 42_000
    const reponseApres = await client.get('/progress/sync')
    const apres = reponseApres.body()

    assert.equal(apres.startTime, avant.startTime + 3 * cycle)
    assert.equal(apres.elapsed, 42_000)
  })

  test('la réponse autorise le kiosque (CORS)', async ({ client }) => {
    const response = await client.get('/progress/sync')
    response.assertHeader('access-control-allow-origin', '*')
  })
})

test.group('Debug : dernier rafraîchissement', () => {
  test('/debug/last-refresh donne une date ISO valide, avec CORS', async ({ client, assert }) => {
    const response = await client.get('/debug/last-refresh')
    response.assertStatus(200)
    response.assertHeader('access-control-allow-origin', '*')
    const { globalLastRefresh } = response.body()
    assert.isFalse(Number.isNaN(Date.parse(globalLastRefresh)))
    assert.equal(new Date(globalLastRefresh).toISOString(), globalLastRefresh)
  })
})
