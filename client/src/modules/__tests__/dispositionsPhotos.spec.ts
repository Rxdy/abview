import { describe, it, expect } from 'vitest'
import { DISPOSITIONS, DISPOSITIONS_VEILLE, DISPOSITION_PAR_DEFAUT, PERMANENT, VEILLE, type Emplacement } from '../dispositionsPhotos'
import { REGISTRE } from '../registre'

// Écran de référence (1280 × 720) : une case de la grille et l'écart entre cases
const CASE_L = (1248 - 11 * 10) / 12
const CASE_H = (624 - 7 * 10) / 8

/** Taille réelle d'un emplacement : dans le module posé sur l'écran (permanent) ou sur l'écran entier (veille). */
function taille(nom: string, em: Emplacement) {
  let largeurBoite = 1280
  let hauteurBoite = 720
  if ((PERMANENT as readonly string[]).includes(nom)) {
    const v = REGISTRE.photos!.variantes.find((x) => x.id === nom)!
    largeurBoite = v.largeur * CASE_L + (v.largeur - 1) * 10
    hauteurBoite = v.hauteur * CASE_H + (v.hauteur - 1) * 10
  }
  return { largeur: (largeurBoite * em.largeur) / 100, hauteur: (hauteurBoite * em.hauteur) / 100 }
}
const aire = (nom: string, em: Emplacement) => {
  const t = taille(nom, em)
  return t.largeur * t.hauteur
}
const veille = VEILLE.map((nom) => [nom, DISPOSITIONS[nom]!] as const)

describe('modes du module Photos', () => {
  it('en mode permanent : une seule photo, en paysage ou en portrait (seules tailles du module)', () => {
    expect(REGISTRE.photos!.variantes.map((v) => v.id)).toEqual(['un', 'portrait'])
    expect([...PERMANENT]).toEqual(['un', 'portrait'])
    expect(REGISTRE.photos!.variantes[0]!.id).toBe(DISPOSITION_PAR_DEFAUT)
    for (const nom of PERMANENT) expect(DISPOSITIONS[nom]!.emplacements).toHaveLength(1)
    expect(DISPOSITIONS.un!.emplacements[0]!.orientation).toBe('paysage')
    expect(DISPOSITIONS.portrait!.emplacements[0]!.orientation).toBe('portrait')
  })

  it('le mode veille a un seul mur : cinq cadres, hors des tailles du module permanent', () => {
    expect([...VEILLE]).toEqual(['cinq'])
    expect(DISPOSITIONS.cinq!.emplacements).toHaveLength(5)
    expect(REGISTRE.photos!.variantes.map((v) => v.id)).not.toContain('cinq')
  })

  it('la plupart des photos étant en portrait : quatre emplacements en portrait et un seul en paysage', () => {
    const orientations = DISPOSITIONS.cinq!.emplacements.map((e) => e.orientation)
    expect(orientations.filter((o) => o === 'portrait')).toHaveLength(4)
    expect(orientations.filter((o) => o === 'paysage')).toHaveLength(1)
  })

  it('chaque disposition est connue : permanente ou veille, rien d’autre', () => {
    expect(Object.keys(DISPOSITIONS).sort()).toEqual([...PERMANENT, ...DISPOSITIONS_VEILLE].sort())
  })
})

describe.each(Object.keys(DISPOSITIONS))('disposition « %s »', (nom) => {
  const d = DISPOSITIONS[nom]!

  it('reste dans le cadre et sans chevauchement', () => {
    for (const em of d.emplacements) {
      expect(em.x).toBeGreaterThanOrEqual(0)
      expect(em.y).toBeGreaterThanOrEqual(0)
      expect(em.x + em.largeur).toBeLessThanOrEqual(100)
      expect(em.y + em.hauteur).toBeLessThanOrEqual(100)
    }
    d.emplacements.forEach((a, i) =>
      d.emplacements.slice(i + 1).forEach((b) => {
        const chevauche = a.x < b.x + b.largeur && b.x < a.x + a.largeur && a.y < b.y + b.hauteur && b.y < a.y + a.hauteur
        expect(chevauche, `#${i}`).toBe(false)
      })
    )
  })

  it('chaque emplacement a la forme de son orientation (paysage plus large que haut, portrait plus haut, rond carré)', () => {
    d.emplacements.forEach((em, i) => {
      const t = taille(nom, em)
      const ratio = t.largeur / t.hauteur
      if (em.orientation === 'paysage') {
        expect(ratio, `#${i}`).toBeGreaterThan(1.2)
        expect(ratio, `#${i}`).toBeLessThan(2.05) // au-delà, une photo serait trop recadrée
      }
      if (em.orientation === 'portrait') {
        expect(ratio, `#${i}`).toBeLessThan(0.87)
        expect(ratio, `#${i}`).toBeGreaterThan(0.45)
      }
      if (em.orientation === 'carre') {
        expect(ratio, `#${i}`).toBeGreaterThan(0.9)
        expect(ratio, `#${i}`).toBeLessThan(1.12)
      }
    })
  })

  it('les formes rondes ou cintrées vont avec l’orientation qui leur convient', () => {
    for (const em of d.emplacements) {
      if (em.cadre === 'rond') expect(em.orientation).toBe('carre')
      if (em.cadre === 'ovale' || em.cadre === 'arche') expect(em.orientation).toBe('portrait')
    }
  })
})

describe.each(veille)('mode veille « %s »', (nom, d) => {
  it('remplit bien l’écran : au moins la moitié de la surface est occupée par des cadres', () => {
    const couvert = d.emplacements.reduce((n, em) => n + (em.largeur * em.hauteur) / 100, 0) / 100
    expect(couvert).toBeGreaterThanOrEqual(0.55)
  })

  it('les emplacements n’ont pas tous la même taille', () => {
    const aires = d.emplacements.map((em) => aire(nom, em))
    for (let i = 0; i < aires.length; i++) {
      for (let j = i + 1; j < aires.length; j++) expect(Math.abs(aires[i]! - aires[j]!) / aires[i]!, `${i}/${j}`).toBeGreaterThan(0.1)
    }
  })

  it('les cadres ne sont pas alignés : aucun bord haut ou bas partagé', () => {
    const hauts = d.emplacements.map((e) => e.y)
    const bas = d.emplacements.map((e) => e.y + e.hauteur)
    expect(new Set(hauts).size).toBe(hauts.length)
    expect(new Set(bas).size).toBe(bas.length)
  })

  it('les cadres penchent à peine, et jamais tous droits', () => {
    const pentes = d.emplacements.map((e) => e.inclinaison ?? 0)
    expect(pentes.every((p) => p !== 0)).toBe(true)
    for (const p of pentes) expect(Math.abs(p)).toBeLessThanOrEqual(2)
  })

  it('les styles de cadre varient', () => {
    expect(new Set(d.emplacements.map((e) => e.cadre)).size).toBeGreaterThanOrEqual(2)
  })
})

describe('formes de fantaisie', () => {
  it('le mur de cinq cadres mélange des formes : arche, ovale, et des cadres classiques', () => {
    const styles = new Set(DISPOSITIONS.cinq!.emplacements.map((e) => e.cadre))
    for (const forme of ['or', 'noir', 'bois', 'arche', 'ovale']) expect(styles.has(forme as never), forme).toBe(true)
  })
})

describe('mur de galerie (mode veille, proposition)', () => {
  const galerie = DISPOSITIONS.galerie!.emplacements
  const ecran = 16 / 9 // les % de largeur et de hauteur n'ont pas la même longueur : on compare en pixels d'un écran 1920 × 1080

  it('est proposé à l\'aperçu du mode veille sans remplacer le mur de cinq cadres', () => {
    expect([...DISPOSITIONS_VEILLE]).toEqual(['cinq', 'galerie'])
    expect([...VEILLE]).toEqual(['cinq'])
  })

  it('a de nombreux cadres, de plusieurs formes et styles, pour couvrir l\'écran', () => {
    expect(galerie.length).toBeGreaterThanOrEqual(15)
    expect(new Set(galerie.map((e) => e.cadre)).size).toBe(5)
    const couvert = galerie.reduce((n, em) => n + (em.largeur * em.hauteur) / 100, 0) / 100
    expect(couvert).toBeGreaterThanOrEqual(0.4)
  })

  it('tient dans l\'écran, avec une marge pour la corniche et la plinthe', () => {
    for (const [i, em] of galerie.entries()) {
      expect(em.x, `x ${i}`).toBeGreaterThanOrEqual(1)
      expect(em.y, `y ${i}`).toBeGreaterThanOrEqual(3)
      expect(em.x + em.largeur, `droite ${i}`).toBeLessThanOrEqual(99)
      expect(em.y + em.hauteur, `bas ${i}`).toBeLessThanOrEqual(98)
    }
  })

  it('aucun cadre n\'en recouvre un autre', () => {
    const rect = (em: Emplacement) => ({ g: em.x * ecran, d: (em.x + em.largeur) * ecran, h: em.y, b: em.y + em.hauteur })
    for (let i = 0; i < galerie.length; i++) {
      for (let j = i + 1; j < galerie.length; j++) {
        const a = rect(galerie[i]!)
        const b = rect(galerie[j]!)
        const chevauche = a.g < b.d && b.g < a.d && a.h < b.b && b.h < a.b
        expect(chevauche, `cadres ${i} et ${j}`).toBe(false)
      }
    }
  })

  it('les cadres gardent les proportions d\'une photo : 2:3 en portrait, 3:2 en paysage', () => {
    for (const em of galerie) {
      const ratio = (em.largeur * 16) / (em.hauteur * 9) // largeur / hauteur en pixels
      expect(ratio).toBeCloseTo(em.orientation === 'portrait' ? 2 / 3 : 3 / 2, 1)
    }
  })

  it('des appliques éclairent quelques grands cadres, jamais plus d\'un sur quatre', () => {
    const avec = galerie.filter((e) => e.lampe)
    expect(avec.length).toBeGreaterThanOrEqual(2)
    expect(avec.length).toBeLessThanOrEqual(galerie.length / 4)
  })
})
