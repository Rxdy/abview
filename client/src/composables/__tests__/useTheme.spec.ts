import { describe, it, expect } from 'vitest'
import { useTheme } from '../useTheme'

describe('useTheme', () => {
  it('returns theme object', () => {
    const theme = useTheme()
    expect(theme).toBeDefined()
    expect(typeof theme.toggleTheme).toBe('function')
  })
})
