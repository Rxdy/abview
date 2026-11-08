import { describe, it, expect } from 'vitest'
import { DISPOSITIONS, DISPOSITION_PAR_DEFAUT } from '../dispositionsPhotos'
import { REGISTRE } from '../registre'
import { seChevauchent } from '../grille'

// Dimensions de l'écran de référence (1280 × 720) : une case de la grille, l'écart entre cases, et le décor du module
const CASE_L = (1248 - 11 * 10) / 12
const CASE_H = (624 - 7 * 10) / 8
const ECART = 10
const MARGE = 20 // marge du module autour des cadres
const ESPACE = 20 // espace entre deux cadres

function tailleEmplacement(variante: string, i: number) {
  const v = REGISTRE.photos!.variantes.find((x) => x.id === variante)!
  const d = DISPOSITIONS[variante]!
  const em = d.emplacements[i]!
  const largeurModule = v.largeur * CASE_L + (v.largeur - 1) * ECART - 2 * MARGE
  const hauteurModule = v.hauteur * CASE_H + (v.hauteur - 1) * ECART - 2 * MARGE
  const unite = (largeurModule - (d.colonnes - 1) * ESPACE) / d.colonnes
  const unitaireH = (hauteurModule - (d.lignes - 1) * ESPACE) / d.lignes
  return {
    largeur: unite * em.largeur + (em.largeur - 1) * ESPACE,
    hauteur: unitaireH * em.hauteur + (em.hauteur - 1) * ESPACE,
  }
}

describe('dispositions du module Photos', () => {
  it('chaque variante du registre a sa disposition, et réciproquement', () => {
    const variantes = REGISTRE.photos!.variantes.map((v) => v.id).sort()
    expect(Object.keys(DISPOSITIONS).sort()).toEqual(variantes)
    expect(variantes).toContain(DISPOSITION_PAR_DEFAUT)
    expect(REGISTRE.photos!.variantes[0]!.id).toBe(DISPOSITION_PAR_DEFAUT)
  })

  it('les emplacements restent dans la petite grille et ne se chevauchent pas', () => {
    for (const [nom, d] of Object.entries(DISPOSITIONS)) {
      for (const em of d.emplacements) {
        expect(em.x, nom).toBeGreaterThanOrEqual(1)
        expect(em.y, nom).toBeGreaterThanOrEqual(1)
        expect(em.x + em.largeur - 1, nom).toBeLessThanOrEqual(d.colonnes)
        expect(em.y + em.hauteur - 1, nom).toBeLessThanOrEqual(d.lignes)
      }
      d.emplacements.forEach((a, i) =>
        d.emplacements.slice(i + 1).forEach((b) => expect(seChevauchent(a, b), nom).toBe(false))
      )
    }
  })

  it('le nombre d’emplacements : 1, 1, 2, 3, 4 et 5', () => {
    expect(Object.fromEntries(Object.entries(DISPOSITIONS).map(([k, d]) => [k, d.emplacements.length]))).toEqual({
      un: 1, portrait: 1, deux: 2, trois: 3, quatre: 4, galerie: 5,
    })
  })

  it('chaque emplacement a vraiment la forme de son orientation (un paysage est plus large que haut, un portrait plus haut)', () => {
    for (const variante of Object.keys(DISPOSITIONS)) {
      DISPOSITIONS[variante]!.emplacements.forEach((em, i) => {
        const { largeur, hauteur } = tailleEmplacement(variante, i)
        const ratio = largeur / hauteur
        if (em.orientation === 'paysage') expect(ratio, `${variante} #${i}`).toBeGreaterThan(1.15)
        if (em.orientation === 'portrait') expect(ratio, `${variante} #${i}`).toBeLessThan(0.87)
        if (em.orientation === 'carre') expect(ratio, `${variante} #${i}`).toBeGreaterThan(0.87)
      })
    }
  })

  it('la galerie plein écran mélange un grand paysage et des portraits', () => {
    const orientations = DISPOSITIONS.galerie!.emplacements.map((e) => e.orientation)
    expect(orientations.filter((o) => o === 'paysage')).toHaveLength(1)
    expect(orientations.filter((o) => o === 'portrait')).toHaveLength(4)
    expect(REGISTRE.photos!.variantes.find((v) => v.id === 'galerie')).toMatchObject({ largeur: 12, hauteur: 8 })
  })
})
