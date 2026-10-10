/**
 * Catégorie d'un événement de l'agenda : étiquette, couleurs (jetons --cat-* de base.css) et
 * image de fond éventuelle. Seul endroit où un événement est classé (specs/refonte-graphique.md).
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
  poubelle: 'Poubelle',
  anniversaire: 'Anniversaire',
  national: 'Fête nationale',
  religieux: 'Fête religieuse',
  autre: '',
}

// Catégories des jours spéciaux de utils/holidays.ts
const FETES_NATIONALES = ['newyear', 'labor', 'victory', 'bastille', 'armistice']
const FETES_RELIGIEUSES = ['christmas', 'easter', 'catholic', 'ramadan', 'lent']

const SANTE = /\b(dentiste|m[ée]decin|docteur|dr\.?|kin[ée]|psy|neuropsy|ortho|ophtalmo|p[ée]diatre|h[ôo]pital|vaccin|prise de sang|rdv m[ée]dical|radio|labo|pharmacie)/i
// Présence des enfants saisie dans l'agenda (en plus de la garde alternée des horaires)
const GARDE = /\bgarde\b|lyam\s+(et|&)\s+noah/i
// Postes écrits dans l'agenda par planning-relay (« Charlène — Matin ») ou saisis à la main
const TRAVAIL = /(—|-)\s*(matin|soir|nuit|journ[ée]e)\b|\bposte\b/i

export function categorieEvenement(type: string | undefined, titre = ''): Categorie {
  const t = (type || '').toLowerCase()
  if (t === 'birthday') return 'anniversaire'
  if (FETES_NATIONALES.includes(t)) return 'national'
  if (FETES_RELIGIEUSES.includes(t)) return 'religieux'
  if (t === 'jaune' || t === 'noire') return 'poubelle'
  if (t === 'garde-alternee' || t === 'family' || GARDE.test(titre)) return 'garde'
  if (t === 'rugby' || t === 'sport') return 'sport'
  if (t === 'medical' || SANTE.test(titre)) return 'sante'
  if (t === 'work' || t === 'planning' || TRAVAIL.test(titre)) return 'travail'
  return 'autre'
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
