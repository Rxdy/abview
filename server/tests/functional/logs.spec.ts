import { test } from '@japa/runner'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

test.group('Routes /logs', (group) => {
  let tmpDir: string
  let originalCwd: string

  group.each.setup(() => {
    originalCwd = process.cwd()
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'abview-logs-'))
    process.chdir(tmpDir)
    return () => {
      process.chdir(originalCwd)
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  test('GET /logs retourne [] si le dossier logs n’existe pas', async ({ client }) => {
    const response = await client.get('/logs')
    response.assertStatus(200)
    response.assertBody({ logs: [] })
  })

  test('POST /logs crée un log puis GET /logs le retourne', async ({ client, assert }) => {
    const entry = {
      timestamp: new Date().toISOString(),
      category: 'api',
      message: 'Test log entry',
    }

    const createResponse = await client.post('/logs').json(entry)
    createResponse.assertStatus(201)

    const listResponse = await client.get('/logs')
    listResponse.assertStatus(200)
    const body = listResponse.body()
    assert.equal(body.count, 1)
    assert.equal(body.logs[0].message, 'Test log entry')
  })

  test('POST /logs rejette une entrée invalide', async ({ client }) => {
    const response = await client.post('/logs').json({ message: 'sans timestamp ni category' })
    response.assertStatus(400)
  })

  test('GET /logs/:category filtre par catégorie', async ({ client, assert }) => {
    await client
      .post('/logs')
      .json({ timestamp: new Date().toISOString(), category: 'api', message: 'A' })
    await client
      .post('/logs')
      .json({ timestamp: new Date().toISOString(), category: 'theme', message: 'B' })

    const response = await client.get('/logs/theme')
    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.count, 1)
    assert.equal(body.logs[0].message, 'B')
  })

  test('GET /logs filtre par ancienneté (hours)', async ({ client, assert }) => {
    const oldTimestamp = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    await client.post('/logs').json({ timestamp: oldTimestamp, category: 'api', message: 'Old' })

    const response = await client.get('/logs').qs({ hours: 24 })
    response.assertStatus(200)
    assert.equal(response.body().count, 0)
  })

  test('GET /logs-files retourne [] si le dossier logs n’existe pas', async ({ client }) => {
    const response = await client.get('/logs-files')
    response.assertStatus(200)
    response.assertBody({ files: [] })
  })

  test('GET /logs-files liste les fichiers créés', async ({ client, assert }) => {
    await client
      .post('/logs')
      .json({ timestamp: new Date().toISOString(), category: 'api', message: 'A' })

    const response = await client.get('/logs-files')
    response.assertStatus(200)
    assert.equal(response.body().count, 1)
  })
})
