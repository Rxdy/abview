import { describe, it, expect } from 'vitest'
import { categorieEvenement, imageEvenement, ETIQUETTES } from '../categories'

describe('categorieEvenement', () => {
  it.each([
    ['birthday', 'Lou', 'anniversaire'],
    ['bastille', 'Fête Nationale', 'national'],
    ['armistice', 'Armistice 1918', 'national'],
    ['christmas', 'Noël', 'religieux'],
    ['catholic', 'Toussaint', 'religieux'],
    ['jaune', 'Poubelle', 'poubelle'],
    ['noire', 'Poubelle', 'poubelle'],
    ['garde-alternee', 'Lyam & Noah', 'garde'],
    ['default', 'Lyam et Noah', 'garde'],
    ['rugby', 'Entraînement', 'sport'],
    ['work', 'Luis', 'travail'],
    ['default', 'Charlène — Matin', 'travail'],
    ['default', 'Charlène — Nuit (modifié)', 'travail'],
    ['default', 'Dentiste Luis', 'sante'],
    ['default', 'Lyam NeuroPsy', 'sante'],
    ['default', 'Rendez vous véhicule Renault', 'autre'],
    [undefined, 'Réunion', 'autre'],
  ])('%s « %s » → %s', (type, titre, attendu) => {
    expect(categorieEvenement(type, titre)).toBe(attendu)
  })

  it('a une étiquette pour chaque catégorie sauf « autre »', () => {
    expect(ETIQUETTES.travail).toBe('Travail')
    expect(ETIQUETTES.autre).toBe('')
  })
})

describe('imageEvenement', () => {
  it('donne une image jour et une image nuit pour les anniversaires', () => {
    expect(imageEvenement('birthday', false)).toBeTruthy()
    expect(imageEvenement('birthday', true)).not.toBe(imageEvenement('birthday', false))
  })

  it('réutilise l\'image du Nouvel An pour Noël', () => {
    expect(imageEvenement('christmas', false)).toBe(imageEvenement('newyear', false))
  })

  it('sans image (fête nationale, Toussaint, événement ordinaire) → null', () => {
    expect(imageEvenement('bastille', false)).toBeNull()
    expect(imageEvenement('catholic', true)).toBeNull()
    expect(imageEvenement('default', false)).toBeNull()
  })
})
