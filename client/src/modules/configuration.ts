/**
 * Une configuration = la disposition complète de l'écran : quels modules, où, sous quelle variante.
 * C'est une donnée simple (JSON) : on peut l'enregistrer sous un nom (configuration « favorite »),
 * la dupliquer, l'envoyer au kiosque. La taille d'un module vient de sa variante, jamais d'un
 * nombre libre : une configuration valide ne peut pas demander une taille que le module ne sait pas afficher.
 */
import { dansLaGrille, GRILLE, seChevauchent, type Grille, type Rectangle } from './grille'
import { REGISTRE, variante, type Registre } from './registre'

export interface Placement {
  /** Identifiant de cette instance (unique dans la configuration). */
  id: string
  /** Clé du module dans le registre. */
  module: string
  /** Variante (taille) ; la première du registre si absente. */
  variante?: string
  /** Case de départ, à partir de 1. */
  x: number
  y: number
  /** Réglages propres au module (ville de la météo, listes affichées…). */
  reglages?: Record<string, unknown>
}

export interface Configuration {
  nom: string
  placements: Placement[]
}

/** La disposition actuelle du kiosque, exprimée en cases. */
export const CONFIGURATION_PAR_DEFAUT: Configuration = {
  nom: 'Standard',
  placements: [
    { id: 'calendrier', module: 'calendrier', x: 1, y: 1 },
    { id: 'meteo', module: 'meteo', x: 1, y: 6 },
    { id: 'taches', module: 'taches', x: 5, y: 6 },
  ],
}

/** Rectangle occupé par un placement, ou undefined si son module ou sa variante est inconnu. */
export function rectangle(p: Placement, registre: Registre = REGISTRE): Rectangle | undefined {
  const v = variante(registre, p.module, p.variante)
  return v && { x: p.x, y: p.y, largeur: v.largeur, hauteur: v.hauteur }
}

/** Les problèmes d'une configuration, en français ; liste vide si elle est valide. */
export function valider(config: Configuration, registre: Registre = REGISTRE, grille: Grille = GRILLE): string[] {
  return [...validerPlacement(config, registre, grille), ...validerExemplaires(config, registre)]
}

/** Placement seul : modules et variantes connus, dans la grille, sans chevauchement. */
export function validerPlacement(
  config: Configuration,
  registre: Registre = REGISTRE,
  grille: Grille = GRILLE
): string[] {
  const erreurs: string[] = []
  const vus = new Set<string>()
  const posés: { id: string; r: Rectangle }[] = []

  for (const p of config.placements) {
    if (vus.has(p.id)) erreurs.push(`Identifiant en double : « ${p.id} »`)
    vus.add(p.id)

    if (!registre[p.module]) {
      erreurs.push(`« ${p.id} » : module inconnu « ${p.module} »`)
      continue
    }
    const r = rectangle(p, registre)
    if (!r) {
      erreurs.push(`« ${p.id} » : variante inconnue « ${p.variante} » pour ${p.module}`)
      continue
    }
    if (!dansLaGrille(r, grille)) {
      erreurs.push(`« ${p.id} » : sort de la grille (${grille.colonnes} × ${grille.lignes} cases)`)
      continue
    }
    for (const autre of posés) {
      if (seChevauchent(r, autre.r)) erreurs.push(`« ${p.id} » chevauche « ${autre.id} »`)
    }
    posés.push({ id: p.id, r })
  }
  return erreurs
}

/** Plusieurs exemplaires d'un même module : limite du module, et réglages qui les distinguent. */
export function validerExemplaires(config: Configuration, registre: Registre = REGISTRE): string[] {
  const erreurs: string[] = []
  const parModule = new Map<string, Placement[]>()
  for (const p of config.placements) {
    if (registre[p.module]) parModule.set(p.module, [...(parModule.get(p.module) ?? []), p])
  }
  for (const [module, exemplaires] of parModule) {
    const def = registre[module]!
    if (def.max !== undefined && exemplaires.length > def.max) {
      erreurs.push(`« ${def.titre} » : ${def.max} au plus (${exemplaires.length} placés)`)
    }
    if (def.distincts) {
      const vues = new Map<string, string>()
      for (const p of exemplaires) {
        const signature = JSON.stringify(p.reglages ?? {})
        const premier = vues.get(signature)
        if (premier) erreurs.push(`« ${p.id} » et « ${premier} » afficheraient la même chose : changez leurs réglages`)
        else vues.set(signature, p.id)
      }
    }
  }
  return erreurs
}
