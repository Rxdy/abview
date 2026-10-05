import { describe, it, expect } from 'vitest'
import * as slides from '../annual-recap'

describe('annual-recap/index', () => {
  it('exporte toutes les slides', () => {
    expect(slides.CelebrationSlide).toBeDefined()
    expect(slides.EventsSlide).toBeDefined()
    expect(slides.TasksSlide).toBeDefined()
    expect(slides.WeatherSlide).toBeDefined()
    expect(slides.UserStatsSlide).toBeDefined()
  })
})
