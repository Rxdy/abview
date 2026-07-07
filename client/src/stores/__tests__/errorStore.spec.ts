import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useErrorStore } from '../errorStore'

describe('errorStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with no error', () => {
    const store = useErrorStore()
    expect(store.errors).toEqual([])
    expect(store.currentToast).toBeNull()
  })
})
