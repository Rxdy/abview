import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

interface Config {
  pickerSessionId?: string
}

// Calculés à l'appel (pas en constante de module) pour rester corrects si
// process.cwd() change entre deux appels, notamment en test.
function getStorageDir(): string {
  return join(process.cwd(), 'storage')
}

function getConfigFile(): string {
  return join(getStorageDir(), 'config.json')
}

function readConfig(): Config {
  try {
    const configFile = getConfigFile()
    if (!existsSync(configFile)) return {}
    return JSON.parse(readFileSync(configFile, 'utf-8'))
  } catch {
    return {}
  }
}

function writeConfig(config: Config): void {
  const storageDir = getStorageDir()
  if (!existsSync(storageDir)) {
    mkdirSync(storageDir, { recursive: true })
  }
  writeFileSync(getConfigFile(), JSON.stringify(config, null, 2))
}

/**
 * Retourne la session Picker ID depuis:
 * 1. Le fichier storage/config.json (sauvegardé via QR code setup) si présent
 * 2. Sinon la variable d'env GOOGLE_PICKER_SESSION_ID en repli
 * (une session fraîchement sauvegardée l'emporte sur une env var périmée)
 */
export function getPickerSessionId(): string | undefined {
  const config = readConfig()
  return config.pickerSessionId || process.env.GOOGLE_PICKER_SESSION_ID
}

/**
 * Sauvegarde la session Picker ID dans storage/config.json
 * (Persiste même si l'env var n'est pas définie)
 */
export function savePickerSessionId(sessionId: string): void {
  const config = readConfig()
  config.pickerSessionId = sessionId
  writeConfig(config)
  console.log(`✅ Session Picker ID sauvegardée: ${sessionId}`)
}
