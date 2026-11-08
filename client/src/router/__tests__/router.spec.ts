import { describe, it, expect } from 'vitest'
import router from '../index'
import DashboardView from '../../views/DashboardView.vue'

describe('router', () => {
  it('sert le tableau de bord sur /', async () => {
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('dashboard')
    expect(router.currentRoute.value.matched[0].components?.default).toBe(DashboardView)
  })

  it("n'a que deux pages : l'écran et l'éditeur de disposition", () => {
    expect(router.getRoutes().map((r) => r.path).sort()).toEqual(['/', '/editeur'])
  })
})
