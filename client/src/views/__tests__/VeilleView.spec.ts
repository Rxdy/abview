import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import VeilleView from '../VeilleView.vue'
import { photosService } from '../../services/photosService'

const monter = async (recherche = '') => {
  window.history.replaceState({}, '', `/veille${recherche}`)
  const w = mount(VeilleView)
  await flushPromises()
  return w
}

describe('VeilleView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(photosService, 'aleatoires').mockImplementation(async (o) => o.map((orientation, i) => ({ id: `p${i}`, url: 'data:,', orientation })))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    window.history.replaceState({}, '', '/')
  })

  it('montre un mur de quatre cadres par défaut, sur toute la page', async () => {
    const w = await monter()
    expect(w.findAll('.cadre')).toHaveLength(4)
    expect(w.find('.veille').exists()).toBe(true)
  })

  it('?dispo= choisit la disposition parmi celles du mode veille', async () => {
    for (const [dispo, nombre] of [['deux', 2], ['trois', 3], ['quatre', 4], ['cinq', 5]] as const) {
      expect((await monter(`?dispo=${dispo}`)).findAll('.cadre')).toHaveLength(nombre)
    }
  })

  it('refuse une disposition de mode permanent ou inconnue : retombe sur quatre cadres', async () => {
    expect((await monter('?dispo=un')).findAll('.cadre')).toHaveLength(4)
    expect((await monter('?dispo=n-importe-quoi')).findAll('.cadre')).toHaveLength(4)
  })
})
