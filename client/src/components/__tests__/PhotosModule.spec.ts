import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import PhotosModule from '../PhotosModule.vue'
import { photosService } from '../../services/photosService'
import { DUREE_CHANGEMENT } from '../../modules/dispositionsPhotos'
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
    for (const [variante, nombre] of [['un', 1], ['portrait', 1], ['galerie', 7]] as const) {
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
    await monter({ variante: 'galerie' })
    expect(demandes).toHaveLength(1)
    expect(demandes[0]!.orientations).toEqual(['paysage', 'paysage', 'paysage', 'paysage', 'portrait', 'portrait', 'portrait'])
  })

  it('pose sept grands cadres de tailles différentes, très légèrement penchés', async () => {
    const w = await monter({ variante: 'galerie' })
    const styles = w.findAll('.emplacement').map((e) => e.attributes('style')!)
    const largeurs = styles.map((st) => /width:\s*([\d.]+)%/.exec(st)![1])
    expect(styles).toHaveLength(7)
    expect(new Set(largeurs).size).toBeGreaterThanOrEqual(5)
    expect(styles.filter((st) => st.includes('rotate(')).length).toBe(7)
  })

  it('chaque cadre a son style (doré, noir, noyer, arche) : le mur n’est pas uniforme', async () => {
    const w = await monter({ variante: 'galerie' })
    const styles = w.findAll('.cadre').map((c) => ['or', 'noir', 'bois', 'ovale', 'arche'].find((s) => c.classes().includes(s)))
    expect(new Set(styles)).toEqual(new Set(['or', 'noir', 'bois', 'arche']))
  })

  it('deux appliques de tableau (lampes) éclairent des cadres', async () => {
    const w = await monter({ variante: 'galerie' })
    expect(w.findAll('.lampe')).toHaveLength(2)
  })

  it('affiche la photo de chaque emplacement', async () => {
    const w = await monter({ variante: 'galerie' })
    expect(w.findAll('img')).toHaveLength(7)
    expect(w.findAll('.emplacement').map((e) => e.attributes('data-orientation'))).toEqual(['paysage', 'paysage', 'paysage', 'paysage', 'portrait', 'portrait', 'portrait'])
  })

  it('change toutes les photos en même temps, au bout de 30 secondes', async () => {
    const w = await monter({ variante: 'galerie' })
    const avant = w.findAll('img').map((i) => i.attributes('src'))
    await vi.advanceTimersByTimeAsync(DUREE_CHANGEMENT - 1)
    expect(w.findAll('img').map((i) => i.attributes('src'))).toEqual(avant) // trop tôt
    await vi.advanceTimersByTimeAsync(2)
    await vi.advanceTimersByTimeAsync(1000) // laisse finir le fondu
    await flushPromises()
    const apres = w.findAll('img').map((i) => i.attributes('src'))
    expect(apres).toHaveLength(7)
    apres.forEach((src, i) => expect(src, `emplacement ${i}`).not.toBe(avant[i])) // aucun n'est resté en arrière
  })

  it('un renouvellement fait UNE requête pour tous les emplacements, en évitant les photos à l’écran', async () => {
    await monter({ variante: 'galerie' })
    const affichees = vi.mocked(photosService.aleatoires).mock.results.length
    demandes.length = 0
    await vi.advanceTimersByTimeAsync(DUREE_CHANGEMENT + 1)
    await flushPromises()
    expect(affichees).toBe(1)
    expect(demandes).toHaveLength(1)
    expect(demandes[0]!.orientations).toEqual(['paysage', 'paysage', 'paysage', 'paysage', 'portrait', 'portrait', 'portrait'])
    expect(demandes[0]!.exclure).toHaveLength(7)
  })

  it('jamais deux fois la même photo à l’écran', async () => {
    const w = await monter({ variante: 'galerie' })
    for (let tour = 0; tour < 4; tour++) {
      const srcs = w.findAll('img').map((i) => i.attributes('src'))
      expect(new Set(srcs).size, `tour ${tour}`).toBe(srcs.length)
      await vi.advanceTimersByTimeAsync(DUREE_CHANGEMENT + 1)
      await flushPromises()
    }
  })

  it('continue indéfiniment : les photos changent encore au bout de plusieurs minutes', async () => {
    await monter({ variante: 'un' })
    demandes.length = 0
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
    expect(demandes.length).toBeGreaterThanOrEqual(5)
  })

  it('arrête tout quand le module disparaît', async () => {
    const w = await monter({ variante: 'galerie' })
    w.unmount()
    demandes.length = 0
    await vi.advanceTimersByTimeAsync(10 * 60 * 1000)
    expect(demandes).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('un changement de disposition (éditeur) repart de zéro avec le bon nombre d’emplacements', async () => {
    const w = await monter({ variante: 'un' })
    await w.setProps({ variante: 'galerie' })
    await flushPromises()
    expect(w.findAll('.emplacement')).toHaveLength(7)
    expect(demandes.at(-1)!.orientations).toHaveLength(7)
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
    await vi.advanceTimersByTimeAsync(DUREE_CHANGEMENT + 1)
    await flushPromises()
    expect(w.find('img').attributes('src')).toBe(avant)
    demandes.length = 0
    await vi.advanceTimersByTimeAsync(DUREE_CHANGEMENT + 1)
    expect(demandes.length).toBeGreaterThan(0)
  })
})
