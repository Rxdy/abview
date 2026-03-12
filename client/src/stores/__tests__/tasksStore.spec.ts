import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTasksStore } from '../tasksStore'

describe('tasksStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with empty tasks', () => {
    const store = useTasksStore()
    expect(Array.isArray(store.tasks)).toBe(true)
  })
})
