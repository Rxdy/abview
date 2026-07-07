# Règles de Développement (DEV_GUIDELINES.md)

Ce fichier définit les règles et bonnes pratiques pour développer sur ce projet, en collaboration avec GitHub Copilot. Il vise à optimiser le workflow, éviter les pertes de temps, et assurer la qualité.

## Processus Général

- **Avant tout développement substantiel** : Créer un fichier de spécifications (ex. `specs/feature-name.md`) décrivant l'objectif, la structure proposée, les étapes, et les dépendances. Inclure des exemples ou des wireframes si pertinent.
- **Validation** : Attendre la validation explicite de l'utilisateur sur le spec avant de produire du code. Si refusé, ajuster et re-valider.
- **Découpage** : Pour les tâches complexes, découper en sous-tâches validées étape par étape. Éviter les changements massifs sans itération.
- **Références** : Se référer implicitement à ce fichier pour chaque interaction. Pas besoin de le rappeler à chaque prompt.
- **Commits et branches** : Utiliser des branches dédiées pour les features (ex. `feature/component-visualizer`). Commits atomiques avec messages descriptifs.
- **Nommage des branches** : obligatoire, vérifié par le job `branch-naming` sur chaque PR. Préfixes acceptés : `feature/`, `fix/`, `hotfix/`, `chore/`, `ci/`, `docs/`, `refactor/`, `test/` (ex. `feature/component-visualizer`, `fix/horaires-refresh`).
- **Workflow git (sans PR, solo dev)** : `main` = production, `dev` = intégration. Les deux sont
  protégées sur GitHub (CI verte obligatoire sur le commit poussé, pas de force-push/suppression,
  protection appliquée même à l'admin). La CI tourne désormais sur **chaque push, quelle que soit
  la branche** (pas seulement main/dev), donc :
  1. Créer une branche depuis `dev` (`feature/xxx`, `fix/xxx`, …), pousser au fur et à mesure —
     la CI (lint/tests conditionnels selon client/server modifiés) tourne sur cette branche.
  2. Une fois verte, fusionner **en fast-forward uniquement** :
     `git checkout dev && git merge --ff-only feature/xxx && git push`.
     Le commit poussé sur `dev` est alors exactement celui déjà validé par la CI sur la branche
     feature (même SHA) → GitHub retrouve les checks déjà passés et accepte le push, sans PR.
  3. Si `--ff-only` échoue (dev a avancé entre-temps), rebaser la feature sur `dev`
     (`git rebase dev`), repousser la branche (nouvelle CI), puis refaire le ff-merge.
  4. Même principe pour `dev` → `main`.
  5. Un push vers `main` déclenche en plus le build/push des images GHCR modifiées
     (frontend et/ou backend selon ce qui a changé) → Watchtower redéploie sur le Pi (~5 min).
  - Une PR reste possible si besoin (revue, historique), mais n'est plus requise pour merger.

## Qualité et Tests

- **Tests unitaires** : Inclure des tests unitaires minimaux pour chaque nouveau composant/fonction (même si ça ralentit). Utiliser Vitest (déjà configuré).
- **Vérification des fichiers** : Après création ou modification de fichiers, scanner automatiquement pour erreurs de compilation/TypeScript (fichiers rouges). Corriger immédiatement avant de continuer.
- **Vérification des erreurs de build** : Toujours exécuter `make build-check` avant de committer pour détecter les erreurs TypeScript. Corriger toutes les erreurs avant de pousser.
- **Debugging et Logs** : Lors de debug, utiliser des logs temporaires (console.log), mais les supprimer ou les remplacer par des logs permanents (ex. via logger.ts) une fois le debug terminé. Éviter les logs oubliés en prod.
- **Linting et formatage** : Respecter ESLint et Prettier. Corriger automatiquement avant commit.
- **Validation** : Après tout changement, lancer les tests/builds pour vérifier. Signaler les erreurs et proposer des fixes.

### Gestion des Erreurs TypeScript

#### Erreurs Courantes et Solutions

**Variables non utilisées** (`TS6133`):
```typescript
// ❌ Mauvais
const unusedVar = 'test'

// ✅ Bon - supprimer ou préfixer
const _unusedVar = 'test'  // ou supprimer complètement
```

**Propriétés potentiellement null** (`TS18047`):
```typescript
// ❌ Mauvais
event.target.value

// ✅ Bon - vérifier null ou utiliser optional chaining
event.target?.value || ''
```

**Types incompatibles** (`TS2322`):
```typescript
// ❌ Mauvais
const date: Date = '2023-01-01'

// ✅ Bon - conversion appropriée
const date: Date = new Date('2023-01-01')
```

**Imports inutiles** (`TS6192`):
```typescript
// ❌ Mauvais
import { ref, watch } from 'vue'
// ... code qui n'utilise pas watch

// ✅ Bon - supprimer les imports inutiles
import { ref } from 'vue'
```

#### Commande de Vérification

```bash
make build-check
```

Cette commande doit être exécutée avant chaque commit pour s'assurer qu'il n'y a pas d'erreurs TypeScript.

## Architecture et Bonnes Pratiques

- **Composants** : Préférer des composants réutilisables et "purs" (sans logique métier hardcodée). Pour les formulaires, utiliser une couche input de base + wrapper (ex. FormField).
- **Règles spécifiques aux composants** (voir DEV_GUIDELINES_COMPONENTS.md si créé) : Utiliser des props typées, éviter les side-effects, documenter via JSDoc pour la visualisation.
- **Templates strings avec HTML** : Dans les fichiers Vue, éviter les templates strings contenant du HTML non échappé (ex. `<template>`). Cela cause des erreurs de compilation "Unterminated template". Utiliser des variables séparées ou des fonctions pour charger le contenu HTML.
- **Performance** : Lazy-load les composants lourds. Éviter les imports inutiles.
- **Sécurité** : Pas d'exfiltration de secrets. Vérifier les permissions pour les features sensibles.

## Outils et Environnements

- **Dev vs Prod** : Features comme la visualisation des composants uniquement en dev (via env var).
- **Branches Git** : Pour les features complexes, créer une branche dédiée (ex. `feature/component-visualizer`). Pas obligatoire si seul dev, mais utile pour l'organisation. Commits atomiques.
- **Fichiers de référence spécifiques** : Pour chaque type d'élément (composants, vues, services), créer un fichier dédié (ex. `DEV_GUIDELINES_COMPONENTS.md`) avec règles implicites. Se référer automatiquement lors du dev.
- **Hot Reload** : Le projet utilise Vite avec hot reload automatique. Ne pas proposer de lancer `npm run dev` manuellement après chaque changement - les modifications sont appliquées en live.
- **Serveur de développement** : Le projet est toujours en mode développement avec le serveur lancé automatiquement. Pas besoin de lancer `npm run dev` manuellement.
- **Outils** : Utiliser les tools disponibles (read_file, run_in_terminal, etc.) pour collecter du contexte avant d'agir.
- **Documentation** : Mettre à jour ce fichier si de nouvelles règles émergent. Inclure des exemples dans les specs.

## Exceptions

- Pour les tâches urgentes/minimes (ex. hotfix), contourner le spec si validé oralement.
- Si un manque est identifié (ex. tests manquants), le noter dans TODO.md.