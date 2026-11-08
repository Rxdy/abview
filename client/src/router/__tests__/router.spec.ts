import { describe, it, expect } from 'vitest'
import router from '../index'
import DashboardView from '../../views/DashboardView.vue'

describe('router', () => {
  it('sert le tableau de bord sur /', async () => {
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('dashboard')
    expect(router.currentRoute.value.matched[0].components?.default).toBe(DashboardView)
  })

  it("n'a qu'une seule route : le kiosque n'a pas d'autre page", () => {
    expect(router.getRoutes().map((r) => r.path)).toEqual(['/'])
  })
})
