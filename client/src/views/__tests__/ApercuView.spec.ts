import { describe, it, expect, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ApercuView from '../ApercuView.vue'
import { useDashboardStore } from '../../stores/dashboardStore'
import { CONFIGURATION_PAR_DEFAUT } from '../../modules/configuration'
import { CLE_APERCU } from '../../modules/apercu'

const monter = () =>
  mount(ApercuView, {
    global: { stubs: { CalendarModule: true, WeatherModule: true, TasksModule: true, NotificationModal: true } },
  })

describe('ApercuView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('montre en vrai la disposition déposée par l’éditeur, et dit qu’elle n’est pas enregistrée', async () => {
    const seule = { nom: 'Météo seule', placements: [{ id: 'm', module: 'meteo', x: 1, y: 1 }] }
    localStorage.setItem(CLE_APERCU, JSON.stringify(seule))
    const w = monter()
    await flushPromises()
    expect(useDashboardStore().configuration).toEqual(seule)
    expect(w.find('[data-module=meteo]').exists()).toBe(true)
    expect(w.find('[data-module=calendrier]').exists()).toBe(false)
    expect(w.text()).toContain('Aperçu — non enregistré')
  })

  it('sans aperçu déposé, explique quoi faire et garde la disposition en place', () => {
    const w = monter()
    expect(w.text()).toContain('Aucun aperçu')
    expect(useDashboardStore().configuration).toEqual(CONFIGURATION_PAR_DEFAUT)
  })

  it('refuse un aperçu invalide ou illisible', () => {
    localStorage.setItem(CLE_APERCU, JSON.stringify({ nom: 'x', placements: [{ id: 'a', module: 'inconnu', x: 1, y: 1 }] }))
    expect(monter().text()).toContain('Aucun aperçu')
    localStorage.setItem(CLE_APERCU, '{ pas du json')
    expect(monter().text()).toContain('Aucun aperçu')
  })

  it('une disposition figée ne va pas chercher celle du serveur', async () => {
    localStorage.setItem(CLE_APERCU, JSON.stringify(CONFIGURATION_PAR_DEFAUT))
    const store = useDashboardStore()
    let suivis = 0
    store.suivreConfiguration = () => {
      suivis++
      return () => {}
    }
    monter()
    expect(suivis).toBe(0)
  })
})
