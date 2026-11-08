import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import EditeurView from '../EditeurView.vue'
import { configurationsService } from '../../services/configurationsService'
import { CONFIGURATION_PAR_DEFAUT } from '../../modules/configuration'

vi.mock('../../services/configurationsService', async (original) => ({
  ...(await original<typeof import('../../services/configurationsService')>()),
  configurationsService: {
    liste: vi.fn(),
    obtenir: vi.fn(),
    enregistrer: vi.fn(),
    supprimer: vi.fn(),
    activer: vi.fn(),
  },
}))

const service = vi.mocked(configurationsService)

const monter = async () => {
  const wrapper = mount(EditeurView)
  await flushPromises()
  return wrapper
}
const bouton = (wrapper: ReturnType<typeof mount>, texte: string) =>
  wrapper.findAll('button').find((b) => b.text().includes(texte))!

describe('EditeurView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    service.liste.mockResolvedValue({
      actif: 'semaine',
      configurations: [
        { id: 'semaine', nom: 'Semaine' },
        { id: 'vacances', nom: 'Vacances' },
      ],
    })
    service.obtenir.mockResolvedValue({ nom: 'Vacances', placements: [{ id: 'meteo', module: 'meteo', x: 1, y: 1 }] })
    service.enregistrer.mockResolvedValue({ id: 'x' })
    service.activer.mockResolvedValue({ id: 'x' })
    service.supprimer.mockResolvedValue({ id: 'x' })
  })

  it('liste les configurations et marque l’active', async () => {
    const w = await monter()
    expect(w.text()).toContain('Semaine')
    expect(w.text()).toContain('Vacances')
    expect(w.findAll('.badge')).toHaveLength(1)
  })

  it('affiche les trois modules de la disposition standard sur la grille', async () => {
    const w = await monter()
    expect(w.findAll('.module').map((m) => m.text())).toEqual([
      expect.stringContaining('Agenda'),
      expect.stringContaining('Météo'),
      expect.stringContaining('Tâches'),
    ])
    expect(w.findAll('.case')).toHaveLength(12 * 8)
  })

  it('ouvre une configuration enregistrée pour la modifier', async () => {
    const w = await monter()
    await w.findAll('.ligne')[1]!.trigger('click')
    await flushPromises()
    expect(service.obtenir).toHaveBeenCalledWith('vacances')
    expect(w.findAll('.module')).toHaveLength(1)
    expect((w.find('input[aria-label="Nom de la configuration"]').element as HTMLInputElement).value).toBe('Vacances')
  })

  it('refuse d’enregistrer sans jeton', async () => {
    const w = await monter()
    expect(bouton(w, 'Enregistrer').attributes('disabled')).toBeDefined()
  })

  it('enregistre avec le jeton, sous un identifiant tiré du nom', async () => {
    const w = await monter()
    await w.find('input[type=password]').setValue('secret')
    await w.find('input[aria-label="Nom de la configuration"]').setValue('Semaine d’école')
    await bouton(w, 'Enregistrer').trigger('click')
    await flushPromises()
    expect(service.enregistrer).toHaveBeenCalledWith(
      'semaine-d-ecole',
      { nom: 'Semaine d’école', placements: CONFIGURATION_PAR_DEFAUT.placements },
      'secret'
    )
    expect(w.text()).toContain('Enregistrée')
  })

  it('« Enregistrer et activer » enregistre puis active', async () => {
    const w = await monter()
    await w.find('input[type=password]').setValue('secret')
    await w.findAll('.ligne')[1]!.trigger('click')
    await flushPromises()
    await bouton(w, 'Enregistrer et activer').trigger('click')
    await flushPromises()
    expect(service.enregistrer).toHaveBeenCalledWith('vacances', expect.anything(), 'secret')
    expect(service.activer).toHaveBeenCalledWith('vacances', 'secret')
  })

  it('dit simplement quand le jeton est refusé', async () => {
    service.enregistrer.mockRejectedValue(new Error('HTTP error! status: 401'))
    const w = await monter()
    await w.find('input[type=password]').setValue('mauvais')
    await bouton(w, 'Enregistrer').trigger('click')
    await flushPromises()
    expect(w.text()).toContain('Jeton refusé')
  })

  it('retire un module sélectionné et ajoute un module quand il y a la place', async () => {
    const w = await monter()
    await w.findAll('.module')[1]!.trigger('click') // la météo
    await bouton(w, 'Retirer').trigger('click')
    expect(w.findAll('.module')).toHaveLength(2)
    await bouton(w, 'Ajouter : Météo').trigger('click')
    expect(w.findAll('.module')).toHaveLength(3)
  })

  it('refuse d’ajouter un module quand la grille est pleine', async () => {
    const w = await monter()
    await bouton(w, 'Ajouter : Agenda').trigger('click')
    expect(w.findAll('.module')).toHaveLength(3)
    expect(w.text()).toContain('Pas assez de place')
  })

  it('déplace avec les flèches, refuse un déplacement qui chevauche', async () => {
    const w = await monter()
    await w.findAll('.module')[1]!.trigger('click') // la météo, en bas à gauche
    await w.find('[aria-label="Aller à gauche"]').trigger('click') // déjà au bord
    expect(w.text()).toContain('Déplacement impossible')
    await w.find('[aria-label="Aller à droite"]').trigger('click') // chevauche les tâches
    expect(w.text()).toContain('Déplacement impossible')
  })

  it('refuse de supprimer l’active, supprime une autre', async () => {
    const w = await monter()
    await w.findAll('.ligne')[0]!.trigger('click') // semaine, active
    await flushPromises()
    expect(bouton(w, 'Supprimer').attributes('disabled')).toBeDefined()
    await w.findAll('.ligne')[1]!.trigger('click')
    await flushPromises()
    await w.find('input[type=password]').setValue('secret')
    await bouton(w, 'Supprimer').trigger('click')
    await flushPromises()
    expect(service.supprimer).toHaveBeenCalledWith('vacances', 'secret')
  })

  it('« Revenir au standard » désactive la configuration active', async () => {
    const w = await monter()
    await w.find('input[type=password]').setValue('secret')
    await bouton(w, 'Revenir au standard').trigger('click')
    await flushPromises()
    expect(service.activer).toHaveBeenCalledWith(null, 'secret')
  })

  it('garde le jeton le temps de la session de navigation', async () => {
    const w = await monter()
    const champ = w.find('input[type=password]')
    await champ.setValue('secret')
    await champ.trigger('change')
    expect(sessionStorage.getItem('abview-jeton-admin')).toBe('secret')
  })
})
