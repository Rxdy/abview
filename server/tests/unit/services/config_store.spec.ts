import { test } from '@japa/runner'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { getPickerSessionId, savePickerSessionId } from '#services/config_store'

test.group('config_store', (group) => {
  let tmpDir: string
  let originalCwd: string
  let originalEnv: string | undefined

  group.each.setup(() => {
    originalCwd = process.cwd()
    originalEnv = process.env.GOOGLE_PICKER_SESSION_ID
    delete process.env.GOOGLE_PICKER_SESSION_ID
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'abview-config-'))
    process.chdir(tmpDir)
    return () => {
      process.chdir(originalCwd)
      fs.rmSync(tmpDir, { recursive: true, force: true })
      if (originalEnv === undefined) {
        delete process.env.GOOGLE_PICKER_SESSION_ID
      } else {
        process.env.GOOGLE_PICKER_SESSION_ID = originalEnv
      }
    }
  })

  test('getPickerSessionId retourne undefined si rien n’est configuré', ({ assert }) => {
    assert.isUndefined(getPickerSessionId())
  })

  test('getPickerSessionId lit la variable d’environnement en priorité', ({ assert }) => {
    process.env.GOOGLE_PICKER_SESSION_ID = 'env-session-id'
    assert.equal(getPickerSessionId(), 'env-session-id')
  })

  test('savePickerSessionId persiste dans storage/config.json', ({ assert }) => {
    savePickerSessionId('file-session-id')

    const configPath = path.join(tmpDir, 'storage', 'config.json')
    assert.isTrue(fs.existsSync(configPath))
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    assert.equal(raw.pickerSessionId, 'file-session-id')
    assert.equal(getPickerSessionId(), 'file-session-id')
  })

  test('le fichier sauvegardé prime sur la variable d’environnement', ({ assert }) => {
    savePickerSessionId('file-session-id')
    process.env.GOOGLE_PICKER_SESSION_ID = 'env-session-id'

    assert.equal(getPickerSessionId(), 'file-session-id')
  })
})
