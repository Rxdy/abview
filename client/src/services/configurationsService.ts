import { apiService } from './apiService'
import type { Configuration } from '../modules/configuration'

export interface ResumeConfiguration {
  id: string
  nom: string
}

const entete = (jeton: string) => ({ Authorization: `Bearer ${jeton}` })

/** Les erreurs du serveur, dites simplement. */
export function messageErreur(erreur: unknown): string {
  const texte = erreur instanceof Error ? erreur.message : String(erreur)
  if (texte.includes('401')) return 'Jeton refusé : vérifiez le jeton d’administration.'
  if (texte.includes('503')) return 'Écriture désactivée sur le serveur (pas de jeton réglé).'
  if (texte.includes('409')) return 'Configuration active : activez-en une autre avant de la supprimer.'
  if (texte.includes('422')) return 'Le serveur refuse cette configuration.'
  return 'Serveur injoignable ou erreur inattendue.'
}

export const configurationsService = {
  liste(): Promise<{ actif: string | null; configurations: ResumeConfiguration[] }> {
    return apiService.get('/configurations')
  },
  async obtenir(id: string): Promise<Configuration> {
    const { configuration } = await apiService.get(`/configurations/${id}`)
    return configuration
  },
  enregistrer(id: string, config: Configuration, jeton: string) {
    return apiService.put(`/configurations/${id}`, config, entete(jeton))
  },
  supprimer(id: string, jeton: string) {
    return apiService.delete(`/configurations/${id}`, entete(jeton))
  },
  /** id = null : retour à la disposition standard. */
  activer(id: string | null, jeton: string) {
    return apiService.put('/configuration/active', { id }, entete(jeton))
  },
}
