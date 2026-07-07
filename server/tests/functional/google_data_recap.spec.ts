import { test } from '@japa/runner'

// GoogleDataController.getRecapData réutilise le singleton calendarService
// partagé avec /calendar (déjà mocké ou non selon l'ordre d'exécution des
// fichiers). On vérifie donc la forme de la réponse plutôt qu'un contenu
// précis pour rester robuste quel que soit l'ordre des specs.
test.group('Route /recap', () => {
  test('GET /recap retourne les données archivées de l’année passée', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/recap')

    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.year, new Date().getFullYear() - 1)
    assert.property(body, 'tasks')
    assert.property(body, 'weather')
    assert.isArray(body.events)
    assert.isString(body.generatedAt)
  })
})
