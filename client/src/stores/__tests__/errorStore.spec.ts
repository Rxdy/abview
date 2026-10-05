import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useErrorStore } from '../errorStore'

describe('errorStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with no error', () => {
    const store = useErrorStore()
    expect(store.errors).toEqual([])
    expect(store.currentToast).toBeNull()
    expect(store.hasErrors).toBe(false)
  })

  it('addError ajoute une erreur et affiche un toast', () => {
    const store = useErrorStore()
    store.addError({ type: 'network', message: 'Erreur réseau', module: 'weather' })

    expect(store.errors).toHaveLength(1)
    expect(store.errors[0]).toMatchObject({
      type: 'network',
      message: 'Erreur réseau',
      module: 'weather',
    })
    expect(store.errors[0].id).toBeTruthy()
    expect(store.errors[0].timestamp).toBeTypeOf('number')
    expect(store.hasErrors).toBe(true)
    expect(store.showToast).toBe(true)
    expect(store.currentToast).toEqual(store.errors[0])
  })

  it('le toast disparaît automatiquement après 5 secondes', () => {
    vi.useFakeTimers()
    const store = useErrorStore()
    store.addError({ type: 'generic', message: 'boom', module: 'tasks' })

    expect(store.showToast).toBe(true)
    vi.advanceTimersByTime(5000)
    expect(store.showToast).toBe(false)
    expect(store.currentToast).toBeNull()
  })

  it('removeError supprime uniquement l’erreur ciblée', () => {
    vi.useFakeTimers()
    const store = useErrorStore()
    store.addError({ type: 'network', message: 'a', module: 'weather' })
    vi.advanceTimersByTime(1) // garantit des ids Date.now() distincts
    store.addError({ type: 'generic', message: 'b', module: 'tasks' })

    const [first, second] = store.errors
    store.removeError(first.id)

    expect(store.errors).toHaveLength(1)
    expect(store.errors[0].id).toBe(second.id)
  })

  it('clearErrors vide toutes les erreurs', () => {
    const store = useErrorStore()
    store.addError({ type: 'network', message: 'a', module: 'weather' })
    store.clearErrors()

    expect(store.errors).toEqual([])
    expect(store.hasErrors).toBe(false)
  })

  it('errorsByModule filtre par module', () => {
    vi.useFakeTimers()
    const store = useErrorStore()
    store.addError({ type: 'network', message: 'a', module: 'weather' })
    vi.advanceTimersByTime(1)
    store.addError({ type: 'generic', message: 'b', module: 'tasks' })

    expect(store.errorsByModule('weather')).toHaveLength(1)
    expect(store.errorsByModule('weather')[0].message).toBe('a')
    expect(store.errorsByModule('inconnu')).toEqual([])
  })

  it('getErrorMessage traduit via le languageStore', () => {
    const store = useErrorStore()
    expect(store.getErrorMessage('networkError')).toBe('Erreur réseau')
  })

  it('getErrorMessage retombe sur le type si la clé est inconnue', () => {
    const store = useErrorStore()
    expect(store.getErrorMessage('cle-inconnue')).toBe('cle-inconnue')
  })
})
