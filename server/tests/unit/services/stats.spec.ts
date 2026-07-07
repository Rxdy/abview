import { test } from '@japa/runner'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import StatsService from '#services/stats'

test.group('StatsService', (group) => {
  let tmpDir: string
  let originalCwd: string

  group.each.setup(() => {
    originalCwd = process.cwd()
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'abview-stats-'))
    process.chdir(tmpDir)
    return () => {
      process.chdir(originalCwd)
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  test('initialise des fichiers de stats vides à la première utilisation', ({ assert }) => {
    const service = new StatsService()
    const stats = service.getCurrentYearStats()

    assert.equal(stats.year, new Date().getFullYear())
    assert.deepEqual(stats.tasks, [])
    assert.deepEqual(stats.userStats, [])
    assert.deepEqual(stats.listStats, [])
  })

  test('recordTaskCreated ajoute une tâche à une nouvelle liste', ({ assert }) => {
    const service = new StatsService()
    service.recordTaskCreated('list-1', 'Rudy', 'task-1')

    const stats = service.getCurrentYearStats()
    assert.lengthOf(stats.tasks, 1)
    assert.equal(stats.tasks[0].listId, 'list-1')
    assert.equal(stats.tasks[0].created, 1)
  })

  test('recordTaskCreated ne compte pas deux fois le même taskId', ({ assert }) => {
    const service = new StatsService()
    service.recordTaskCreated('list-1', 'Rudy', 'task-1')
    service.recordTaskCreated('list-1', 'Rudy', 'task-1')

    const stats = service.getCurrentYearStats()
    assert.equal(stats.tasks[0].created, 1)
  })

  test('recordTaskCompleted incrémente completed pour un nouveau taskId', ({ assert }) => {
    const service = new StatsService()
    service.recordTaskCreated('list-1', 'Rudy', 'task-1')
    service.recordTaskCompleted('list-1', 'Rudy', 'task-1')

    const stats = service.getCurrentYearStats()
    assert.equal(stats.tasks[0].completed, 1)
  })

  test('recordTaskCompleted sans taskId incrémente en fallback', ({ assert }) => {
    const service = new StatsService()
    service.recordTaskCreated('list-1', 'Rudy', 'task-1')
    service.recordTaskCompleted('list-1', 'Rudy')
    service.recordTaskCompleted('list-1', 'Rudy')

    const stats = service.getCurrentYearStats()
    assert.equal(stats.tasks[0].completed, 2)
  })

  test('updateTaskStatsFromCurrentState recalcule les compteurs depuis zéro', ({ assert }) => {
    const service = new StatsService()
    service.recordTaskCreated('list-1', 'Rudy', 'stale-task')

    service.updateTaskStatsFromCurrentState([
      {
        id: 'list-1',
        title: 'Rudy',
        tasks: [
          { id: 'task-a', title: 'A', status: 'completed' },
          { id: 'task-b', title: 'B', status: 'needsAction' },
        ],
      },
    ])

    const stats = service.getCurrentYearStats()
    assert.equal(stats.tasks[0].created, 2)
    assert.equal(stats.tasks[0].completed, 1)
  })

  test('updateTaskStatsFromCurrentState crée une nouvelle entrée de liste si besoin', ({
    assert,
  }) => {
    const service = new StatsService()

    service.updateTaskStatsFromCurrentState([
      {
        id: 'list-2',
        title: 'Courses',
        tasks: [{ id: 't1', title: 'Pain', status: 'needsAction' }],
      },
    ])

    const stats = service.getCurrentYearStats()
    assert.lengthOf(stats.tasks, 1)
    assert.equal(stats.tasks[0].listTitle, 'Courses')
    assert.equal(stats.tasks[0].created, 1)
    assert.equal(stats.tasks[0].completed, 0)
  })

  test('getPastYearStats retourne les données courantes si aucune archive', ({ assert }) => {
    const service = new StatsService()
    service.recordTaskCreated('list-1', 'Rudy', 'task-1')

    const past = service.getPastYearStats()
    assert.isNotNull(past)
    assert.equal(past!.year, new Date().getFullYear() - 1)
  })

  test('getPastYearStats lit une archive existante et génère userStats/listStats', ({ assert }) => {
    const service = new StatsService()
    const pastYear = new Date().getFullYear() - 1
    const archivePath = path.join(
      tmpDir,
      'app',
      'database',
      'recap',
      `yearly-stats-${pastYear}.json`
    )

    fs.writeFileSync(
      archivePath,
      JSON.stringify({
        year: pastYear,
        tasks: [
          {
            listId: 'list-1',
            listTitle: 'Rudy',
            createdIds: ['t1', 't2'],
            completedIds: ['t1'],
            created: 2,
            completed: 1,
          },
        ],
      })
    )

    const past = service.getPastYearStats()
    assert.isNotNull(past)
    assert.lengthOf(past!.userStats, 5) // Rudy, Caroline, Julie, Luis, Courses
    const rudyStats = past!.userStats.find((u) => u.user === 'Rudy')
    assert.equal(rudyStats?.totalCreated, 2)
    assert.equal(rudyStats?.totalCompleted, 1)
    assert.equal(rudyStats?.completionRate, 50)
    assert.lengthOf(past!.listStats, 1)
    assert.equal(past!.listStats[0].listTitle, 'Rudy')
  })

  test('archiveCurrentYear archive puis réinitialise pour year+1', ({ assert }) => {
    const service = new StatsService()
    service.recordTaskCreated('list-1', 'Rudy', 'task-1')
    const currentYear = new Date().getFullYear()

    service.archiveCurrentYear()

    const archivePath = path.join(
      tmpDir,
      'app',
      'database',
      'recap',
      `yearly-stats-${currentYear}.json`
    )
    assert.isTrue(fs.existsSync(archivePath))

    const stats = service.getCurrentYearStats()
    assert.deepEqual(stats.tasks, [])
  })

  test('recordWeatherDay calcule isRainy/isSunny et les agrégats', ({ assert }) => {
    const service = new StatsService()

    service.recordWeatherDay({
      temp: 20,
      tempMin: 15,
      tempMax: 25,
      feelsLike: 19,
      humidity: 60,
      precip: 0,
      precipProb: 10,
      windSpeed: 5,
      windGust: 8,
      description: 'Clear sky',
      icon: 'clear-day',
      sunrise: '06:00',
      sunset: '21:00',
    })

    const weatherStats = service.getPastYearWeatherStats()
    // Pas d'archive l'an dernier -> retombe sur les données courantes
    assert.isNotNull(weatherStats)
    assert.equal(weatherStats!.days.length, 1)
    assert.isTrue(weatherStats!.days[0].isSunny)
    assert.isFalse(weatherStats!.days[0].isRainy)
    assert.equal(weatherStats!.averageTemp, 20)
    assert.equal(weatherStats!.sunnyDays, 1)
  })

  test('recordWeatherDay détecte un jour pluvieux', ({ assert }) => {
    const service = new StatsService()

    service.recordWeatherDay({
      temp: 12,
      tempMin: 10,
      tempMax: 14,
      feelsLike: 11,
      humidity: 90,
      precip: 5,
      precipProb: 80,
      windSpeed: 10,
      windGust: 15,
      description: 'Pluie forte',
      icon: 'rain',
      sunrise: '06:00',
      sunset: '21:00',
    })

    const weatherStats = service.getPastYearWeatherStats()
    assert.isTrue(weatherStats!.days[0].isRainy)
    assert.isFalse(weatherStats!.days[0].isSunny)
    assert.equal(weatherStats!.rainyDays, 1)
  })

  test("recordWeatherDay n'enregistre pas deux fois le même jour", ({ assert }) => {
    const service = new StatsService()
    const day = {
      temp: 20,
      tempMin: 15,
      tempMax: 25,
      feelsLike: 19,
      humidity: 60,
      precip: 0,
      precipProb: 10,
      windSpeed: 5,
      windGust: 8,
      description: 'Clear',
      icon: 'clear-day',
      sunrise: '06:00',
      sunset: '21:00',
    }
    service.recordWeatherDay(day)
    service.recordWeatherDay(day)

    const weatherStats = service.getPastYearWeatherStats()
    assert.equal(weatherStats!.days.length, 1)
  })

  test("checkAndArchiveIfNeeded n'archive pas en dehors du 31 décembre", ({ assert }) => {
    const service = new StatsService()
    service.recordTaskCreated('list-1', 'Rudy', 'task-1')

    // On ne mocke pas la date ici : le test vérifie juste qu'aucune archive
    // n'est créée un jour "normal" (le test échouerait le 31/12, cas limite
    // accepté pour rester simple).
    const today = new Date()
    if (today.getMonth() !== 11 || today.getDate() !== 31) {
      service.checkAndArchiveIfNeeded()
      const archivePath = path.join(
        tmpDir,
        'app',
        'database',
        'recap',
        `yearly-stats-${today.getFullYear()}.json`
      )
      assert.isFalse(fs.existsSync(archivePath))
    }
  })
})
