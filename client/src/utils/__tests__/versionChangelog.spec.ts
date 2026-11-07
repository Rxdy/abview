import { describe, it, expect } from 'vitest'
import changelog from '../../../../CHANGELOG.md?raw'
import { version as versionPackage } from '../../../package.json'
import { versionDuChangelog } from '../versionChangelog'

describe('versionDuChangelog', () => {
  it('prend la première entrée datée, la plus récente', () => {
    expect(versionDuChangelog('# Changelog\n\n---\n\n## [v3.3.0] — 2026-11-07\n\n### Ajouté\n\n## [v3.2.0] — 2026-10-10\n')).toBe('3.3.0')
  })

  it('accepte une entrée sans « v »', () => {
    expect(versionDuChangelog('## [4.0.1] - 2027-01-02')).toBe('4.0.1')
  })

  it('ignore une section « Non publié » placée au-dessus', () => {
    expect(versionDuChangelog('## [Unreleased]\n\n- en cours\n\n## [v3.4.0] — 2026-12-01\n\n## [v3.3.0] — 2026-11-07')).toBe('3.4.0')
  })

  it('ne confond pas un numéro cité dans le texte avec une entrée', () => {
    expect(versionDuChangelog('Voir la v9.9.9 dans le texte\n\n## [v3.3.0] — 2026-11-07')).toBe('3.3.0')
  })

  it('échoue clairement quand le changelog ne contient aucune version', () => {
    expect(() => versionDuChangelog('# Changelog vide')).toThrow(/CHANGELOG\.md/)
  })
})

describe('CHANGELOG.md du dépôt', () => {
  it('a une version lisible', () => {
    expect(versionDuChangelog(changelog)).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('est aligné avec client/package.json (le pied de page suit le changelog, npm lit package.json)', () => {
    expect(versionPackage, 'Mettre client/package.json à la version du dernier titre de CHANGELOG.md').toBe(versionDuChangelog(changelog))
  })
})
