import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { ETIQUETTES } from '../categories'

/**
 * Une catégorie sans couleur CSS s'afficherait avec celle d'« autre », sans erreur ni test rouge.
 * Ce test lit les fichiers sources : chaque catégorie de ETIQUETTES doit avoir ses jetons
 * (--cat-X-bg et --cat-X-fg) en nuit ET en jour, et sa règle .cat-X dans la carte d'événement.
 */
const lire = (relatif: string) => readFileSync(fileURLToPath(new URL(relatif, import.meta.url)), 'utf8')
const BASE_CSS = lire('../../assets/base.css')
const CARTE = lire('../../components/CalendarModule.vue')
const nb = (texte: string, motif: RegExp) => (texte.match(motif) ?? []).length

const CATEGORIES = Object.keys(ETIQUETTES)

describe('couleurs CSS des catégories', () => {
  it('connaît des catégories', () => {
    expect(CATEGORIES.length).toBeGreaterThan(5)
  })

  it.each(CATEGORIES)('%s : jetons --cat-…-bg et -fg définis en nuit et en jour', (cat) => {
    for (const ton of ['bg', 'fg']) {
      const definitions = nb(BASE_CSS, new RegExp(`^\\s*--cat-${cat}-${ton}\\s*:`, 'gm'))
      expect(definitions, `--cat-${cat}-${ton} dans base.css (nuit et jour)`).toBeGreaterThanOrEqual(2)
    }
  })

  // « autre » est la valeur par défaut de .event : elle n'a pas de règle propre.
  it.each(CATEGORIES.filter((c) => c !== 'autre'))('%s : règle .cat-… dans la carte d\'événement', (cat) => {
    expect(nb(CARTE, new RegExp(`\\.cat-${cat}\\s*\\{[^}]*--cat-bg:\\s*var\\(--cat-${cat}-bg\\)[^}]*--cat-fg:\\s*var\\(--cat-${cat}-fg\\)`, 'g'))).toBe(1)
  })

  it("la carte de travail affiche son étiquette « Travail » comme les autres cartes (Garde, Périscolaire…)", () => {
    expect(CARTE).not.toMatch(/\.event\.cat-travail\s+\.event-tag\s*\{[^}]*display:\s*none/)
  })
})
