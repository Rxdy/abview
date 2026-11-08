import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import PhotosModule from '../PhotosModule.vue'
import { photosService } from '../../services/photosService'
import { DUREE_MAX, DUREE_MIN } from '../../modules/dispositionsPhotos'
import type { Orientation, PhotoAffichee } from '../../utils/photosDemo'

let n = 0
const donnee = (o: Orientation): PhotoAffichee => ({ id: `p${n++}`, url: `data:image/svg+xml;utf8,${o}${n}`, orientation: o })

const monter = async (props: Record<string, unknown> = {}) => {
  const w = mount(PhotosModule, { props, global: { stubs: { transition: false } } })
  await flushPromises()
  return w
}

describe('PhotosModule', () => {
  let demandes: { orientations: Orientation[]; exclure: string[] }[]

  beforeEach(() => {
    vi.useFakeTimers()
    n = 0
    demandes = []
    vi.spyOn(photosService, 'aleatoires').mockImplementation(async (orientations, exclure = []) => {
      demandes.push({ orientations, exclure })
      return orientations.map(donnee)
    })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('montre autant d’emplacements, chacun dans un cadre, que la disposition en demande', async () => {
    for (const [variante, nombre] of [['un', 1], ['portrait', 1], ['deux', 2], ['trois', 3], ['quatre', 4], ['cinq', 5]] as const) {
      const w = await monter({ variante })
      expect(w.findAll('.emplacement'), variante).toHaveLength(nombre)
      expect(w.findAll('.cadre'), variante).toHaveLength(nombre)
      w.unmount()
    }
  })

  it('sans variante : une seule photo', async () => {
    expect((await monter()).findAll('.emplacement')).toHaveLength(1)
  })

  it('demande à chaque emplacement une photo de son orientation, en une seule requête au départ', async () => {
    await monter({ variante: 'cinq' })
    expect(demandes).toHaveLength(1)
    expect(demandes[0]!.orientations).toEqual(['paysage', 'portrait', 'paysage', 'carre', 'paysage'])
  })

  it('pose les cadres à des hauteurs et des tailles différentes, très légèrement penchés', async () => {
    const w = await monter({ variante: 'cinq' })
    const styles = w.findAll('.emplacement').map((e) => e.attributes('style')!)
    const tops = styles.map((st) => /top:\s*([\d.]+)%/.exec(st)![1])
    const largeurs = styles.map((st) => /width:\s*([\d.]+)%/.exec(st)![1])
    expect(new Set(tops).size).toBe(5)
    expect(new Set(largeurs).size).toBeGreaterThanOrEqual(4)
    expect(styles.filter((st) => st.includes('rotate(')).length).toBeGreaterThanOrEqual(4)
  })

  it('chaque cadre a son style (doré, noir, bois, rond, arche) : le mur n’est pas uniforme', async () => {
    const w = await monter({ variante: 'cinq' })
    const styles = w.findAll('.cadre').map((c) => ['or', 'noir', 'bois', 'ovale', 'rond', 'arche'].find((s) => c.classes().includes(s)))
    expect(new Set(styles)).toEqual(new Set(['or', 'noir', 'bois', 'rond', 'arche']))
  })

  it('affiche la photo de chaque emplacement', async () => {
    const w = await monter({ variante: 'deux' })
    expect(w.findAll('img')).toHaveLength(2)
    expect(w.findAll('.emplacement').map((e) => e.attributes('data-orientation'))).toEqual(['paysage', 'portrait'])
  })

  it('change la photo d’un emplacement après 20 à 40 secondes, sans toucher aux autres', async () => {
    const w = await monter({ variante: 'deux' })
    const avant = w.findAll('img').map((i) => i.attributes('src'))
    await vi.advanceTimersByTimeAsync(DUREE_MIN - 1)
    expect(w.findAll('img').map((i) => i.attributes('src'))).toEqual(avant) // trop tôt
    await vi.advanceTimersByTimeAsync(DUREE_MAX - DUREE_MIN + 1)
    await flushPromises()
    const apres = w.findAll('img').map((i) => i.attributes('src'))
    expect(apres.some((s, i) => s !== avant[i])).toBe(true) // au moins un a changé
  })

  it('un remplacement demande UNE photo de la bonne orientation, en évitant celles déjà à l’écran', async () => {
    await monter({ variante: 'cinq' })
    demandes.length = 0
    await vi.advanceTimersByTimeAsync(DUREE_MAX)
    await flushPromises()
    expect(demandes.length).toBeGreaterThan(0)
    for (const d of demandes) {
      expect(d.orientations).toHaveLength(1)
      expect(d.exclure.length).toBeGreaterThan(0)
    }
  })

  it('chaque emplacement change à son rythme : tous ne changent pas au même instant', async () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.9).mockReturnValueOnce(0.5)
    await monter({ variante: 'trois' })
    demandes.length = 0
    await vi.advanceTimersByTimeAsync(DUREE_MIN + 1)
    expect(demandes).toHaveLength(1) // seul le premier, au tirage le plus court
  })

  it('continue indéfiniment : les photos changent encore au bout de plusieurs minutes', async () => {
    await monter({ variante: 'un' })
    demandes.length = 0
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
    expect(demandes.length).toBeGreaterThanOrEqual(5)
  })

  it('arrête tout quand le module disparaît', async () => {
    const w = await monter({ variante: 'trois' })
    w.unmount()
    demandes.length = 0
    await vi.advanceTimersByTimeAsync(10 * 60 * 1000)
    expect(demandes).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('un changement de disposition (éditeur) repart de zéro avec le bon nombre d’emplacements', async () => {
    const w = await monter({ variante: 'un' })
    await w.setProps({ variante: 'quatre' })
    await flushPromises()
    expect(w.findAll('.emplacement')).toHaveLength(4)
    expect(demandes.at(-1)!.orientations).toHaveLength(4)
  })

  it('pose les photos sur un mur à moulures (panneaux), décoratif et sans effet sur la lecture', async () => {
    const w = await monter()
    const mur = w.find('.mur')
    expect(mur.attributes('aria-hidden')).toBe('true')
    expect(mur.findAll('.panneau').length).toBeGreaterThanOrEqual(8) // assez pour la largeur de l'écran entier
  })

  it('n’a aucun réglage : le mur et les cadres suivent le thème jour / nuit', async () => {
    const { REGISTRE } = await import('../../modules/registre')
    expect(REGISTRE.photos!.reglages).toBeUndefined()
    const w = await monter({ decor: 'bois' }) // l'ancien réglage de décor est ignoré
    expect(w.classes()).not.toContain('decor-bois')
  })

  it('une disposition inconnue retombe sur une seule photo', async () => {
    expect((await monter({ variante: 'inconnue' })).findAll('.emplacement')).toHaveLength(1)
  })

  it('une panne du service pendant un remplacement ne casse rien : la photo reste, le suivant est replanifié', async () => {
    const w = await monter({ variante: 'un' })
    const avant = w.find('img').attributes('src')
    vi.mocked(photosService.aleatoires).mockResolvedValueOnce([])
    await vi.advanceTimersByTimeAsync(DUREE_MAX)
    await flushPromises()
    expect(w.find('img').attributes('src')).toBe(avant)
    demandes.length = 0
    await vi.advanceTimersByTimeAsync(DUREE_MAX)
    expect(demandes.length).toBeGreaterThan(0)
  })
})
