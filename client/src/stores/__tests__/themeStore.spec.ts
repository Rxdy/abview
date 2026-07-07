import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useThemeStore } from '../themeStore'

describe('themeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default theme', () => {
    const store = useThemeStore()
    expect(store.isDark).toBe(false)
  })
})
