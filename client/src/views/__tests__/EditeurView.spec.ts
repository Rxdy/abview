import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import EditeurView from '../EditeurView.vue'
import { configurationsService } from '../../services/configurationsService'
import { CONFIGURATION_PAR_DEFAUT } from '../../modules/configuration'
import { CLE_APERCU } from '../../modules/apercu'

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
type Wrapper = Awaited<ReturnType<typeof monter>>
const bouton = (w: Wrapper, texte: string) => w.findAll('button').find((b) => b.text().includes(texte))!
const palette = (w: Wrapper, titre: string) => w.find(`[aria-label="Ajouter : ${titre}"]`)
const saisirJeton = async (w: Wrapper, valeur = 'secret') => {
  await w.find('[aria-label="Réglage du jeton"]').trigger('click')
  await w.find('input[type=password]').setValue(valeur)
}
const choisir = async (w: Wrapper, id: string) => {
  await w.find('select[aria-label="Configuration"]').setValue(id)
  await flushPromises()
}

describe('EditeurView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    localStorage.clear()
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

  it('liste les configurations dans un menu et marque l’active', async () => {
    const w = await monter()
    const options = w.findAll('select[aria-label="Configuration"] option').map((o) => o.text())
    expect(options).toEqual(expect.arrayContaining(['Semaine — active', 'Vacances']))
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

  it('propose les modules par des icônes, sans libellé visible', async () => {
    const w = await monter()
    const outils = w.findAll('.palette .outil')
    expect(outils).toHaveLength(3)
    for (const o of outils) {
      expect(o.find('svg path').exists()).toBe(true)
      expect(o.text()).toBe('') // le nom est dans l'aria-label et l'infobulle
      expect(o.attributes('aria-label')).toMatch(/^Ajouter : /)
    }
  })

  it('ouvre une configuration enregistrée pour la modifier', async () => {
    const w = await monter()
    await choisir(w, 'vacances')
    expect(service.obtenir).toHaveBeenCalledWith('vacances')
    expect(w.findAll('.module')).toHaveLength(1)
    expect((w.find('input[aria-label="Nom de la configuration"]').element as HTMLInputElement).value).toBe('Vacances')
  })

  it('sans jeton, « Enregistrer » ouvre le réglage du jeton au lieu d’écrire', async () => {
    const w = await monter()
    await bouton(w, 'Enregistrer').trigger('click')
    expect(service.enregistrer).not.toHaveBeenCalled()
    expect(w.find('input[type=password]').exists()).toBe(true)
    expect(w.text()).toContain('Saisissez le jeton')
  })

  it('enregistre avec le jeton, sous un identifiant tiré du nom', async () => {
    const w = await monter()
    await saisirJeton(w)
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
    await choisir(w, 'vacances')
    await saisirJeton(w)
    await bouton(w, 'Enregistrer et activer').trigger('click')
    await flushPromises()
    expect(service.enregistrer).toHaveBeenCalledWith('vacances', expect.anything(), 'secret')
    expect(service.activer).toHaveBeenCalledWith('vacances', 'secret')
  })

  it('dit simplement quand le jeton est refusé', async () => {
    service.enregistrer.mockRejectedValue(new Error('HTTP error! status: 401'))
    const w = await monter()
    await saisirJeton(w, 'mauvais')
    await bouton(w, 'Enregistrer').trigger('click')
    await flushPromises()
    expect(w.text()).toContain('Jeton refusé')
  })

  it('retire un module sélectionné, puis le remet d’un clic sur son icône', async () => {
    const w = await monter()
    await w.findAll('.module')[1]!.trigger('click') // la météo
    await bouton(w, 'Retirer').trigger('click')
    expect(w.findAll('.module')).toHaveLength(2)
    await palette(w, 'Météo').trigger('click')
    expect(w.findAll('.module')).toHaveLength(3)
  })

  it('grise l’icône d’un module déjà placé, plutôt que d’afficher un message', async () => {
    const w = await monter()
    for (const titre of ['Agenda', 'Météo']) {
      expect(palette(w, titre).attributes('disabled')).toBeDefined() // déjà sur la grille (1 au plus)
      expect(palette(w, titre).attributes('title')).toContain('déjà placé')
    }
    await palette(w, 'Agenda').trigger('click')
    expect(w.findAll('.module')).toHaveLength(3)
    expect(w.find('.message').exists()).toBe(false) // aucun message : l'icône grisée suffit
  })

  it('l’icône se dégrise quand le module est retiré de la grille', async () => {
    const w = await monter()
    await w.findAll('.module')[1]!.trigger('click') // la météo
    await bouton(w, 'Retirer').trigger('click')
    expect(palette(w, 'Météo').attributes('disabled')).toBeUndefined()
    expect(palette(w, 'Agenda').attributes('disabled')).toBeDefined()
  })

  it('grise l’icône quand il n’y a plus de place, avec la raison en infobulle', async () => {
    const w = await monter()
    await w.findAll('.module')[0]!.trigger('click') // l'agenda
    await bouton(w, 'Retirer').trigger('click')
    await palette(w, 'Tâches').trigger('click') // 8×3 en haut à gauche
    await palette(w, 'Tâches').trigger('click') // 8×3 sous la première
    expect(palette(w, 'Tâches').attributes('disabled')).toBeDefined() // plus de place pour une troisième 8×3
    expect(palette(w, 'Tâches').attributes('title')).toContain('plus de place')
  })

  it('règle les listes d’un module Tâches, et signale deux exemplaires identiques', async () => {
    const w = await monter()
    await w.findAll('.module')[2]!.trigger('click') // les tâches
    await w.find('input[aria-label="Listes affichées"]').setValue('Julie, Action')
    await w.find('input[aria-label="Listes affichées"]').trigger('change')
    expect(w.find('input[aria-label="Listes affichées"]').exists()).toBe(true)
    expect((w.find('input[aria-label="Listes affichées"]').element as HTMLInputElement).value).toBe('Julie, Action')
    expect(w.find('.erreurs').exists()).toBe(false)
  })

  it('déplacer un module sur un autre pousse celui-ci ailleurs, et le dit', async () => {
    const w = await monter()
    await w.findAll('.module')[2]!.trigger('click') // les tâches, à côté de la météo
    await w.find('[aria-label="Aller à gauche"]').trigger('click') // chevauche la météo
    expect(w.text()).toContain('« Météo » a été déplacé et réduit (compact)')
    expect(w.find('.erreurs').exists()).toBe(false)
    expect(w.findAll('.module')).toHaveLength(3) // personne n'a disparu
  })

  it('ne bloque pas : quand il n’y a nulle part où pousser, rien ne bouge et on est prévenu', async () => {
    const w = await monter()
    const avant = w.findAll('.module').map((m) => m.attributes('style'))
    await w.findAll('.module')[1]!.trigger('click') // la météo
    await w.find('[aria-label="Monter"]').trigger('click') // elle monterait sur l'agenda, qui n'a pas de place ailleurs
    expect(w.text()).toContain('Pas de place pour déplacer les modules voisins')
    expect(w.findAll('.module').map((m) => m.attributes('style'))).toEqual(avant)
    await w.find('[aria-label="Aller à gauche"]').trigger('click') // bord de la grille : sans effet, mais l'éditeur reste utilisable
    await w.findAll('.module')[2]!.trigger('click')
    expect(w.find('[aria-label="Taille du module"]').exists()).toBe(true)
  })

  it('refuse de supprimer l’active, supprime une autre', async () => {
    const w = await monter()
    await choisir(w, 'semaine') // l'active
    expect(bouton(w, 'Supprimer').attributes('disabled')).toBeDefined()
    await choisir(w, 'vacances')
    await saisirJeton(w)
    await bouton(w, 'Supprimer').trigger('click')
    await flushPromises()
    expect(service.supprimer).toHaveBeenCalledWith('vacances', 'secret')
  })

  it('garde le jeton le temps de la session de navigation', async () => {
    const w = await monter()
    await saisirJeton(w)
    await w.find('input[type=password]').trigger('change')
    expect(sessionStorage.getItem('abview-jeton-admin')).toBe('secret')
  })

  it('« Voir le rendu » dépose la disposition et ouvre la page d’aperçu dans un autre onglet', async () => {
    const ouvrir = vi.spyOn(window, 'open').mockReturnValue(null)
    const w = await monter()
    await w.findAll('.module')[1]!.trigger('click')
    await bouton(w, 'Retirer').trigger('click') // une disposition non enregistrée
    await bouton(w, 'Voir le rendu').trigger('click')

    const depose = JSON.parse(localStorage.getItem(CLE_APERCU)!)
    expect(depose.placements.map((p: { id: string }) => p.id)).toEqual(['calendrier', 'taches'])
    expect(ouvrir).toHaveBeenCalledWith('/apercu', '_blank')
    expect(service.enregistrer).not.toHaveBeenCalled() // l'aperçu n'enregistre rien
    ouvrir.mockRestore()
  })
})
