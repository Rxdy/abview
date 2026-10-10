import { describe, it, expect } from 'vitest'
import { categorieEvenement, imageEvenement, ETIQUETTES } from '../categories'

describe('categorieEvenement', () => {
  it('suit la catégorie déclarée par la source (JSON des horaires, propriété privée Google)', () => {
    expect(categorieEvenement({ type: 'default', titre: 'Charlène — Matin', categorie: 'travail' })).toBe('travail')
    expect(categorieEvenement({ type: 'work', titre: 'Luis', categorie: 'sport' })).toBe('sport')
  })

  it('ignore une catégorie déclarée inconnue', () => {
    expect(categorieEvenement({ type: 'work', titre: 'Luis', categorie: 'n-importe-quoi' })).toBe('travail')
  })

  it('classe par la couleur Google quand config.json l\'associe à une catégorie', () => {
    const regles = { couleurs: { '3': 'garde' } }
    expect(categorieEvenement({ type: 'default', titre: 'Lyam et Noah', couleur: '3' }, regles)).toBe('garde')
    expect(categorieEvenement({ type: 'default', titre: 'Lyam et Noah', couleur: '7' }, regles)).toBe('autre')
  })

  it('la catégorie déclarée passe avant la couleur', () => {
    expect(categorieEvenement({ categorie: 'travail', couleur: '3' }, { couleurs: { '3': 'garde' } })).toBe('travail')
  })

  it.each([
    ['birthday', 'anniversaire'],
    ['bastille', 'national'],
    ['armistice', 'national'],
    ['christmas', 'religieux'],
    ['catholic', 'religieux'],
    ['jaune', 'poubelle'],
    ['noire', 'poubelle'],
    ['garde-alternee', 'garde'],
    ['rugby', 'sport'],
    ['work', 'travail'],
  ])('type %s → %s', (type, attendu) => {
    expect(categorieEvenement({ type })).toBe(attendu)
  })

  it('ne devine plus rien d\'un prénom ou d\'un titre de poste', () => {
    expect(categorieEvenement({ type: 'default', titre: 'Charlène — Matin' })).toBe('autre')
    expect(categorieEvenement({ type: 'default', titre: 'Lyam et Noah' })).toBe('autre')
  })

  it('classe Santé et Rendez-vous par mots-clés, sans accents ni majuscules', () => {
    expect(categorieEvenement({ type: 'default', titre: 'Dentiste Luis' })).toBe('sante')
    expect(categorieEvenement({ type: 'default', titre: 'Séance KINÉ' })).toBe('sante')
    expect(categorieEvenement({ type: 'default', titre: 'Rendez vous véhicule Renault Rudy' })).toBe('rdv')
    expect(categorieEvenement({ type: 'default', titre: 'RDV banque' })).toBe('rdv')
  })

  it('prend les mots-clés de config.json', () => {
    const regles = { motsCles: { sante: ['neuropsy'], sport: ['piscine'] } }
    expect(categorieEvenement({ type: 'default', titre: 'Lyam NeuroPsy' }, regles)).toBe('sante')
    expect(categorieEvenement({ type: 'default', titre: 'Piscine' }, regles)).toBe('sport')
  })

  it('ne confond pas un mot-clé au milieu d\'un mot', () => {
    expect(categorieEvenement({ type: 'default', titre: 'Opsys réunion' })).toBe('autre')
  })

  it('a une étiquette pour chaque catégorie sauf « autre »', () => {
    expect(ETIQUETTES.rdv).toBe('Rendez-vous')
    expect(ETIQUETTES.autre).toBe('')
  })
})

describe('imageEvenement', () => {
  it('donne une image jour et une image nuit pour les anniversaires', () => {
    expect(imageEvenement('birthday', false)).toBeTruthy()
    expect(imageEvenement('birthday', true)).not.toBe(imageEvenement('birthday', false))
  })

  it("réutilise l'image du Nouvel An pour Noël", () => {
    expect(imageEvenement('christmas', false)).toBe(imageEvenement('newyear', false))
  })

  it('sans image (fête nationale, Toussaint, événement ordinaire) → null', () => {
    expect(imageEvenement('bastille', false)).toBeNull()
    expect(imageEvenement('catholic', true)).toBeNull()
    expect(imageEvenement('default', false)).toBeNull()
  })
})
