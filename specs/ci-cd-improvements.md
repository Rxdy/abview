# CI/CD — jobs conditionnels, tests serveur, naming de branches, branch protection

## Objectif
Le pipeline actuel (`.github/workflows/ci.yml`) tourne tous ses jobs à chaque push/PR peu
importe ce qui a changé, n'a pas de tests serveur, et `main`/`dev` ne sont pas protégées sur
GitHub malgré ce que documente `DEV_GUIDELINES.md`. On corrige les trois.

## 1. Jobs conditionnels par chemin modifié

Ajouter un job `changes` en tête de pipeline avec `dorny/paths-filter@v3` qui détecte :
- `client` → `client/**`
- `server` → `server/**`
- `docker` → `Dockerfile`, `docker-compose*.yml`, `nginx.conf`

Les jobs existants deviennent conditionnels :
- `lint-client`, `test-client` : `if: needs.changes.outputs.client == 'true'`
- `lint-server` : `if: needs.changes.outputs.server == 'true'`
- `build-push` (matrix frontend/backend) : chaque cible ne build que si son dossier ou
  `docker` a changé (ex. `matrix.target == 'frontend' && (client == 'true' || docker == 'true')`)

Un job skip (condition fausse) est traité par GitHub comme "réussi" pour les required status
checks — pas de blocage de merge quand une partie du repo n'a pas bougé.

## 2. Job de tests serveur

Ajouter `test-server` (needs: `[changes, lint-server]`, condition `server == 'true'`) :
```yaml
- run: npm ci
  working-directory: server
- run: npm test
  working-directory: server
```
Peu de tests existent aujourd'hui (`server/tests/bootstrap.ts` seul) mais le job est en place
pour la suite. `build-push` (backend) dépendra aussi de `test-server`.

## 3. Convention de nommage de branches

Nouveau job `branch-naming`, seulement sur `pull_request`, qui valide `github.head_ref` contre :
```
^(feature|fix|hotfix|chore|ci|docs|refactor|test)/.+
```
Échoue sinon avec message explicite. Reprend les préfixes déjà utilisés dans l'historique de
commits (`feat:`, `fix:`, `ci:`, `chore:`) adaptés en préfixes de branche.

## 4. Branch protection GitHub (main + dev)

Via `gh api`, sur chacune des deux branches :
- PR obligatoire avant merge (pas de push direct)
- Status checks obligatoires et branche à jour avant merge :
  - `lint-client`, `test-client`, `lint-server`, `test-server`, `branch-naming`
  - (`build-push` exclu : il ne tourne que sur push vers `main`, jamais sur PR)
- Pas d'exigence de review (solo dev)
- Interdiction de force-push et de suppression de la branche

## Récapitulatif du nouveau pipeline

```
changes (paths-filter)
 ├─ branch-naming (PR only)
 ├─ lint-client ─┬─ test-client ─┐
 ├─ lint-server ─┼─ test-server ─┼─ build-push (main push only, matrix conditionnel)
 └───────────────┴───────────────┘
```

## Fichiers touchés
- `.github/workflows/ci.yml` (réécriture des jobs)
- Commande `gh api` exécutée pour la branch protection (pas de fichier, config GitHub)
- `DEV_GUIDELINES.md` : mise à jour de la section workflow git si le comportement diffère

## Ajustement post-implémentation : pas de required status check

Testé en conditions réelles (push direct d'un SHA déjà vert vers `dev`, avec et sans plusieurs
commits) : GitHub rejette systématiquement ("Required status check ... is expected") un push
direct dont les checks ont tourné sur une autre branche que la cible, même pour le SHA exact
déjà validé. Les required status checks ne fonctionnent en pratique que via le bouton merge
d'une PR (le check tourne dans le contexte `pull_request` ciblant la branche protégée).

Comme l'objectif explicite est de pouvoir merger `dev`/`main` sans ouvrir de PR (solo dev), on a
retiré `required_status_checks` de la branch protection des deux branches. Ce qui reste :
- `allow_force_pushes: false`, `allow_deletions: false`
- Pas de required PR review (déjà décidé), pas de required status check (nouveau)
- `ci-gate` (job d'agrégation ajouté pour ce scénario) n'est donc plus "required" côté GitHub,
  mais reste utile comme résumé visuel unique du run dans l'onglet Actions.

La CI continue de tourner sur chaque push (toutes branches) pour donner un signal avant de
merger — mais rien ne bloque techniquement un merge d'une branche rouge. Le garde-fou est
manuel : vérifier que le run est vert avant de faire `git merge` + `git push` vers `dev`/`main`.
