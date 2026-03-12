import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useErrorStore } from '../errorStore'

describe('errorStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with no error', () => {
    const store = useErrorStore()
    expect(store.error).toBeNull()
  })
})
