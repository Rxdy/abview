import { test } from '@japa/runner'
import { google } from 'googleapis'

// Singleton GoogleTasksService : seul fichier à taper sur /tasks et /tasks/:id.
test.group('Routes /tasks', (group) => {
  let originalTasks: typeof google.tasks

  group.each.setup(() => {
    originalTasks = google.tasks
    google.tasks = (() => ({
      tasklists: {
        list: async () => ({ data: { items: [{ id: 'list-1', title: 'Rudy' }] } }),
      },
      tasks: {
        list: async () => ({
          data: { items: [{ id: 't1', title: 'Appeler', status: 'needsAction' }] },
        }),
        patch: async ({ task, requestBody }: any) => {
          if (task === 'inexistant') throw new Error('not found')
          return { data: { id: task, status: requestBody.status } }
        },
      },
    })) as unknown as typeof google.tasks
    return () => {
      google.tasks = originalTasks
    }
  })

  test('GET /tasks retourne les listes avec leurs tâches', async ({ client, assert }) => {
    const response = await client.get('/tasks')

    response.assertStatus(200)
    const body = response.body()
    assert.lengthOf(body.lists, 1)
    assert.equal(body.lists[0].title, 'Rudy')
    assert.equal(body.lists[0].tasks[0].title, 'Appeler')
    assert.isString(body.lastRefresh)
  })

  test('PATCH /tasks/:id met à jour le statut d’une tâche existante', async ({ client }) => {
    await client.get('/tasks') // peuple le cache pour que updateTask trouve la tâche

    const response = await client.patch('/tasks/t1').json({ status: 'completed' })

    response.assertStatus(200)
    response.assertBody({ success: true })
  })

  test('PATCH /tasks/:id retourne 404 si la tâche est introuvable', async ({ client }) => {
    await client.get('/tasks')

    const response = await client.patch('/tasks/inconnu').json({ status: 'completed' })

    response.assertStatus(404)
  })
})
