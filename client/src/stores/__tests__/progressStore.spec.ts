import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProgressStore } from '../progressStore'

describe('progressStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default progress', () => {
    const store = useProgressStore()
    expect(store.progress).toBeDefined()
  })
})
