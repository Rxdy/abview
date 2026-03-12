import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCounterStore } from '../counter'

describe('counterStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default count', () => {
    const store = useCounterStore()
    expect(store.count).toBeDefined()
  })
})
