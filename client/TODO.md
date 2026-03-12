# TODO - Fonctionnalités à implémenter

## ✅ **Tests des composants - Améliorations apportées**

### Corrections des tests existants
- [x] **DateTimeModule.spec.ts** : Simplifié les mocks pour éviter les problèmes de localisation
- [x] **ProgressBar.spec.ts** : Corrigé les tests des computed properties avec des valeurs mockées appropriées
- [x] **Configuration Pinia** : Vérifié que tous les tests utilisent `setActivePinia(createPinia())`

### Nouveaux tests ajoutés
- [x] **UserStatsSlide.spec.ts** : Tests complets pour le nouveau slide des statistiques utilisateurs
- [x] **AnnualRecapWrapper.spec.ts** : Tests pour la navigation automatique et les états de chargement
- [x] **TasksSlide.spec.ts** : Tests pour les statistiques de tâches et calculs
- [x] **WeatherSlide.spec.ts** : Tests pour les statistiques météo annuelles
- [x] **annualRecapStore.spec.ts** : Tests pour le store de données du récapitulatif

### Améliorations de couverture
- [x] Tests pour les états d'erreur et de chargement
- [x] Tests pour les computed properties critiques
- [x] Tests pour la navigation automatique des slides
- [x] Tests pour les calculs de statistiques

## 🎯 **Résultats attendus**
- **Couverture de test** : Passage de 81% à 95%+ avec les nouveaux tests
- **Composants testés** : Tous les composants Annual Recap maintenant couverts
- **Fiabilité** : Tests plus robustes avec moins de mocks complexes

## 📋 **Prochaines étapes**
- [ ] Exécuter les tests pour valider les corrections
- [ ] Ajuster les mocks si nécessaire
- [ ] Ajouter des tests d'intégration si besoin

## 🎯 Priorités Janvier 2026 - RECAP ANNUEL COMPLET

### ✅ TERMINÉ (Décembre 2025 - Janvier 2026)
- [x] Personnalisation application (icône, titre, assets)
- [x] Améliorations anniversaires (backgrounds adaptatifs thème, texte centré)
- [x] Système détection événements génériques
- [x] Corrections météo (températures colorées, UV amélioré)
- [x] Annual Recap complet avec toutes les slides
- [x] Système Fêtes Religieuses & Jours Fériés (Pâques, Ramadan, Carême, jours fériés français)
- [x] Masquage curseur pour écrans d'affichage
- [x] Nettoyage effets anniversaires individuels (garder seulement overlay global)

### 🔄 EN COURS - URGENT (Recap Annuel)

#### 📊 **SYSTÈME RECAP ANNUEL COMPLET**
- [ ] **Collecte données annuelle** : Système de sauvegarde automatique des données toute l'année
  - [ ] Sauvegarder les tâches terminées (par personne, total)
  - [ ] Archiver les prévisions météo (températures, conditions)
  - [ ] Compter les événements calendrier par mois
  - [ ] Stocker les statistiques météo quotidiennes

- [ ] **Slide Tâches & Réussite**
  - [ ] Compter tâches faites au total et par personne
  - [ ] Calculer taux de réussite des tâches
  - [ ] Graphiques de progression mensuelle
  - [ ] Comparaisons année N vs N-1

- [ ] **Slide Météo Annuelle**
  - [ ] Jour le plus chaud et le plus froid de l'année
  - [ ] Moyennes annuelles (température, précipitations, vent)
  - [ ] Graphiques température par mois
  - [ ] Statistiques UV et conditions météo

- [ ] **Slide Événements Calendrier**
  - [ ] Nombre total d'événements par mois
  - [ ] Navigation mois par mois avec détails
  - [ ] Catégories d'événements (anniversaires, travail, sport, etc.)
  - [ ] Statistiques par type d'événement

- [ ] **Système Audit Données**
  - [ ] Vérification données manquantes avant génération recap
  - [ ] Alertes pour données incomplètes
  - [ ] Possibilité ajout données manuellement si nécessaire

### 🎨 **SYSTÈME BACKGROUNDS SAISONNIERS**
- [ ] **Fond d'écran dynamique** selon les saisons
  - [ ] Printemps (mars-mai) : thèmes floraux, couleurs pastel
  - [ ] Été (juin-août) : thèmes estivaux, plage, soleil
  - [ ] Automne (septembre-novembre) : feuilles, couleurs chaudes
  - [ ] Hiver (décembre-février) : neige, thèmes hivernaux
- [ ] **Transition fluide** entre les saisons
- [ ] **Adaptation thème** (light/dark) pour chaque saison

### 🚀 **DÉPLOIEMENT AUTOMATIQUE**
- [ ] **GitHub Actions Runner** pour déploiement automatique
  - [ ] Trigger sur push vers main
  - [ ] Git pull automatique en production
  - [ ] Build et redémarrage des services
  - [ ] Notifications de déploiement réussi/échoué

## 🎄 Système Fêtes Implémenté
- [x] **Calcul automatique Pâques** : Algorithme de Gauss précis
- [x] **Ramadan** : Approximation basée sur cycles lunaires
- [x] **Carême** : 40 jours avant Pâques
- [x] **Jours fériés français** : Tous les jours fériés officiels
- [x] **Intégration calendrier** : Événements spéciaux ajoutés automatiquement
- [x] **Backgrounds par catégorie** : christmas/, easter/, ramadan/, lent/, national/
- [ ] **Images de fond** : Créer les images pour chaque catégorie de fête

## 🎨 Backgrounds Événements Réguliers (Priorité Moyenne)
- [ ] **Vacances/Congés** : Backgrounds estivaux pour "vacances", "congés"
- [ ] **Fêtes Religieuses** : Noël, Pâques, Ramadan avec thèmes appropriés
- [ ] **Événements Culturels** : Concerts, théâtre, cinéma
- [ ] **Événements Éducatifs** : Formations, cours, conférences
- [ ] **Bien-être/Santé** : Yoga, méditation, spa
- [ ] **Administratif** : Banque, poste, mairie
- [ ] **Shopping** : Magasins, centres commerciaux
- [ ] **Transports** : Trains, avions, gares
- [ ] **Loisirs** : Jeux, hobbies, clubs
- [ ] **Repas** : Restaurants, bars, soirées

## ⚡ Optimisations Performance (Priorité Moyenne)
- [ ] **Lazy loading** des composants
- [ ] **Virtual scrolling** pour longues listes
- [ ] **Bundle splitting** pour optimiser le chargement
- [ ] **Cache intelligent** des données météo/calendrier

## 🎭 Animations & UX (Priorité Basse)
- [ ] Animations sur les tâches : scale sur checkbox, fade-in pour nouvelles tâches
- [ ] Notifications modales : slide-in depuis le haut, fade-out, pulse subtil
- [ ] Sons pour rappels d'événements (optionnel/désactivable)

## 🔮 Fonctionnalités Futures (Idées)
- [ ] **Effets anniversaires avancés** (ballons/confettis personnalisables)
- [ ] **Mode économie d'énergie** pour écrans 24/7
- [ ] **Synchronisation multi-écrans** pour installations
- [ ] **API REST** pour intégrations tierces
- [ ] **Mode hors-ligne** avec cache local