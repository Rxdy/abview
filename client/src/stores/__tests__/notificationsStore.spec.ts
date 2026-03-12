import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotificationsStore } from '../notificationsStore'

describe('notificationsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with empty notifications', () => {
    const store = useNotificationsStore()
    expect(Array.isArray(store.notifications)).toBe(true)
    expect(store.notifications.length).toBe(0)
  })
})
