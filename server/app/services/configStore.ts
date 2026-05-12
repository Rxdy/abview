import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const STORAGE_DIR = join(process.cwd(), 'storage')
const CONFIG_FILE = join(STORAGE_DIR, 'config.json')

interface Config {
  pickerSessionId?: string
}

function readConfig(): Config {
  try {
    if (!existsSync(CONFIG_FILE)) return {}
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'))
  } catch {
    return {}
  }
}

function writeConfig(config: Config): void {
  if (!existsSync(STORAGE_DIR)) {
    mkdirSync(STORAGE_DIR, { recursive: true })
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

/**
 * Retourne la session Picker ID depuis:
 * 1. La variable d'env GOOGLE_PICKER_SESSION_ID (priorité)
 * 2. Le fichier storage/config.json (sauvegardé via QR code setup)
 */
export function getPickerSessionId(): string | undefined {
  return process.env.GOOGLE_PICKER_SESSION_ID || readConfig().pickerSessionId
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
