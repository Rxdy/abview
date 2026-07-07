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
