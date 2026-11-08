/**
 * Images de démonstration pour le module Photos, quand abflow n'est pas branché (développement, essais) :
 * de petits paysages dessinés en SVG, dans l'orientation demandée.
 */
export type Orientation = 'paysage' | 'portrait' | 'carre'

export interface PhotoAffichee {
  id: string
  url: string
  orientation: Orientation
}

const TAILLES: Record<Orientation, [number, number]> = {
  paysage: [1200, 800],
  portrait: [800, 1200],
  carre: [1000, 1000],
}

// ciel haut, ciel bas, soleil, montagne lointaine, montagne proche
const PALETTES = [
  ['#5fa8d3', '#f6d6a8', '#fff3c4', '#6b7fa3', '#3d4f6e'],
  ['#2b3a67', '#f4a259', '#ffe8b0', '#4a4e7a', '#2a2d52'],
  ['#8ecae6', '#e9f5db', '#fffbe6', '#74a57f', '#3f6b4b'],
  ['#e07a5f', '#f9dcc4', '#fff1d6', '#8d5a7e', '#4b2e5a'],
  ['#355c7d', '#c06c84', '#f8b195', '#6c5b7b', '#2f2a44'],
]

let compteur = 0

export function photoDemo(orientation: Orientation): PhotoAffichee {
  const n = compteur++
  const [l, h] = TAILLES[orientation]
  const [ciel1, ciel2, soleil, loin, proche] = PALETTES[n % PALETTES.length]!
  const decalage = (n * 137) % 300
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${l} ${h}" preserveAspectRatio="xMidYMid slice">
<defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ciel1}"/><stop offset="1" stop-color="${ciel2}"/></linearGradient></defs>
<rect width="${l}" height="${h}" fill="url(#c)"/>
<circle cx="${l * 0.3 + decalage}" cy="${h * 0.32}" r="${Math.min(l, h) * 0.09}" fill="${soleil}"/>
<polygon points="0,${h * 0.72} ${l * 0.25},${h * 0.5} ${l * 0.5},${h * 0.68} ${l * 0.75},${h * 0.46} ${l},${h * 0.7} ${l},${h} 0,${h}" fill="${loin}"/>
<polygon points="0,${h * 0.86} ${l * 0.35},${h * 0.64} ${l * 0.6},${h * 0.82} ${l * 0.85},${h * 0.66} ${l},${h * 0.84} ${l},${h} 0,${h}" fill="${proche}"/>
</svg>`
  return { id: `demo-${n}`, url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`, orientation }
}
