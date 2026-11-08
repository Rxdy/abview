import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import VeilleView from '../VeilleView.vue'
import { photosService } from '../../services/photosService'

describe('VeilleView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(photosService, 'aleatoires').mockImplementation(async (o) => o.map((orientation, i) => ({ id: `p${i}`, url: 'data:,', orientation })))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('montre un mur de cinq cadres sur toute la page', async () => {
    const w = mount(VeilleView)
    await flushPromises()
    expect(w.findAll('.cadre')).toHaveLength(5)
    expect(w.find('.veille').exists()).toBe(true)
  })

  it('demande surtout des portraits : quatre portraits et un seul paysage', async () => {
    mount(VeilleView)
    await flushPromises()
    const orientations = vi.mocked(photosService.aleatoires).mock.calls[0]![0]
    expect(orientations.filter((o) => o === 'portrait')).toHaveLength(4)
    expect(orientations.filter((o) => o === 'paysage')).toHaveLength(1)
  })
})
