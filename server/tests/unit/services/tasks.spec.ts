import { test } from '@japa/runner'
import { google } from 'googleapis'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import GoogleTasksService from '#services/tasks'

test.group('GoogleTasksService', (group) => {
  let originalTasks: typeof google.tasks
  let tmpDir: string
  let originalCwd: string

  group.each.setup(() => {
    originalTasks = google.tasks
    originalCwd = process.cwd()
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'abview-tasks-'))
    process.chdir(tmpDir)
    return () => {
      google.tasks = originalTasks
      process.chdir(originalCwd)
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  function mockTasksApi(opts: {
    tasklists: any[]
    tasksByList: Record<string, any[]>
    patch?: (params: any) => Promise<any>
  }) {
    google.tasks = (() => ({
      tasklists: {
        list: async () => ({ data: { items: opts.tasklists } }),
      },
      tasks: {
        list: async ({ tasklist }: { tasklist: string }) => ({
          data: { items: opts.tasksByList[tasklist] || [] },
        }),
        patch: opts.patch || (async () => ({})),
      },
    })) as unknown as typeof google.tasks
  }

  test('listAllTasks transforme les listes et tâches Google', async ({ assert }) => {
    mockTasksApi({
      tasklists: [{ id: 'list-1', title: 'Rudy' }],
      tasksByList: {
        'list-1': [
          { id: 't1', title: 'Appeler', status: 'needsAction' },
          { id: 't2', title: 'Payer', status: 'completed' },
        ],
      },
    })

    const service = new GoogleTasksService()
    const lists = await service.listAllTasks()

    assert.lengthOf(lists, 1)
    assert.equal(lists[0].title, 'Rudy')
    assert.equal(lists[0].color, '#1e293b') // couleur mappée pour "Rudy"
    assert.lengthOf(lists[0].tasks, 2)
    assert.equal(lists[0].tasks[0].title, 'Appeler')
    assert.equal(lists[0].tasks[1].status, 'completed')
  })

  test('listAllTasks ignore les listes sans tâches', async ({ assert }) => {
    mockTasksApi({
      tasklists: [
        { id: 'list-1', title: 'VideList' },
        { id: 'list-2', title: 'Courses' },
      ],
      tasksByList: {
        'list-1': [],
        'list-2': [{ id: 't1', title: 'Pain', status: 'needsAction' }],
      },
    })

    const service = new GoogleTasksService()
    const lists = await service.listAllTasks()

    assert.lengthOf(lists, 1)
    assert.equal(lists[0].title, 'Courses')
  })

  test('listAllTasks calcule la hiérarchie parent/enfant (level)', async ({ assert }) => {
    mockTasksApi({
      tasklists: [{ id: 'list-1', title: 'Général' }],
      tasksByList: {
        'list-1': [
          { id: 'root', title: 'Root', status: 'needsAction' },
          { id: 'child', title: 'Child', status: 'needsAction', parent: 'root' },
          { id: 'grandchild', title: 'GrandChild', status: 'needsAction', parent: 'child' },
        ],
      },
    })

    const service = new GoogleTasksService()
    const lists = await service.listAllTasks()
    const byId = Object.fromEntries(lists[0].tasks.map((t) => [t.id, t]))

    assert.equal(byId.root.level, 0)
    assert.equal(byId.child.level, 1)
    assert.equal(byId.grandchild.level, 2)
  })

  test('listAllTasks attribue une couleur cohérente pour une liste inconnue', async ({
    assert,
  }) => {
    mockTasksApi({
      tasklists: [{ id: 'list-1', title: 'ListeInconnue' }],
      tasksByList: { 'list-1': [{ id: 't1', title: 'X', status: 'needsAction' }] },
    })

    const service = new GoogleTasksService()
    const lists = await service.listAllTasks()

    assert.isString(lists[0].color)
    assert.match(lists[0].color, /^#[0-9a-f]{6}$/i)
  })

  test('listAllTasks met en cache et ne refait pas d’appel avant expiration', async ({
    assert,
  }) => {
    let callCount = 0
    google.tasks = (() => ({
      tasklists: {
        list: async () => {
          callCount++
          return { data: { items: [{ id: 'list-1', title: 'Rudy' }] } }
        },
      },
      tasks: {
        list: async () => ({ data: { items: [{ id: 't1', title: 'X', status: 'needsAction' }] } }),
        patch: async () => ({}),
      },
    })) as unknown as typeof google.tasks

    const service = new GoogleTasksService()
    await service.listAllTasks()
    await service.listAllTasks()

    assert.equal(callCount, 1)
  })

  test('updateTask met à jour le statut et retourne true en cas de succès', async ({ assert }) => {
    let patchedWith: any = null
    mockTasksApi({
      tasklists: [{ id: 'list-1', title: 'Rudy' }],
      tasksByList: {
        'list-1': [{ id: 't1', title: 'Appeler', status: 'needsAction' }],
      },
      patch: async (params) => {
        patchedWith = params
        return {}
      },
    })

    const service = new GoogleTasksService()
    await service.listAllTasks()
    const ok = await service.updateTask('t1', 'completed')

    assert.isTrue(ok)
    assert.equal(patchedWith.task, 't1')
    assert.equal(patchedWith.requestBody.status, 'completed')
  })

  test('updateTask retourne false si la tâche est introuvable', async ({ assert }) => {
    mockTasksApi({ tasklists: [], tasksByList: {} })

    const service = new GoogleTasksService()
    await service.listAllTasks()
    const ok = await service.updateTask('inconnu', 'completed')

    assert.isFalse(ok)
  })

  test('updateTask retourne false si l’API échoue', async ({ assert }) => {
    mockTasksApi({
      tasklists: [{ id: 'list-1', title: 'Rudy' }],
      tasksByList: {
        'list-1': [{ id: 't1', title: 'Appeler', status: 'needsAction' }],
      },
      patch: async () => {
        throw new Error('boom')
      },
    })

    const service = new GoogleTasksService()
    await service.listAllTasks()
    const ok = await service.updateTask('t1', 'completed')

    assert.isFalse(ok)
  })

  test('getLastRefresh retourne null avant le premier fetch', ({ assert }) => {
    const service = new GoogleTasksService()
    assert.isNull(service.getLastRefresh())
  })
})
