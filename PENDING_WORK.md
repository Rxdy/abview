# PENDING WORK — AbView

Ce fichier liste clairement ce qui reste à faire pour finaliser les versions 2.4 et 2.5, ainsi que le statut global des fonctionnalités en attente.

## Contexte
- Projet : AbView
- Date : 27 avril 2026
- Objectif : documenter les points de blocage pour pouvoir y revenir plus tard
- Dernière mise à jour : Corrections Annual Recap + archivage automatique

## État des versions

### Version 2.4 — Annual Recap
**Statut : ✅ implémenté et fonctionnel**

**Ce qui fonctionne**
- Composants UI présents pour 5 slides : Celebration, Events, Tasks, Weather, UserStats
- Navigation slide et timer en place
- Loading + écran d'erreur gérés côté frontend
- Endpoint `/recap` opérationnel avec `listPastYearEvents()`
- Archivage automatique des données au changement d'année
- Données annuelles sauvegardées (tâches, météo, événements)
- AnnualRecapWrapper utilise annualRecapStore correctement
- EventsSlide : navigation mensuelle 15s par mois
- WeatherSlide : jour le plus froid/chaleureux basé sur tempMax journalière

**Ce qui manque / est cassé**
- Pas de fallback robuste si l'une des sources de données est vide
- Pas de validation en conditions réelles du 1er janvier

**Actions à faire**
1. ✅ Implémenter `listPastYearEvents()` dans `server/app/services/calendar.ts`
2. ✅ Ajouter archivage automatique des tâches annuelles
3. ✅ Ajouter archivage automatique des statistiques météo annuelles
4. ✅ Corriger AnnualRecapWrapper pour utiliser annualRecapStore
5. ✅ Corriger EventsSlide (champs événements + intervalle 15s)
6. ✅ Corriger WeatherSlide (calcul jour le plus froid)
7. Ajouter fallback affichage si données manquantes
8. Tester l'endpoint `/recap` et les slides du recap en conditions réelles

---

### Version 2.5 — Holiday Card Images
**Statut : partiellement implémenté**

**Ce qui fonctionne**
- Calcul des dates des fêtes et des jours fériés
- Intégration des catégories dans le calendrier
- Support dark/light prévu dans le code

**Ce qui manque**
- Images de fond pour la majorité des fêtes
- Fichiers requis :
  - `labor` (Fête du Travail)
  - `victory` (Victoire 1945)
  - `bastille` (Fête Nationale)
  - `armistice` (Armistice 1918)
  - `christmas` (Noël)
  - `ramadan`
  - `caresme` (Carême)
  - `catholic` (religieux générique)
  - `national` (catégorie générique nationale)
- Ces images doivent exister en version `dark` et `light`

**Actions à faire**
1. Créer/générer les images manquantes
2. Placer les fichiers dans `client/src/assets/card/dark/` et `client/src/assets/card/light/`
3. Vérifier l’affichage des backgrounds dans `CalendarModule.vue`
4. Tester avec les différents thèmes et fêtes

---

## Priorité immédiate
1. ✅ Fix critique backend `/recap` — résolu
2. Générer les images manquantes pour les fêtes — c'est le blocage principal restant de la version 2.5
3. Ajouter fallback affichage si données manquantes (v2.4)
4. Tester l'affichage du recap dans des conditions réelles (v2.4)

## Estimation rapide de temps
- ✅ Fix backend /recap : ~2-3 heures (fait)
- Génération des images fêtes : ~2-12 heures (selon méthode)
- ✅ Archivage données annuelles : ~6-8 heures (fait)
- Tests réels Annual Recap : ~2-3 heures
- Fallback données manquantes : ~1-2 heures

## Notes complémentaires
- Le fichier `CHANGELOG.md` a déjà été créé
- Le fichier `ROADMAP_V27.md` a déjà été créé
- Ce fichier se concentre uniquement sur les actions à reprendre plus tard

---

*Fichier généré automatiquement pour garder la trace des travaux en attente.*
