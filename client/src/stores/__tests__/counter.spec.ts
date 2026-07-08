import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCounterStore } from '../counter'

describe('counterStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default count', () => {
    const store = useCounterStore()
    expect(store.count).toBe(0)
    expect(store.doubleCount).toBe(0)
  })

  it('increment incrémente le compteur et le double suit', () => {
    const store = useCounterStore()
    store.increment()
    store.increment()
    expect(store.count).toBe(2)
    expect(store.doubleCount).toBe(4)
  })
})
