import { describe, it, expect } from 'vitest'
import { DISPOSITIONS, DISPOSITION_PAR_DEFAUT, PERMANENT, VEILLE, type Emplacement } from '../dispositionsPhotos'
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

  it('les murs de plusieurs cadres sont réservés au mode veille : 2, 3, 4 et 5 photos', () => {
    expect([...VEILLE]).toEqual(['deux', 'trois', 'quatre', 'cinq'])
    expect(veille.map(([, d]) => d.emplacements.length)).toEqual([2, 3, 4, 5])
    for (const nom of VEILLE) expect(REGISTRE.photos!.variantes.map((v) => v.id)).not.toContain(nom)
  })

  it('chaque disposition est connue : permanente ou veille, rien d’autre', () => {
    expect(Object.keys(DISPOSITIONS).sort()).toEqual([...PERMANENT, ...VEILLE].sort())
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
    expect(couvert).toBeGreaterThanOrEqual(nom === 'deux' ? 0.5 : 0.55)
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
  it('le mur à cinq cadres utilise plusieurs formes : classique, arche et rond', () => {
    const styles = new Set(DISPOSITIONS.cinq!.emplacements.map((e) => e.cadre))
    for (const forme of ['or', 'noir', 'bois', 'arche', 'rond']) expect(styles.has(forme as never), forme).toBe(true)
  })

  it('le mur à quatre cadres (le plus apprécié) garde son équilibre : un grand paysage, une arche, un rond, un portrait', () => {
    expect(DISPOSITIONS.quatre!.emplacements.map((e) => e.cadre)).toEqual(['or', 'arche', 'rond', 'bois'])
  })
})
