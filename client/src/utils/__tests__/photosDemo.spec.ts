import { describe, it, expect } from 'vitest'
import { photoDemo } from '../photosDemo'

const dimensions = (url: string) => {
  const svg = decodeURIComponent(url.replace('data:image/svg+xml;utf8,', ''))
  const [, l, h] = /viewBox="0 0 (\d+) (\d+)"/.exec(svg)!
  return [Number(l), Number(h)]
}

describe('photoDemo', () => {
  it('respecte l’orientation demandée', () => {
    const [lp, hp] = dimensions(photoDemo('paysage').url)
    expect(lp).toBeGreaterThan(hp)
    const [lq, hq] = dimensions(photoDemo('portrait').url)
    expect(hq).toBeGreaterThan(lq)
    const [lc, hc] = dimensions(photoDemo('carre').url)
    expect(lc).toBe(hc)
  })

  it('donne des identifiants et des images différents à chaque appel', () => {
    const a = photoDemo('paysage')
    const b = photoDemo('paysage')
    expect(a.id).not.toBe(b.id)
    expect(a.url).not.toBe(b.url)
  })
})
