import { describe, it, expect, beforeEach, vi } from 'vitest'
import { photosService } from '../photosService'
import { apiService } from '../apiService'

const photo = (id: string, orientation: 'paysage' | 'portrait' | 'carre') => ({ id, url: `/photos/fichier/${id}`, orientation })

describe('photosService', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('demande une photo par orientation, dans l’ordre, avec les photos à éviter', async () => {
    const get = vi.spyOn(apiService, 'get').mockResolvedValue({ photos: [photo('a', 'portrait'), photo('b', 'paysage')] })
    const r = await photosService.aleatoires(['portrait', 'paysage'], ['x.jpg', 'y.jpg'])
    expect(get).toHaveBeenCalledWith('/photos/aleatoires?orientations=portrait,paysage&exclure=x.jpg%2Cy.jpg')
    expect(r.map((p) => p.id)).toEqual(['a', 'b'])
  })

  it('sans photo à éviter, ne met pas de paramètre exclure', async () => {
    const get = vi.spyOn(apiService, 'get').mockResolvedValue({ photos: [photo('a', 'paysage')] })
    await photosService.aleatoires(['paysage'])
    expect(get).toHaveBeenCalledWith('/photos/aleatoires?orientations=paysage')
  })

  it('range chaque photo dans l’emplacement de SON orientation, même si le serveur les rend dans un autre ordre', async () => {
    vi.spyOn(apiService, 'get').mockResolvedValue({ photos: [photo('p', 'portrait'), photo('l', 'paysage')] })
    const r = await photosService.aleatoires(['paysage', 'portrait'])
    expect(r.map((x) => [x.id, x.orientation])).toEqual([['l', 'paysage'], ['p', 'portrait']])
  })

  it('une orientation sans photo reçoit une image de démonstration de la bonne orientation', async () => {
    vi.spyOn(apiService, 'get').mockResolvedValue({ photos: [photo('l', 'paysage')] })
    const r = await photosService.aleatoires(['paysage', 'portrait'])
    expect(r[0]!.id).toBe('l')
    expect(r[1]!.id).toMatch(/^demo-/)
    expect(r[1]!.orientation).toBe('portrait')
  })

  it('serveur injoignable ou abflow absent : des images de démonstration, jamais d’erreur ni d’emplacement vide', async () => {
    vi.spyOn(apiService, 'get').mockRejectedValueOnce(new Error('réseau'))
    const r1 = await photosService.aleatoires(['paysage', 'paysage', 'portrait'])
    expect(r1).toHaveLength(3)
    expect(r1.every((p) => p.id.startsWith('demo-'))).toBe(true)

    vi.spyOn(apiService, 'get').mockResolvedValueOnce({ photos: [], source: 'absente' })
    expect(await photosService.aleatoires(['paysage'])).toHaveLength(1)

    vi.spyOn(apiService, 'get').mockResolvedValueOnce({ photos: 'n’importe quoi' })
    expect(await photosService.aleatoires(['paysage'])).toHaveLength(1)
  })

  it('ne donne jamais deux fois la même photo à deux emplacements de la même réponse', async () => {
    vi.spyOn(apiService, 'get').mockResolvedValue({ photos: [photo('l', 'paysage')] })
    const r = await photosService.aleatoires(['paysage', 'paysage'])
    expect(new Set(r.map((p) => p.id)).size).toBe(2)
  })
})
