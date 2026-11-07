import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Les bacs doivent rester lisibles en mode sombre comme en mode jour.
const css = readFileSync(resolve(__dirname, '../../assets/base.css'), 'utf8')

const bloc = (debut: string) => {
  const i = css.indexOf(debut)
  const j = css.indexOf('\n}', i)
  return css.slice(i, j)
}
const jeton = (b: string, nom: string) => {
  const m = b.match(new RegExp(`--${nom}:\\s*(#[0-9a-fA-F]{6})`))
  if (!m) throw new Error(`jeton ${nom} introuvable`)
  return m[1]
}
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

const themes = { sombre: bloc(':root'), jour: bloc('.light-theme {') }

describe.each(Object.entries(themes))('bacs en mode %s', (_nom, b) => {
  const surface = jeton(b, 'c-surface')

  it.each(['jaune', 'noire'])('texte du bac %s lisible sur son fond (>= 4,5)', (bac) => {
    expect(ratio(jeton(b, `bac-${bac}-fg`), jeton(b, `bac-${bac}-bg`))).toBeGreaterThanOrEqual(4.5)
  })

  it.each(['jaune', 'noire'])('la carte du bac %s se distingue de la colonne (>= 3)', (bac) => {
    const contourVisible = ratio(jeton(b, `bac-${bac}-bord`), surface)
    const fondVisible = ratio(jeton(b, `bac-${bac}-bg`), surface)
    expect(Math.max(contourVisible, fondVisible)).toBeGreaterThanOrEqual(3)
  })
})
