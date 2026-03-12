import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLanguageStore } from '../languageStore'

describe('languageStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default language', () => {
    const store = useLanguageStore()
    expect(store.language).toBeDefined()
  })
})
