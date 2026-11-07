import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { bundleCourant, nouvelleVersionDisponible, rechargerSiNouvelleVersion } from '../nouvelleVersion'

const html = (hash: string) =>
  `<html><head><script type="module" src="/assets/index-${hash}.js"></script></head></html>`

function pageAvecBundle(hash: string | null) {
  document.head.innerHTML = hash ? `<script src="/assets/index-${hash}.js"></script>` : ''
}

function serveur(corps: string, ok = true) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, text: () => Promise.resolve(corps) }))
}

describe('nouvelleVersion', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.stubGlobal('location', { ...window.location, reload: vi.fn() })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    document.head.innerHTML = ''
  })

  it('lit le fichier de code chargé par la page', () => {
    pageAvecBundle('BHfQl1zq')
    expect(bundleCourant()).toBe('/assets/index-BHfQl1zq.js')
  })

  it("ne compare rien en mode dev (pas de fichier à empreinte)", async () => {
    pageAvecBundle(null)
    serveur(html('NOUVEAU'))
    expect(await nouvelleVersionDisponible()).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('détecte une version plus récente quand le serveur nomme un autre fichier', async () => {
    pageAvecBundle('ANCIEN')
    serveur(html('NOUVEAU'))
    expect(await nouvelleVersionDisponible()).toBe(true)
  })

  it('ne signale rien quand le serveur sert le même fichier', async () => {
    pageAvecBundle('MEME')
    serveur(html('MEME'))
    expect(await nouvelleVersionDisponible()).toBe(false)
  })

  it('garde la page en cas de doute : serveur en erreur, réseau coupé, index sans fichier', async () => {
    pageAvecBundle('ANCIEN')
    serveur(html('NOUVEAU'), false)
    expect(await nouvelleVersionDisponible()).toBe(false)
    serveur('<html>maintenance</html>')
    expect(await nouvelleVersionDisponible()).toBe(false)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect(await nouvelleVersionDisponible()).toBe(false)
  })

  it("demande l'index sans cache, sinon le navigateur répondrait avec l'ancien", async () => {
    pageAvecBundle('ANCIEN')
    serveur(html('NOUVEAU'))
    await nouvelleVersionDisponible()
    expect(fetch).toHaveBeenCalledWith('/', { cache: 'no-store' })
  })

  it('recharge la page quand une nouvelle version est en ligne', async () => {
    pageAvecBundle('ANCIEN')
    serveur(html('NOUVEAU'))
    expect(await rechargerSiNouvelleVersion()).toBe(true)
    expect(window.location.reload).toHaveBeenCalledTimes(1)
  })

  it('ne recharge pas quand la version est à jour', async () => {
    pageAvecBundle('MEME')
    serveur(html('MEME'))
    expect(await rechargerSiNouvelleVersion()).toBe(false)
    expect(window.location.reload).not.toHaveBeenCalled()
  })

  it('ne boucle pas : pas deux rechargements en moins de 5 minutes', async () => {
    pageAvecBundle('ANCIEN')
    serveur(html('NOUVEAU'))
    expect(await rechargerSiNouvelleVersion()).toBe(true)
    expect(await rechargerSiNouvelleVersion()).toBe(false)
    expect(window.location.reload).toHaveBeenCalledTimes(1)

    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + 6 * 60 * 1000)
    expect(await rechargerSiNouvelleVersion()).toBe(true)
    vi.useRealTimers()
    expect(window.location.reload).toHaveBeenCalledTimes(2)
  })
})
