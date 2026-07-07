import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTheme } from '../useTheme'

describe('useTheme', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('returns theme object', () => {
    const theme = useTheme()
    expect(theme).toBeDefined()
    expect(typeof theme.isDark.value).toBe('boolean')
  })
})
