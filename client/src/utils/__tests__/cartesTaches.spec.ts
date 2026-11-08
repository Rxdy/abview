import { describe, it, expect } from 'vitest'
import { largeurCartes, CARTE_NORMALE } from '../cartesTaches'

describe('largeurCartes', () => {
  it('garde la largeur normale dans une zone large (écran standard : 8 colonnes ≈ 829)', () => {
    expect(largeurCartes(829)).toBe(CARTE_NORMALE)
    expect(largeurCartes(838)).toBe(CARTE_NORMALE)
  })

  it('partage une zone moyenne (≈ 409) entre deux cartes, sans les couper', () => {
    const l = largeurCartes(409)
    expect(l).toBeCloseTo(199.5)
    expect(2 * l + 10).toBeLessThanOrEqual(409)
  })

  it('remplit une zone étroite (≈ 302) avec une seule carte', () => {
    expect(largeurCartes(302)).toBe(302)
  })

  it('ne dépasse jamais la zone ni ne grandit démesurément', () => {
    expect(largeurCartes(150)).toBe(150)
    for (const zone of [150, 200, 302, 380, 409, 500, 566, 829, 1248]) {
      const l = largeurCartes(zone)
      expect(l).toBeLessThanOrEqual(Math.max(zone, 0.0001))
      expect(l).toBeLessThanOrEqual(345)
    }
  })

  it('retombe sur la largeur normale quand la zone est inconnue', () => {
    expect(largeurCartes(0)).toBe(CARTE_NORMALE)
  })
})
