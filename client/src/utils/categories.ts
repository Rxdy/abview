/**
 * Catégorie d'un événement de l'agenda : étiquette, couleurs (jetons --cat-* de base.css) et
 * image de fond éventuelle. Seul endroit où un événement est classé (specs/refonte-graphique.md).
 *
 * Ordre de décision, du plus fiable au moins fiable :
 *  1. la catégorie déclarée par la source : champ « categorie » du JSON des horaires, ou propriété
 *     privée « categorie » de l'événement Google (posée par l'outil qui l'a écrit, ex. planning-relay) ;
 *  2. la couleur de l'événement dans Google Agenda, associée à une catégorie dans config.json ;
 *  3. le type que l'app connaît déjà (anniversaire, fêtes, poubelle, postes et garde des horaires) ;
 *  4. les mots-clés du titre, définis dans config.json (santé, rendez-vous).
 * Jamais de prénom ni de titre précis codé ici.
 */
import anniversaireJour from '@/assets/card/light/anniversaire.png'
import anniversaireNuit from '@/assets/card/dark/anniversaire.png'
import paquesJour from '@/assets/card/light/paques.png'
import paquesNuit from '@/assets/card/dark/paques.png'
import nouvelAnJour from '@/assets/card/light/newyear.png'
import nouvelAnNuit from '@/assets/card/dark/newyear.png'

export type Categorie =
  | 'travail'
  | 'garde'
  | 'sport'
  | 'sante'
  | 'rdv'
  | 'poubelle'
  | 'anniversaire'
  | 'national'
  | 'religieux'
  | 'autre'

export const ETIQUETTES: Record<Categorie, string> = {
  travail: 'Travail',
  garde: 'Garde',
  sport: 'Sport',
  sante: 'Santé',
  rdv: 'Rendez-vous',
  poubelle: 'Poubelle',
  anniversaire: 'Anniversaire',
  national: 'Fête nationale',
  religieux: 'Fête religieuse',
  autre: '',
}

/** Bloc « categories » de config.json */
export interface ReglesCategories {
  couleurs?: Record<string, string>
  motsCles?: Partial<Record<Categorie, string[]>>
}

/** Ce qu'il faut savoir d'un événement pour le classer */
export interface EvenementAClasser {
  type?: string
  titre?: string
  categorie?: string | null
  couleur?: string | null
}

const CATEGORIES = Object.keys(ETIQUETTES) as Categorie[]

// Mots-clés par défaut, si config.json n'en donne pas
const MOTS_CLES_PAR_DEFAUT: Partial<Record<Categorie, string[]>> = {
  sante: ['dentiste', 'medecin', 'docteur', 'kine', 'psy', 'ortho', 'ophtalmo', 'pediatre', 'hopital', 'vaccin', 'prise de sang'],
  rdv: ['rdv', 'rendez-vous', 'rendez vous'],
}

// Types déjà attribués par l'app (holidays.ts, horaires, anniversaires)
const PAR_TYPE: Record<string, Categorie> = {
  birthday: 'anniversaire',
  newyear: 'national',
  labor: 'national',
  victory: 'national',
  bastille: 'national',
  armistice: 'national',
  christmas: 'religieux',
  easter: 'religieux',
  catholic: 'religieux',
  ramadan: 'religieux',
  lent: 'religieux',
  jaune: 'poubelle',
  noire: 'poubelle',
  'garde-alternee': 'garde',
  family: 'garde',
  rugby: 'sport',
  sport: 'sport',
  medical: 'sante',
  work: 'travail',
  planning: 'travail',
}

const valide = (c: string | null | undefined): Categorie | null =>
  c && (CATEGORIES as string[]).includes(c) ? (c as Categorie) : null

// « Kiné » → « kine » : comparaison sans accents ni majuscules
const normaliser = (texte: string) =>
  texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const contientMot = (titre: string, mot: string) => {
  const m = normaliser(mot).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^a-z0-9])${m}`).test(titre)
}

export function categorieEvenement(ev: EvenementAClasser, regles: ReglesCategories = {}): Categorie {
  const declaree = valide(ev.categorie)
  if (declaree) return declaree

  const parCouleur = ev.couleur ? valide(regles.couleurs?.[ev.couleur]) : null
  if (parCouleur) return parCouleur

  const parType = PAR_TYPE[(ev.type || '').toLowerCase()]
  if (parType) return parType

  const titre = normaliser(ev.titre || '')
  const motsCles = { ...MOTS_CLES_PAR_DEFAUT, ...regles.motsCles }
  for (const [categorie, mots] of Object.entries(motsCles)) {
    if (valide(categorie) && mots?.some(mot => contientMot(titre, mot))) return categorie as Categorie
  }
  return 'autre'
}

/**
 * Titre affiché : pour un rendez-vous, le mot-clé qui l'a fait reconnaître est retiré, l'étiquette
 * « Rendez-vous » le dit déjà (« Rendez vous véhicule Renault » → « Véhicule Renault »).
 */
export function titreAffiche(titre: string, categorie: Categorie, regles: ReglesCategories = {}): string {
  if (categorie !== 'rdv') return titre
  const mots = { ...MOTS_CLES_PAR_DEFAUT, ...regles.motsCles }.rdv || []
  let reste = titre
  for (const mot of [...mots].sort((a, b) => b.length - a.length)) {
    const motif = mot.split(/[\s-]+/).map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s-]+')
    reste = reste.replace(new RegExp(`(^|\\s)${motif}(\\s*:)?(?=\\s|$)`, 'i'), ' ')
  }
  reste = reste.replace(/\s+/g, ' ').trim()
  if (!reste) return titre
  return reste.charAt(0).toUpperCase() + reste.slice(1)
}

/** Image de fond de la carte (anniversaire et fêtes qui en ont une), sinon null. */
export function imageEvenement(type: string | undefined, nuit: boolean): string | null {
  switch ((type || '').toLowerCase()) {
    case 'birthday':
      return nuit ? anniversaireNuit : anniversaireJour
    case 'easter':
      return nuit ? paquesNuit : paquesJour
    case 'newyear':
    case 'christmas':
      return nuit ? nouvelAnNuit : nouvelAnJour
    default:
      return null // images manquantes : tâches en attente, la carte garde son pastel
  }
}
