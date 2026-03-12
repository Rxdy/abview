import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDashboardStore } from '../dashboardStore'

describe('dashboardStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default dashboard state', () => {
    const store = useDashboardStore()
    expect(store).toBeDefined()
  })
})
