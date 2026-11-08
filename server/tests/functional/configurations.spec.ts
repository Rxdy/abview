import { test } from '@japa/runner'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const SEMAINE = {
  nom: 'Semaine',
  placements: [
    { id: 'calendrier', module: 'calendrier', x: 1, y: 1 },
    { id: 'meteo', module: 'meteo', x: 1, y: 6 },
  ],
}
async function statut(requete: PromiseLike<{ assertStatus(code: number): void }>, code: number) {
  const reponse = await requete
  reponse.assertStatus(code)
}

async function lire(client: any, url: string, champ: string) {
  const reponse = await client.get(url)
  return reponse.body()[champ]
}

async function corps(requete: PromiseLike<{ body(): any }>) {
  const reponse = await requete
  return reponse.body()
}

const AUTH = { Authorization: 'Bearer secret-de-test' }

test.group('Configurations de l’écran', (group) => {
  let dossier: string
  const jetonOrigine = process.env.ABVIEW_ADMIN_TOKEN
  const donneesOrigine = process.env.DONNEES_DIR

  group.each.setup(() => {
    dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'abview-config-'))
    process.env.DONNEES_DIR = dossier
    process.env.ABVIEW_ADMIN_TOKEN = 'secret-de-test'
    return () => {
      fs.rmSync(dossier, { recursive: true, force: true })
      if (jetonOrigine === undefined) delete process.env.ABVIEW_ADMIN_TOKEN
      else process.env.ABVIEW_ADMIN_TOKEN = jetonOrigine
      if (donneesOrigine === undefined) delete process.env.DONNEES_DIR
      else process.env.DONNEES_DIR = donneesOrigine
    }
  })

  test('sans configuration enregistrée, le kiosque reçoit null (disposition standard)', async ({
    client,
  }) => {
    const response = await client.get('/configuration')
    response.assertStatus(200)
    response.assertBody({ id: null, configuration: null })
  })

  test('on enregistre, on active, le kiosque reçoit la configuration active', async ({
    client,
    assert,
  }) => {
    await statut(client.put('/configurations/semaine').headers(AUTH).json(SEMAINE), 200)
    // enregistrée mais pas active : le kiosque ne la voit pas encore
    assert.isNull(await lire(client, '/configuration', 'configuration'))
    await statut(client.put('/configuration/active').headers(AUTH).json({ id: 'semaine' }), 200)
    const lue = await corps(client.get('/configuration'))
    assert.equal(lue.id, 'semaine')
    assert.deepEqual(lue.configuration, SEMAINE)
  })

  test('la liste donne les noms et la configuration active', async ({ client, assert }) => {
    await client.put('/configurations/semaine').headers(AUTH).json(SEMAINE)
    await client
      .put('/configurations/vacances')
      .headers(AUTH)
      .json({ ...SEMAINE, nom: 'Vacances' })
    await client.put('/configuration/active').headers(AUTH).json({ id: 'vacances' })
    const { actif, configurations } = await corps(client.get('/configurations'))
    assert.equal(actif, 'vacances')
    assert.sameDeepMembers(configurations, [
      { id: 'semaine', nom: 'Semaine' },
      { id: 'vacances', nom: 'Vacances' },
    ])
    const semaine = await lire(client, '/configurations/semaine', 'configuration')
    assert.equal(semaine.nom, 'Semaine')
    await statut(client.get('/configurations/inconnue'), 404)
  })

  test('écrire sans jeton ou avec un mauvais jeton est refusé et ne change rien', async ({
    client,
    assert,
  }) => {
    await statut(client.put('/configurations/semaine').json(SEMAINE), 401)
    await statut(
      client.put('/configurations/semaine').headers({ Authorization: 'Bearer faux' }).json(SEMAINE),
      401
    )
    await statut(client.delete('/configurations/semaine'), 401)
    await statut(client.put('/configuration/active').json({ id: null }), 401)
    assert.deepEqual(await lire(client, '/configurations', 'configurations'), [])
  })

  test('sans ABVIEW_ADMIN_TOKEN, l’écriture est coupée (503) mais la lecture marche', async ({
    client,
  }) => {
    delete process.env.ABVIEW_ADMIN_TOKEN
    await statut(client.put('/configurations/semaine').headers(AUTH).json(SEMAINE), 503)
    await statut(client.get('/configuration'), 200)
  })

  test('refuse une configuration mal formée (422) et un mauvais identifiant (400)', async ({
    client,
    assert,
  }) => {
    const mauvaise = await client
      .put('/configurations/x')
      .headers(AUTH)
      .json({
        nom: '',
        placements: [{ id: 'a', module: 'meteo', x: 1.5, y: 1 }],
      })
    mauvaise.assertStatus(422)
    assert.isAbove(mauvaise.body().details.length, 1)
    await statut(client.put('/configurations/x').headers(AUTH).json({ nom: 'ok' }), 422)
    await statut(client.put('/configurations/Pas%20Valide').headers(AUTH).json(SEMAINE), 400)
    assert.deepEqual(await lire(client, '/configurations', 'configurations'), [])
  })

  test('active une configuration inexistante : 404 ; null revient à la disposition standard', async ({
    client,
    assert,
  }) => {
    await statut(client.put('/configuration/active').headers(AUTH).json({ id: 'fantome' }), 404)
    await client.put('/configurations/semaine').headers(AUTH).json(SEMAINE)
    await client.put('/configuration/active').headers(AUTH).json({ id: 'semaine' })
    await statut(client.put('/configuration/active').headers(AUTH).json({ id: null }), 200)
    assert.isNull(await lire(client, '/configuration', 'configuration'))
  })

  test('supprimer : refuse l’active (409), accepte les autres, 404 si absente', async ({
    client,
    assert,
  }) => {
    await client.put('/configurations/semaine').headers(AUTH).json(SEMAINE)
    await client
      .put('/configurations/vacances')
      .headers(AUTH)
      .json({ ...SEMAINE, nom: 'Vacances' })
    await client.put('/configuration/active').headers(AUTH).json({ id: 'semaine' })
    await statut(client.delete('/configurations/semaine').headers(AUTH), 409)
    await statut(client.delete('/configurations/vacances').headers(AUTH), 200)
    await statut(client.delete('/configurations/vacances').headers(AUTH), 404)
    assert.deepEqual(await lire(client, '/configurations', 'configurations'), [
      { id: 'semaine', nom: 'Semaine' },
    ])
  })

  test('garde la version précédente et ne laisse pas de fichier temporaire', async ({
    client,
    assert,
  }) => {
    await client.put('/configurations/semaine').headers(AUTH).json(SEMAINE)
    await client
      .put('/configurations/semaine')
      .headers(AUTH)
      .json({ ...SEMAINE, nom: 'Semaine 2' })
    const precedent = JSON.parse(
      fs.readFileSync(path.join(dossier, 'configurations.precedent.json'), 'utf-8')
    )
    assert.equal(precedent.configurations.semaine.nom, 'Semaine')
    assert.deepEqual(fs.readdirSync(dossier).sort(), [
      'configurations.json',
      'configurations.precedent.json',
    ])
  })

  test('un fichier corrompu donne null au kiosque au lieu d’une erreur', async ({
    client,
    assert,
  }) => {
    fs.writeFileSync(path.join(dossier, 'configurations.json'), '{ pas du json')
    const response = await client.get('/configuration')
    response.assertStatus(200)
    assert.isNull(response.body().configuration)
  })
})
