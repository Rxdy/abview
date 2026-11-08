import { describe, it, expect } from 'vitest'
import { CONFIGURATION_PAR_DEFAUT, rectangle, valider, type Configuration } from '../configuration'
import { dansLaGrille, GRILLE, seChevauchent } from '../grille'
import { REGISTRE, variante, type Registre } from '../registre'

const registre: Registre = {
  a: {
    id: 'a',
    titre: 'A',
    variantes: [
      { id: 'petit', largeur: 2, hauteur: 2 },
      { id: 'grand', largeur: 4, hauteur: 2 },
    ],
  },
}
const cfg = (...placements: Configuration['placements']): Configuration => ({ nom: 't', placements })

describe('grille', () => {
  it("n'accepte que des cases entières dans la grille", () => {
    expect(dansLaGrille({ x: 1, y: 1, largeur: 12, hauteur: 8 })).toBe(true)
    expect(dansLaGrille({ x: 2, y: 1, largeur: 12, hauteur: 1 })).toBe(false) // déborde à droite
    expect(dansLaGrille({ x: 1, y: 8, largeur: 1, hauteur: 2 })).toBe(false) // déborde en bas
    expect(dansLaGrille({ x: 0, y: 1, largeur: 1, hauteur: 1 })).toBe(false) // les cases commencent à 1
    expect(dansLaGrille({ x: 1.5, y: 1, largeur: 1, hauteur: 1 })).toBe(false)
    expect(dansLaGrille({ x: 1, y: 1, largeur: 0, hauteur: 1 })).toBe(false)
  })

  it('se toucher par un bord n’est pas se chevaucher', () => {
    const a = { x: 1, y: 1, largeur: 2, hauteur: 2 }
    expect(seChevauchent(a, { x: 3, y: 1, largeur: 2, hauteur: 2 })).toBe(false)
    expect(seChevauchent(a, { x: 1, y: 3, largeur: 2, hauteur: 2 })).toBe(false)
    expect(seChevauchent(a, { x: 2, y: 2, largeur: 2, hauteur: 2 })).toBe(true)
  })
})

describe('registre', () => {
  it('donne la première variante quand aucune n’est demandée', () => {
    expect(variante(registre, 'a')?.id).toBe('petit')
    expect(variante(registre, 'a', 'grand')?.largeur).toBe(4)
    expect(variante(registre, 'a', 'énorme')).toBeUndefined()
    expect(variante(registre, 'inconnu')).toBeUndefined()
  })

  it('les trois modules actuels ont au moins une variante dans la grille', () => {
    for (const def of Object.values(REGISTRE)) {
      expect(def.variantes.length).toBeGreaterThan(0)
      for (const v of def.variantes) expect(dansLaGrille({ x: 1, y: 1, ...v })).toBe(true)
    }
  })
})

describe('valider', () => {
  it('la configuration par défaut est valide et remplit les 12 colonnes', () => {
    expect(valider(CONFIGURATION_PAR_DEFAUT)).toEqual([])
    const bas = CONFIGURATION_PAR_DEFAUT.placements.filter((p) => p.y > 1).map((p) => rectangle(p)!)
    expect(bas.reduce((n, r) => n + r.largeur, 0)).toBe(GRILLE.colonnes)
  })

  it('accepte deux modules côte à côte', () => {
    expect(valider(cfg({ id: '1', module: 'a', x: 1, y: 1 }, { id: '2', module: 'a', x: 3, y: 1 }), registre)).toEqual([])
  })

  it('la variante choisie donne la taille', () => {
    const grand = cfg({ id: '1', module: 'a', variante: 'grand', x: 1, y: 1 }, { id: '2', module: 'a', x: 3, y: 1 })
    expect(valider(grand, registre)).toEqual(['« 2 » chevauche « 1 »'])
  })

  it('refuse un module inconnu, une variante inconnue, un identifiant en double', () => {
    expect(valider(cfg({ id: '1', module: 'zzz', x: 1, y: 1 }), registre)).toEqual(['« 1 » : module inconnu « zzz »'])
    expect(valider(cfg({ id: '1', module: 'a', variante: 'x', x: 1, y: 1 }), registre)).toEqual([
      '« 1 » : variante inconnue « x » pour a',
    ])
    const doublon = valider(cfg({ id: '1', module: 'a', x: 1, y: 1 }, { id: '1', module: 'a', x: 5, y: 1 }), registre)
    expect(doublon).toEqual(['Identifiant en double : « 1 »'])
  })

  it('refuse un module qui sort de la grille', () => {
    const erreurs = valider(cfg({ id: '1', module: 'a', variante: 'grand', x: 10, y: 1 }), registre)
    expect(erreurs).toEqual(['« 1 » : sort de la grille (12 × 8 cases)'])
  })

  it('rapporte tous les problèmes à la fois', () => {
    const erreurs = valider(
      cfg({ id: '1', module: 'zzz', x: 1, y: 1 }, { id: '2', module: 'a', x: 12, y: 1 }, { id: '3', module: 'a', x: 1, y: 1 }, { id: '4', module: 'a', x: 2, y: 2 }),
      registre
    )
    expect(erreurs).toHaveLength(3)
  })

  it('une configuration vide est valide (écran vide)', () => {
    expect(valider(cfg(), registre)).toEqual([])
  })

  it('est sérialisable en JSON sans perte (favoris, envoi au kiosque)', () => {
    const copie = JSON.parse(JSON.stringify(CONFIGURATION_PAR_DEFAUT))
    expect(copie).toEqual(CONFIGURATION_PAR_DEFAUT)
    expect(valider(copie)).toEqual([])
  })
})
