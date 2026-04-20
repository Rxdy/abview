# PENDING WORK — AbView

Ce fichier liste clairement ce qui reste à faire pour finaliser les versions 2.4 et 2.5, ainsi que le statut global des fonctionnalités en attente.

## Contexte
- Projet : AbView
- Date : 20 avril 2026
- Objectif : documenter les points de blocage pour pouvoir y revenir plus tard

## État des versions

### Version 2.4 — Annual Recap
**Statut : partiellement implémenté**

**Ce qui fonctionne**
- Composants UI présents pour 5 slides : Celebration, Events, Tasks, Weather, UserStats
- Navigation slide et timer en place
- Loading + écran d'erreur gérés côté frontend
- Endpoint `/recap` déclaré dans le backend

**Ce qui manque / est cassé**
- `GoogleDataController.getRecapData()` appelle `listPastYearEvents()` qui n'existe pas dans `GoogleCalendarService`
- Données annuelles ne sont pas archivées automatiquement
- Pas de sauvegarde fiable des tâches / météo / événements de l'année
- Pas de fallback robuste si l'une des sources de données est vide
- Pas de validation en conditions réelles du 1er janvier

**Actions à faire**
1. Implémenter `listPastYearEvents()` dans `server/app/services/calendar.ts`
2. Ajouter archivage des tâches annuelles
3. Ajouter archivage des statistiques météo annuelles
4. Ajouter archivage des événements annuels
5. Ajouter fallback affichage si données manquantes
6. Tester l'endpoint `/recap` et les slides du recap

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
1. Fix critique backend `/recap` — c'est le blocage principal de la version 2.4
2. Générer les images manquantes pour les fêtes — c'est le blocage principal de la version 2.5
3. Tester l'affichage du recap dans des conditions réelles
4. Ajouter le fallback en cas de données manquantes

## Estimation rapide de temps
- Fix backend /recap : ~2-3 heures
- Génération des images fêtes : ~2-12 heures (selon méthode)
- Archivage données annuelles : ~6-8 heures
- Tests réels Annual Recap : ~2-3 heures

## Notes complémentaires
- Le fichier `CHANGELOG.md` a déjà été créé
- Le fichier `ROADMAP_V27.md` a déjà été créé
- Ce fichier se concentre uniquement sur les actions à reprendre plus tard

---

*Fichier généré automatiquement pour garder la trace des travaux en attente.*
