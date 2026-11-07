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

  test('listAllTasks garde l’ordre des listes de Google même quand les appels partent en parallèle', async ({
    assert,
  }) => {
    google.tasks = (() => ({
      tasklists: {
        list: async () => ({
          data: {
            items: [
              { id: 'a', title: 'A' },
              { id: 'b', title: 'B' },
              { id: 'c', title: 'C' },
            ],
          },
        }),
      },
      tasks: {
        // la première liste répond en dernier
        list: async ({ tasklist }: { tasklist: string }) => {
          await new Promise((r) => setTimeout(r, tasklist === 'a' ? 30 : 1))
          return {
            data: { items: [{ id: `t-${tasklist}`, title: tasklist, status: 'needsAction' }] },
          }
        },
        patch: async () => ({}),
      },
    })) as unknown as typeof google.tasks

    const lists = await new GoogleTasksService().listAllTasks()
    assert.deepEqual(
      lists.map((l) => l.id),
      ['a', 'b', 'c']
    )
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

  test('une liste inconnue ne prend jamais une couleur attitrée (le rose de Julie)', async ({
    assert,
  }) => {
    const reservees = ['#004c99', '#ffd1dc', '#e74c3c', '#f39c12', '#1e293b', '#9b59b6']
    const noms = [
      'Action',
      'Maison',
      'Travaux',
      'Vacances',
      'Noël',
      'Jardin',
      'Voiture',
      'École',
      'A',
      'B',
      'C',
      'D',
    ]
    mockTasksApi({
      tasklists: noms.map((title, i) => ({ id: `l${i}`, title })),
      tasksByList: Object.fromEntries(
        noms.map((_, i) => [`l${i}`, [{ id: `t${i}`, title: 'X', status: 'needsAction' }]])
      ),
    })

    const lists = await new GoogleTasksService().listAllTasks()

    assert.lengthOf(lists, noms.length)
    for (const liste of lists) {
      assert.notInclude(
        reservees,
        liste.color.toLowerCase(),
        `${liste.title} a pris ${liste.color}`
      )
    }
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

  test('listAllTasks revérifie Google après 60 s, pas avant', async ({ assert }) => {
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
    ;(service as any).lastRefresh = Date.now() - 50_000
    await service.listAllTasks()
    assert.equal(callCount, 1, 'à 50 s : encore le cache')
    ;(service as any).lastRefresh = Date.now() - 61_000
    await service.listAllTasks()
    assert.equal(callCount, 2, 'à 61 s : nouvel appel Google')
  })

  test('des requêtes simultanées partagent un seul rafraîchissement', async ({ assert }) => {
    let callCount = 0
    google.tasks = (() => ({
      tasklists: {
        list: async () => {
          callCount++
          await new Promise((r) => setTimeout(r, 20))
          return { data: { items: [{ id: 'list-1', title: 'Rudy' }] } }
        },
      },
      tasks: {
        list: async () => ({ data: { items: [{ id: 't1', title: 'X', status: 'needsAction' }] } }),
        patch: async () => ({}),
      },
    })) as unknown as typeof google.tasks

    const service = new GoogleTasksService()
    const [a, b, c] = await Promise.all([
      service.listAllTasks(),
      service.listAllTasks(),
      service.listAllTasks(),
    ])
    assert.equal(callCount, 1)
    assert.deepEqual(a, b)
    assert.deepEqual(b, c)
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

  test('détecte une tâche passée à completed entre deux refresh (stats)', async ({ assert }) => {
    const tasksByList: Record<string, any[]> = {
      'list-1': [{ id: 't1', title: 'Appeler', status: 'needsAction' }],
    }
    mockTasksApi({ tasklists: [{ id: 'list-1', title: 'Rudy' }], tasksByList })

    const service = new GoogleTasksService()
    const completedCalls: any[] = []
    ;(service as any).statsService = {
      recordTaskCreated: () => {},
      recordTaskCompleted: (...args: any[]) => completedCalls.push(args),
      updateTaskStatsFromCurrentState: () => {},
    }

    await service.listAllTasks()
    // La tâche passe à completed côté Google, on force l'expiration du cache
    tasksByList['list-1'] = [{ id: 't1', title: 'Appeler', status: 'completed' }]
    ;(service as any).lastRefresh = 0
    await service.listAllTasks()

    assert.lengthOf(completedCalls, 1)
    assert.deepEqual(completedCalls[0], ['list-1', 'Rudy', 't1'])
  })

  test('updateTask initialise le client API même sans fetch préalable', async ({ assert }) => {
    mockTasksApi({ tasklists: [], tasksByList: {} })

    const service = new GoogleTasksService()
    const ok = await service.updateTask('t1', 'completed')

    assert.isFalse(ok) // aucune liste en cache, mais l'init du client ne doit pas planter
  })

  test('updateTask repasse une tâche en needsAction et remet completed à null', async ({
    assert,
  }) => {
    mockTasksApi({
      tasklists: [{ id: 'list-1', title: 'Rudy' }],
      tasksByList: {
        'list-1': [
          { id: 't1', title: 'Appeler', status: 'completed', completed: '2026-01-01T00:00:00Z' },
        ],
      },
    })

    const service = new GoogleTasksService()
    const lists = await service.listAllTasks()
    const ok = await service.updateTask('t1', 'needsAction')

    assert.isTrue(ok)
    assert.equal(lists[0].tasks[0].status, 'needsAction')
    assert.isNull(lists[0].tasks[0].completed)
  })

  test('getLastRefresh retourne null avant le premier fetch', ({ assert }) => {
    const service = new GoogleTasksService()
    assert.isNull(service.getLastRefresh())
  })
})
