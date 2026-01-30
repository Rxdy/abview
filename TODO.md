# TODO.md - Gestion des Tâches

Ce fichier sert à suivre les tâches en cours, les améliorations à apporter, et les éléments à prioriser pour le développement du projet AbView.

## ✅ Tâches Terminées

### Récemment Implémentées
- [x] Masquer les outils de développement en production (raccourcis clavier et variables globales)
- [x] Corriger l'affichage des dates pour les événements all-day (pas de plage de dates)
- [x] Afficher les lieux uniquement pour les événements timed avec lieu
- [x] Ajuster le scroll horizontal des tâches lors des changements de nombre de listes
- [x] Créer et appliquer les DEV_GUIDELINES
- [x] Supprimer les références au starter v2 des guidelines
- [x] Corriger le background de la météo actuelle en mode clair
- [x] Réduire la durée des timers verticaux à 10 secondes et améliorer la fluidité

## 🔄 Tâches en Cours

### Améliorations Fonctionnelles
- [ ] Optimiser les performances de rendu des événements
- [ ] Améliorer la gestion des erreurs réseau
- [ ] Ajouter des tests unitaires pour les composants critiques

### Maintenance
- [ ] Nettoyer les logs temporaires et variables de debug
- [ ] Mettre à jour les dépendances
- [ ] Vérifier la compatibilité navigateurs

## 📋 Tâches à Prioriser

### Technique
- [ ] Implémenter un système de cache pour les données météo
- [ ] Configurer les notifications push (si applicable)

## � Audits - TODOs Prioritaires

### Événements Spéciaux (Jours Fériés & Fêtes)
- [ ] Créer image pour "labor" (Fête du Travail)
- [ ] Créer image pour "victory" (Victoire 1945)
- [ ] Créer image pour "bastille" (Fête Nationale)
- [ ] Créer image pour "armistice" (Armistice 1918)
- [ ] Créer image générique pour "catholic" (fêtes religieuses chrétiennes)
- [ ] Créer image pour "caresme" (lent)
- [ ] Créer image pour "national" (générique national)
- [ ] Créer image pour "noel" (christmas)
- [ ] Créer image pour "ramadan"
- [ ] Ajouter des tests unitaires pour les fonctions de calcul de dates (holidays.ts)

### Wrap de Fin d'Année
- [ ] Vérifier que l'API /recap retourne bien toutes les données requises (events, tasks, weather)
- [ ] Ajouter fallback si données manquantes pour certains modules
- [ ] Tester l'affichage en conditions réelles le 1er janvier 2026
- [ ] Ajouter logs de debug pour diagnostiquer les données manquantes
- [ ] Implémenter système de sauvegarde automatique des données toute l'année
- [ ] Ajouter vérification d'intégrité des données avant affichage

## �🐛 Bugs à Corriger

- [ ] Vérifier l'affichage des événements multi-jours
- [ ] Tester la synchronisation horaire en conditions réelles

## 📝 Notes et Idées

- Consulter régulièrement ce fichier pour prioriser les tâches
- Créer des specs pour les nouvelles fonctionnalités substantielles
- Respecter les DEV_GUIDELINES pour chaque développement

## 🔄 Revue Régulière

- [ ] Revue hebdomadaire des tâches (chaque lundi)
- [ ] Nettoyage des tâches terminées (mensuel)

---

*Dernière mise à jour: 30 janvier 2026*