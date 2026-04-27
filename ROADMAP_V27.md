# Roadmap v2.7+ — Finalisation des Fonctionnalités en Attente

## 📊 Diagnostic d'État Actuel

### Version 2.4 (Annual Recap) — **95% IMPLÉMENTÉE**
**État** : Fonctionnelle et production-ready

**Implémenté ✅** :
- Composants d'affichage pour 5 slides (Celebration, Events, Tasks, Weather, UserStats)
- Navigation automatique entre les slides
- Gestion du loading/erreurs UI
- Store Pinia pour gestion d'état
- Endpoint API `/recap` opérationnel avec `listPastYearEvents()`
- Archivage automatique au changement d'année (tâches + météo)
- AnnualRecapWrapper utilisant annualRecapStore correctement
- EventsSlide avec navigation mensuelle 15s
- WeatherSlide utilisant tempMax pour calculs météo

**Manquant ❌** :
1. **Fallback données manquantes** : Pas de gestion si données manquent pour certains modules
2. **Tests conditions réelles** : Affichage 1er janvier non testé en production

---

### Version 2.5 (Holiday Card Images) — **40% IMPLÉMENTÉE**
**État** : Calcul automatique fêtes OK, Images manquantes

**Implémenté ✅** :
- Algorithme de calcul Pâques (Gauss) précis
- Calcul dates Ramadan (approximation cycles lunaires)
- Calcul Carême (40 jours avant Pâques)
- Jours fériés français complets
- Intégration automatique dans calendrier
- Structure CSS pour afficher backgrounds thématisés (dark/light)

**Manquant ❌** :
1. **Images de cartes** : 9 fichiers PNG manquants (2 thèmes × 9 catégories - 6 images existantes)
   - ❌ `card/dark/labor.png` (Fête du Travail)
   - ❌ `card/dark/victory.png` (Victoire 1945)
   - ❌ `card/dark/bastille.png` (Fête Nationale)
   - ❌ `card/dark/armistice.png` (Armistice 1918)
   - ❌ `card/dark/catholic.png` (Assomption, Toussaint)
   - ❌ `card/dark/christmas.png` (Noël)
   - ❌ `card/dark/ramadan.png` (Ramadan)
   - ❌ `card/dark/caresme.png` (Carême/Lent)
   - ❌ `card/dark/national.png` (Générique national)
   - Et 9 autres en thème light identiques

**Images existantes ✅** :
- `card/dark/anniversaire.png`
- `card/dark/newyear.png`
- `card/dark/paques.png`
- `card/light/anniversaire.png`
- `card/light/newyear.png`
- `card/light/paques.png`

---

### Annual Recap Wrapper — **JAMAIS TESTÉ EN PRODUCTION**
**Problèmes** :
- [ ] Jamais affiché le 1er janvier 2026 pour validation réelle (date fête forcée si testable)
- [ ] Pas de logs de debug pour diagnostiquer données manquantes
- [ ] Aucune validation que l'API retourne les bonnes données
- [ ] Comportement indéfini si une des slides n'a pas de données

---

## ⏱️ Estimation Temps de Finalisation

### **URGENT — Bugs Critiques**

#### 1️⃣ Fix Backend `/recap` — **2-3 heures**
**Problème** : `listPastYearEvents()` n'existe pas, l'API crash
**À faire** :
- [ ] Implémenter `listPastYearEvents()` dans `GoogleCalendarService` (15 min)
  - Lire les événements de l'année N-1 (timeMin/timeMax ajustés)
  - Retourner array d'events avec même interface que `listEvents()`
- [ ] Tester l'endpoint `/recap` end-to-end (30 min)
- [ ] Ajouter logs de debug si `recapData` est vide/invalide (15 min)
- [ ] Écrire fallback pour chaque slide si données manquent (45 min)
  - "Pas de données disponibles"
  - Message d'erreur clair au lieu de composant blanc
- [ ] Tests unitaires pour `listPastYearEvents()` (30 min)

**Impact** : Sans cela, Annual Recap est 100% non-fonctionnel à la lancer

---

#### 2️⃣ Créer Images Cartes Fêtes — **8-12 heures** (selon qualité/outils)
**Besoin** : 18 images PNG (9 catégories × 2 thèmes)
- **Catégories** : labor, victory, bastille, armistice, catholic, christmas, ramadan, caresme, national
- **Dimensions** : Même que existantes (~400-500px, optimisées pour web)
- **Style** : Cohérent avec images existantes (ilustration colorée, thème clair/sombre)

**Options** :
- **AI Tool (Midjourney/DALL-E)** — ~2h (prompt + génération + ajustements)
- **Design manuel (Figma/Illustrator)** — ~8-12h (plus contrôle créatif)
- **Icônes + Assets existants** — ~4-6h (assemblage rapide)

**Tâches** :
- [ ] Choisir style/outil (30 min)
- [ ] Générer/créer 9 images catégorie (1-2h par outil)
- [ ] Créer versions dark (ex: invert couleurs) si nécessaire (30 min par catégorie + batch processing)
- [ ] Optimiser PNG (compression) (15 min)
- [ ] Placer dans `assets/card/{dark,light}/` (10 min)
- [ ] Tester affichage dans UI (20 min)

**Impact** : Sans images, les jours fériés sont invisibles (pas de background)

---

### **IMPORTANT — Données Annuelles**

#### 3️⃣ Système Collection Données Annuelles — **6-8 heures**
**Problème** : Pas de sauvegarde automatique des données pour annual recap
**À faire** :
- [ ] Créer système archivage des tâches (2h)
  - Snapshot JSON quotidien ou hebdomadaire des tâches complétées
  - Stocker dans `server/app/database/recap/yearly-stats.json`
  - Déclencher après chaque sync tâches
- [ ] Créer système archivage météo (1h 30)
  - Stocker température/condition dailienne
  - Calculer moyennes, extrema
  - Format : `weather-yearly-stats.json`
- [ ] Créer système archivage événements calendrier (1h 30)
  - Snapshot des événements du mois
  - Export format utilisable par Annual Recap
- [ ] Déclencher archivage automatique 31 décembre minuit (30 min)
  - Script cron ou endpoint manual
  - Finaliser données pour l'année
- [ ] Tests : vérifier fichiers créés, données correctes (1h)

**Impact** : Annual Recap aura des données réelles au lieu de vides

---

#### 4️⃣ Tests Réels Annual Recap — **2-3 heures**
**À faire** :
- [ ] ForcerDate 1er janvier dans param query pour tester `/recap` (20 min)
- [ ] Lancer app, vérifier chaque slide affiche les bonnes données (30 min)
- [ ] Vérifier transitions auto entre slides OK (15 min)
- [ ] Vérifier navigation manuelle (indicateurs) OK (15 min)
- [ ] Tester states (loading, error, no data, partial data) (30 min)
- [ ] Tester performances (pas de lag pendant animations) (20 min)
- [ ] Test données réelles si possibles (rétrospective 2024 avec données mock) (30 min)

---

## 📅 Plan de Déploiement v2.7

### **Phase 1 — Hotfix Critique (v2.7.0)** — 1 semaine
```
✅ Jeudi : Fix backend /recap + tests
✅ Vendredi : Merge et release v2.7.0-beta
```

**Impact** : Annual Recap fonctionnel (mais sans belle interface images)

### **Phase 2 — Images Fêtes (v2.7.1)** — 1-2 semaines
```
✅ Créer/générer images
✅ Tests visuels
✅ Release v2.7.1
```

**Impact** : Calendrier fêtes visuellement riche

### **Phase 3 — Données Réelles (v2.8.0)** — 2-3 semaines
```
✅ Archivage données
✅ Tests
✅ Release v2.8.0
```

**Impact** : Annual Recap avec statistiques réelles

---

## 🎯 Recommandations de Priorisation

### **Immédiat (cette semaine)** 🔴
1. **Fix `listPastYearEvents()`** — Sinon Annual Recap 100% cassé
2. **CréerImages Fêtes** — Vi si utilisation AI rapide (Midjourney ~2h)

### **À court terme (2 semaines)** 🟠
3. **Tests réels Annual Recap** — Valider ce qui fonctionne
4. **Archivage données** — Commencer à collecter données année prochaine

### **À moyen terme (1 mois)** 🟡
5. **Optimisations perf** — Si needed après tests

---

## 💾 État des Fichiers TODO

- **Client TODO** : 130 lignes de TODOs pour Annual Recap
- **Server TODO** : Images manquantes listées
- **Annual Recap Component TODO** : UX improvements (pause, sons, raccourcis clavier)

Tous les TODOs liés aux versions 2.4-2.5 sont documentés dans le repo.

---

*Estimation totale pour finaliser (tout) : **18-25 heures***
*Estimation pour hotfix seul : **2-3 heures***
*Dernière mise à jour : 20 avril 2026*
