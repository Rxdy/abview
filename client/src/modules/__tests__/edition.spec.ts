import { describe, it, expect } from 'vitest'
import { CONFIGURATION_PAR_DEFAUT, valider, type Configuration } from '../configuration'
import {
  ajouter,
  ajouterA,
  changerVariante,
  deplacer,
  identifiantDepuisNom,
  identifiantLibre,
  positionLibre,
  retirer,
} from '../edition'

const vide: Configuration = { nom: 'Vide', placements: [] }

describe('édition d’une configuration', () => {
  it('ajoute un module à la première case libre, en haut à gauche', () => {
    const c = ajouter(vide, 'meteo')!
    expect(c.placements).toEqual([{ id: 'meteo', module: 'meteo', x: 1, y: 1 }])
    expect(valider(c)).toEqual([])
  })

  it('range les modules suivants autour des premiers, sans chevauchement', () => {
    let c = ajouter(vide, 'meteo')! // 4×3 en haut à gauche
    c = ajouter(c, 'taches')! // 8×3 : tient à droite sur la même ligne
    expect(c.placements[1]).toMatchObject({ x: 5, y: 1 })
    c = ajouter(c, 'calendrier')! // 12×5 : sous les deux autres
    expect(c.placements[2]).toMatchObject({ x: 1, y: 4 })
    expect(valider(c)).toEqual([])
  })

  it('refuse d’ajouter un module quand il n’y a plus de place', () => {
    expect(ajouter(CONFIGURATION_PAR_DEFAUT, 'calendrier')).toBeNull() // 12×5 ne tient plus dans la grille remplie
    expect(positionLibre(vide, 'inconnu')).toBeNull()
  })

  it('donne des identifiants uniques pour un module posé plusieurs fois', () => {
    let c = ajouter(vide, 'meteo')!
    expect(identifiantLibre(c, 'meteo')).toBe('meteo-2')
    c = ajouter(c, 'meteo')!
    expect(c.placements.map((p) => p.id)).toEqual(['meteo', 'meteo-2'])
    expect(identifiantLibre(c, 'meteo')).toBe('meteo-3')
  })

  it('pose un module à la case voulue, le refuse s’il ne tient pas là', () => {
    const sans = retirer(CONFIGURATION_PAR_DEFAUT, 'meteo')
    expect(ajouterA(sans, 'meteo', 1, 6)?.placements.at(-1)).toMatchObject({ id: 'meteo', x: 1, y: 6 })
    expect(ajouterA(sans, 'meteo', 3, 6)).toBeNull() // chevauche les tâches
    expect(ajouterA(vide, 'meteo', 10, 1)).toBeNull() // sort de la grille
    expect(ajouterA(vide, 'inconnu', 1, 1)).toBeNull()
  })

  it('retire un module', () => {
    expect(retirer(CONFIGURATION_PAR_DEFAUT, 'meteo').placements.map((p) => p.id)).toEqual(['calendrier', 'taches'])
  })

  it('déplace un module dans un espace libre, le refuse ailleurs', () => {
    const sans = retirer(CONFIGURATION_PAR_DEFAUT, 'meteo') // la place de la météo est libre
    expect(deplacer(sans, 'taches', 1, 6)?.placements.find((p) => p.id === 'taches')).toMatchObject({ x: 1, y: 6 })
    expect(deplacer(CONFIGURATION_PAR_DEFAUT, 'meteo', 3, 6)).toBeNull() // chevauche les tâches
    expect(deplacer(CONFIGURATION_PAR_DEFAUT, 'meteo', 12, 6)).toBeNull() // sort de la grille
  })

  it('ne modifie jamais la configuration d’origine', () => {
    const avant = JSON.stringify(CONFIGURATION_PAR_DEFAUT)
    retirer(CONFIGURATION_PAR_DEFAUT, 'meteo')
    deplacer(CONFIGURATION_PAR_DEFAUT, 'meteo', 3, 6)
    ajouter(vide, 'meteo')
    expect(JSON.stringify(CONFIGURATION_PAR_DEFAUT)).toBe(avant)
  })

  it('refuse une variante inconnue', () => {
    expect(changerVariante(CONFIGURATION_PAR_DEFAUT, 'meteo', 'géante')).toBeNull()
    expect(changerVariante(CONFIGURATION_PAR_DEFAUT, 'meteo', 'standard')).not.toBeNull()
  })

  it('tire l’identifiant du nom : sans accents, en minuscules, avec des tirets', () => {
    expect(identifiantDepuisNom('Semaine d’école')).toBe('semaine-d-ecole')
    expect(identifiantDepuisNom('  Vacances !! ')).toBe('vacances')
    expect(identifiantDepuisNom('???')).toBe('configuration')
    expect(identifiantDepuisNom('a'.repeat(80))).toHaveLength(40)
  })
})
