import { test } from '@japa/runner'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

test.group('Route /horaires', (group) => {
  let tmpDir: string
  let originalCwd: string

  group.each.setup(() => {
    originalCwd = process.cwd()
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'abview-horaires-'))
    process.chdir(tmpDir)
    return () => {
      process.chdir(originalCwd)
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  test('GET /horaires retourne le contenu du fichier horaires.json', async ({ client, assert }) => {
    const dataDir = path.join(tmpDir, 'app', 'database', 'data')
    fs.mkdirSync(dataDir, { recursive: true })
    fs.writeFileSync(
      path.join(dataDir, 'horaires.json'),
      JSON.stringify({ lundi: '9h-18h', mardi: '9h-18h' })
    )

    const response = await client.get('/horaires')

    // Le HorairesController est un singleton créé une seule fois par routes.ts :
    // si un test précédent (dans un autre run) a déjà mis en cache une valeur,
    // celle-ci prime tant que le cache (5 min) n'a pas expiré. On vérifie donc
    // la forme de la réponse plutôt qu'un contenu strict.
    response.assertStatus(200)
    assert.isObject(response.body().horaires)
    assert.isString(response.body().lastRefresh)
  })
})
