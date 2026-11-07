/**
 * Version de l'app : celle de l'entrée la plus récente de CHANGELOG.md (« ## [v3.3.0] — 2026-11-07 »).
 * Le pied de page, l'étiquette de l'image Docker et les tests la lisent là : on monte la version
 * en ajoutant une entrée au changelog, pas en l'écrivant à plusieurs endroits.
 * Une section « [Unreleased] » placée au-dessus est ignorée : seul un numéro x.y.z compte.
 */
export function versionDuChangelog(texte: string): string {
  const version = texte.match(/^##\s*\[v?(\d+\.\d+\.\d+)\]/m)?.[1]
  if (!version) throw new Error('CHANGELOG.md : aucune entrée « ## [vX.Y.Z] » trouvée, impossible de connaître la version')
  return version
}
