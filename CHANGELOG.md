# Changelog — AbView

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).
Versionnage selon [Semantic Versioning](https://semver.org/lang/fr/).

---

## [v2.6.2] — 2026-05-05

### Corrigé
- **Calendrier** : Événements à heure fixe (Caroline, Luis, Rudy) disparaissent maintenant à l'heure de fin exacte, pas à minuit du jour suivant
- **Calendrier** : Support des shifts qui traversent minuit (ex: Luis 21h00-05h00) - affichés correctement les deux jours
- **Calendrier** : Filtre temporel stricte (>) utilisé à la place de (>=) pour éviter d'afficher les événements passés
- **Calendrier** : Ajout du filtrage même-jour basé sur l'heure actuelle pour plus de robustesse

---

## [v2.6.1] — 2026-04-27

### Corrigé
- **Annual Recap** : AnnualRecapWrapper utilise maintenant annualRecapStore correctement
- **Annual Recap** : EventsSlide corrigé (champs événements + intervalle 15s par mois)
- **Annual Recap** : WeatherSlide utilise tempMax pour calculer jour le plus froid/chaleureux
- **Archivage automatique** : Correction critique - archivage maintenant déclenché au changement d'année (pas seulement 31 décembre)
- **Archivage météo** : Archivage automatique des stats météo au changement d'année

### Modifié
- Mise à jour PENDING_WORK.md et AUDIT_WRAP_ANNUEL.md pour refléter l'état actuel

### Ajouté
- Nouveau logo AbView dans le header et favicon
- 7 intervalles de couleur (gradient bleu→rouge) pour les températures météo

### Corrigé
- Centrage des titres d'événements spéciaux (jours fériés / anniversaires) sur les cartes calendrier
- Cycle de planning de Caroline basé sur ancre de date (anchor-based shift cycle)
- Suppression des doublons d'événements Google Calendar
- Évitement des doublons entre planning local et Google Calendar
- Correction des cycles de travail de Luis et Caroline
- Fix session Chromium périmée au lancement `make prod`

---

## [v2.5.0] — 2026-01-30

### Ajouté
- Fonds visuels thématiques pour les jours fériés dans le CalendarModule (Noël, Pâques, Ramadan, etc.)
- Filtrage amélioré des événements calendrier

### Modifié
- Mise à jour des audits de sécurité (packages)

---

## [v2.4.0] — 2026-01-21

### Ajouté
- **Système de Bilan Annuel (Annual Recap)** — récapitulatif de fin d'année automatisé
  - Slide UserStats : classement des utilisateurs par productivité
  - Slide Tasks : bilan des tâches accomplies
  - Slide Weather : statistiques météo annuelles
  - Slide Events : événements marquants de l'année
  - Slide Celebration : écran de clôture festif
- Archivage automatique des données déclenché le 31 décembre
- Navigation entre 5 slides dans le bilan annuel
- Couverture de tests portée à 95%+ (vues, stores, composables, icônes)

### Modifié
- `getRecapData` utilise désormais les données archivées de l'année précédente

---

## [v2.3.0] — 2026-01-01

### Ajouté
- **Système d'anniversaire complet avec effets visuels**
  - Détection automatique des anniversaires dans Google Calendar
  - 200 confettis + 25 ballons animés
  - Répétition automatique toutes les 10 minutes le jour J
  - Raccourcis clavier : `Ctrl+Alt+B` (test), `Ctrl+Shift+B` (arrêt)
- 5ème jour de prévision météo + affichage du jour de la semaine
- Curseur souris masqué en mode production (écran kiosque)

### Corrigé
- Boucle infinie de l'effet anniversaire (validation de date + anti-re-déclenchement)
- Effet confetti absent en production
- Désactivation complète des Vue Devtools en production
- Affichage des heures pour les événements ponctuels, couleurs distinctes (bleu planning, vert calendrier)
- Hiérarchie des tâches : organisation parent-enfant, cases à cocher masquées pour les parents
- Synchronisation des tâches et mise à jour de la barre de progression
- Défilement automatique des listes de tâches après chargement
- URLs API corrigées (développement et production)
- Dépendances circulaires résolues + mise en cache implémentée

### Infrastructure
- Nettoyage Docker : suppression du service client v1

---

## [v1.3.0] — 2025-12-15

### Ajouté
- **Barre de progression** pour le suivi visuel des tâches

### Corrigé
- Augmentation du maxResults Google Tasks : 10 → 100
- Correction de la date courante dans le module météo
- Corrections diverses du module tâches

---

## [v1.2.0] — 2025-12-10

### Ajouté
- **Gestionnaire d'application** : kill Chromium + écran de chargement au démarrage
- Gestion des logs d'erreur améliorée

### Corrigé
- Heure des notifications et gestion de la mise en veille de l'écran
- Installation de `jq` dans les scripts de déploiement
- Processus `pkill` pour nettoyage propre

---

## [v1.1.0] — 2025-12-08

### Ajouté
- **Système de logs** : enregistrement des événements applicatifs
- **Interface de contrôle et visualisation des logs**

### Corrigé
- Curseur souris (kiosque)
- Thème clair/méteo synchro avec l'heure

---

## [v1.0.0] — 2025-12-07

### Ajouté
- **Contrôle de l'écran** : mise en veille et réveil selon horaires configurés
- Notifications sonores
- Défilement horizontal des listes de tâches longues

### Corrigé
- Module calendrier (planning Caroline, calcul des tailles)
- Module tâches (couleurs, défilement)
- Vérification du thème clair/sombre
- Module météo
- Curseur + horaires de veille
- Amélioration responsive générale, taille de texte, cartes événements

---

## [v0.2.0] — 2025-11-21

### Ajouté
- Améliorations de l'interface responsive
- Test de notifications
- Calcul dynamique de la taille des modules

### Corrigé
- Icônes du calendrier
- Intervalle de rafraîchissement des données

---

## [v0.1.0] — 2025-09-11

### Ajouté
- **Initialisation du projet AbView**
- Application Vue 3 + TypeScript (frontend)
- Backend AdonisJS avec intégration Google Calendar & Google Tasks
- Module calendrier (événements Google Calendar)
- Module tâches (Google Tasks)
- Module météo
- Infrastructure Docker + Docker Compose
- Makefile pour déploiement et gestion
- Arrêt gracieux (graceful shutdown)
