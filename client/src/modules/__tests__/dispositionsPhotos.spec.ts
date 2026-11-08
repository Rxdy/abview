import { describe, it, expect } from 'vitest'
import { DISPOSITIONS, DISPOSITION_PAR_DEFAUT, type Emplacement } from '../dispositionsPhotos'
import { REGISTRE } from '../registre'

// Écran de référence (1280 × 720) : une case de la grille et l'écart entre cases
const CASE_L = (1248 - 11 * 10) / 12
const CASE_H = (624 - 7 * 10) / 8

function taille(variante: string, em: Emplacement) {
  const v = REGISTRE.photos!.variantes.find((x) => x.id === variante)!
  const largeurModule = v.largeur * CASE_L + (v.largeur - 1) * 10
  const hauteurModule = v.hauteur * CASE_H + (v.hauteur - 1) * 10
  return { largeur: (largeurModule * em.largeur) / 100, hauteur: (hauteurModule * em.hauteur) / 100 }
}

const aire = (variante: string, em: Emplacement) => {
  const t = taille(variante, em)
  return t.largeur * t.hauteur
}

const plusieurs = Object.entries(DISPOSITIONS).filter(([, d]) => d.emplacements.length > 1)

describe('dispositions du module Photos', () => {
  it('chaque variante du registre a sa disposition, et réciproquement', () => {
    const variantes = REGISTRE.photos!.variantes.map((v) => v.id).sort()
    expect(Object.keys(DISPOSITIONS).sort()).toEqual(variantes)
    expect(variantes).toContain(DISPOSITION_PAR_DEFAUT)
    expect(REGISTRE.photos!.variantes[0]!.id).toBe(DISPOSITION_PAR_DEFAUT)
  })

  it('le nombre d’emplacements : 1, 1, 2, 3, 4 et 5', () => {
    expect(Object.fromEntries(Object.entries(DISPOSITIONS).map(([k, d]) => [k, d.emplacements.length]))).toEqual({
      un: 1, portrait: 1, deux: 2, trois: 3, quatre: 4, galerie: 5,
    })
  })

  it('les emplacements restent dans le module et ne se chevauchent pas', () => {
    for (const [nom, d] of Object.entries(DISPOSITIONS)) {
      for (const em of d.emplacements) {
        expect(em.x, nom).toBeGreaterThanOrEqual(0)
        expect(em.y, nom).toBeGreaterThanOrEqual(0)
        expect(em.x + em.largeur, nom).toBeLessThanOrEqual(100)
        expect(em.y + em.hauteur, nom).toBeLessThanOrEqual(100)
      }
      d.emplacements.forEach((a, i) =>
        d.emplacements.slice(i + 1).forEach((b) => {
          const chevauche = a.x < b.x + b.largeur && b.x < a.x + a.largeur && a.y < b.y + b.hauteur && b.y < a.y + a.hauteur
          expect(chevauche, `${nom} #${i}`).toBe(false)
        })
      )
    }
  })

  it('chaque emplacement a vraiment la forme de son orientation (un paysage est plus large que haut, un portrait plus haut)', () => {
    for (const [nom, d] of Object.entries(DISPOSITIONS)) {
      d.emplacements.forEach((em, i) => {
        const t = taille(nom, em)
        const ratio = t.largeur / t.hauteur
        if (em.orientation === 'paysage') expect(ratio, `${nom} #${i}`).toBeGreaterThan(1.15)
        if (em.orientation === 'portrait') expect(ratio, `${nom} #${i}`).toBeLessThan(0.87)
        if (em.orientation === 'carre') expect(ratio, `${nom} #${i}`).toBeGreaterThan(0.87)
      })
    }
  })

  it('les emplacements n’ont pas tous la même taille', () => {
    for (const [nom, d] of plusieurs) {
      const aires = d.emplacements.map((em) => aire(nom, em))
      const distinctes = aires.filter((a, i) => aires.findIndex((b) => Math.abs(a - b) / a < 0.1) === i)
      expect(distinctes.length, nom).toBeGreaterThanOrEqual(2)
    }
    // la galerie : cinq tailles vraiment différentes
    const aires = DISPOSITIONS.galerie!.emplacements.map((em) => aire('galerie', em))
    for (let i = 0; i < aires.length; i++) {
      for (let j = i + 1; j < aires.length; j++) expect(Math.abs(aires[i]! - aires[j]!) / aires[i]!, `${i}/${j}`).toBeGreaterThan(0.1)
    }
  })

  it('les cadres ne sont pas alignés : aucun ne partage son bord haut ou son bord bas avec un autre', () => {
    for (const [nom, d] of plusieurs) {
      const hauts = d.emplacements.map((e) => e.y)
      const bas = d.emplacements.map((e) => e.y + e.hauteur)
      expect(new Set(hauts).size, `${nom} : bords hauts`).toBe(hauts.length)
      expect(new Set(bas).size, `${nom} : bords bas`).toBe(bas.length)
    }
  })

  it('les cadres penchent à peine : jamais parfaitement droits, jamais de travers', () => {
    for (const [nom, d] of plusieurs) {
      const pentes = d.emplacements.map((e) => e.inclinaison ?? 0)
      expect(pentes.filter((p) => p !== 0).length, nom).toBeGreaterThanOrEqual(1)
      for (const p of pentes) expect(Math.abs(p), nom).toBeLessThanOrEqual(2)
    }
  })

  it('les styles de cadre varient d’un cadre à l’autre', () => {
    for (const [nom, d] of plusieurs) {
      expect(new Set(d.emplacements.map((e) => e.cadre)).size, nom).toBeGreaterThanOrEqual(2)
    }
    expect(new Set(DISPOSITIONS.galerie!.emplacements.map((e) => e.cadre))).toEqual(new Set(['or', 'noir', 'bois', 'ovale']))
  })

  it('le cadre ovale est réservé à un portrait', () => {
    for (const d of Object.values(DISPOSITIONS)) {
      for (const em of d.emplacements) if (em.cadre === 'ovale') expect(em.orientation).toBe('portrait')
    }
  })

  it('la galerie plein écran mélange paysages et portraits de tailles différentes', () => {
    const orientations = DISPOSITIONS.galerie!.emplacements.map((e) => e.orientation)
    expect(orientations).toContain('paysage')
    expect(orientations).toContain('portrait')
    expect(REGISTRE.photos!.variantes.find((v) => v.id === 'galerie')).toMatchObject({ largeur: 12, hauteur: 8 })
  })
})
