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
  ajouterEnPoussant,
  definirReglage,
  deplacerEnPoussant,
  obstacle,
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
    let c = ajouter(vide, 'taches')!
    expect(identifiantLibre(c, 'taches')).toBe('taches-2')
    c = ajouter(c, 'taches')!
    expect(c.placements.map((p) => p.id)).toEqual(['taches', 'taches-2'])
    expect(identifiantLibre(c, 'taches')).toBe('taches-3')
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

  it('limite le nombre d’exemplaires : une seule météo, trois listes de tâches au plus', () => {
    const avecMeteo = ajouter(vide, 'meteo')!
    expect(obstacle(avecMeteo, 'meteo')).toBe('max')
    expect(ajouter(avecMeteo, 'meteo')).toBeNull()
    expect(ajouterA(avecMeteo, 'meteo', 9, 6)).toBeNull()

    const trois: Configuration = {
      nom: 'Trois',
      placements: [1, 4, 7].map((x) => ({ id: `t${x}`, module: 'taches', variante: 'etroit', x, y: 1 })),
    }
    expect(obstacle(trois, 'taches')).toBe('max')
    expect(ajouter(trois, 'taches')).toBeNull()
    expect(obstacle({ ...trois, placements: trois.placements.slice(0, 2) }, 'taches')).toBeNull()
  })

  it('distingue « trop d’exemplaires » de « plus de place »', () => {
    expect(obstacle(CONFIGURATION_PAR_DEFAUT, 'calendrier')).toBe('max')
    const sansAgenda = retirer(CONFIGURATION_PAR_DEFAUT, 'calendrier')
    expect(obstacle(sansAgenda, 'calendrier')).toBeNull() // il tient dans la place libérée
    expect(obstacle(vide, 'inconnu')).toBe('place')
  })

  it('définit un réglage, l’efface avec une liste vide, sans toucher aux autres', () => {
    let c = ajouter(vide, 'taches')!
    c = definirReglage(c, 'taches', 'listes', ['Julie', 'Action'])
    expect(c.placements[0]!.reglages).toEqual({ listes: ['Julie', 'Action'] })
    c = definirReglage(c, 'taches', 'listes', [])
    expect(c.placements[0]).not.toHaveProperty('reglages')
    expect(vide.placements).toEqual([])
  })

  describe('déplacer en poussant les autres', () => {
    const place = (c: Configuration, id: string) => c.placements.find((p) => p.id === id)!

    it('un module posé sur un autre le fait aller là où il y a de la place', () => {
      // les tâches (8×3) sur la météo (4×3) : la météo va à droite, dans la place libérée
      const r = deplacerEnPoussant(CONFIGURATION_PAR_DEFAUT, 'taches', 1, 6)!
      expect(place(r.config, 'taches')).toMatchObject({ x: 1, y: 6 })
      expect(place(r.config, 'meteo')).toMatchObject({ x: 9, y: 6 })
      expect(r.deplaces).toEqual([{ id: 'meteo', module: 'meteo' }])
      expect(valider(r.config)).toEqual([])
    })

    it('préfère l’ancienne place du module déplacé : un échange quand ça tient', () => {
      const deux: Configuration = {
        nom: 'Deux',
        placements: [
          { id: 'meteo', module: 'meteo', x: 1, y: 1 },
          { id: 'taches', module: 'taches', variante: 'moyen', x: 5, y: 1 },
        ],
      }
      const r = deplacerEnPoussant(deux, 'meteo', 5, 1)!
      expect(place(r.config, 'meteo')).toMatchObject({ x: 5, y: 1 })
      expect(place(r.config, 'taches')).toMatchObject({ x: 1, y: 1 }) // l'ancienne place de la météo
      expect(valider(r.config)).toEqual([])
    })

    it('le module poussé rétrécit quand il n’a plus la place pour sa taille', () => {
      // les tâches glissent d'une case à gauche : la météo (4×3) n'a plus de place en 4×3, elle passe en compact (3×2)
      const r = deplacerEnPoussant(CONFIGURATION_PAR_DEFAUT, 'taches', 4, 6)!
      expect(place(r.config, 'meteo')).toMatchObject({ x: 1, y: 6, variante: 'compact' })
      expect(r.deplaces).toEqual([{ id: 'meteo', module: 'meteo', reduitEn: 'compact' }])
      expect(valider(r.config)).toEqual([])
    })

    it('si le module poussé ne trouve aucune place, rien ne bouge (null)', () => {
      // la météo sur l'agenda (12×5, une seule taille) : l'agenda n'a nulle part où aller
      expect(deplacerEnPoussant(CONFIGURATION_PAR_DEFAUT, 'meteo', 1, 1)).toBeNull()
    })

    it('refuse de sortir de la grille', () => {
      expect(deplacerEnPoussant(CONFIGURATION_PAR_DEFAUT, 'taches', 9, 6)).toBeNull()
    })

    it('sur un emplacement libre, c’est un simple déplacement', () => {
      const sans = retirer(CONFIGURATION_PAR_DEFAUT, 'meteo')
      const r = deplacerEnPoussant(sans, 'taches', 1, 6)!
      expect(r.deplaces).toEqual([])
      expect(place(r.config, 'taches')).toMatchObject({ x: 1, y: 6 })
    })

    it('ne change pas l’ordre des modules et laisse la configuration d’origine intacte', () => {
      const avant = JSON.stringify(CONFIGURATION_PAR_DEFAUT)
      const r = deplacerEnPoussant(CONFIGURATION_PAR_DEFAUT, 'taches', 1, 6)!
      expect(r.config.placements.map((p) => p.id)).toEqual(['calendrier', 'meteo', 'taches'])
      expect(JSON.stringify(CONFIGURATION_PAR_DEFAUT)).toBe(avant)
    })

    it('un module ajouté sur un autre pousse celui-ci, et le maximum reste respecté', () => {
      const sansTaches = retirer(CONFIGURATION_PAR_DEFAUT, 'taches')
      const r = ajouterEnPoussant(sansTaches, 'taches', 1, 6)!
      expect(place(r.config, 'taches')).toMatchObject({ x: 1, y: 6 })
      expect(place(r.config, 'meteo').x).toBeGreaterThanOrEqual(9)
      expect(valider(r.config).filter((e) => e.includes('chevauche'))).toEqual([])
      expect(ajouterEnPoussant(CONFIGURATION_PAR_DEFAUT, 'meteo', 9, 6)).toBeNull() // une seule météo
    })
  })
})
