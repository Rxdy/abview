import { test } from '@japa/runner'

test.group('Routes /stats', () => {
  test('GET /stats/past-year retourne un objet stats', async ({ client, assert }) => {
    const response = await client.get('/stats/past-year')

    response.assertStatus(200)
    const body = response.body()
    assert.property(body, 'stats')
    assert.isNumber(body.stats.year)
  })

  test('GET /stats/weather/past-year retourne un objet stats météo', async ({ client, assert }) => {
    const response = await client.get('/stats/weather/past-year')

    response.assertStatus(200)
    const body = response.body()
    assert.property(body, 'stats')
    assert.isNumber(body.stats.year)
  })
})
