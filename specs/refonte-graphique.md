# Refonte graphique — modèle « D · Mélange » (jour + nuit)

Maquette validée : https://claude.ai/artifact/K8FFVZBee23iVnHBFedhwA (artboards « D · Mélange »
et « D · Mélange (nuit) » ; l'artboard « Actuel » montre l'écran d'avant).

## Branches

```
dev
 └─ feature/refonte-graphique          ← branche de la refonte, mergée dans dev une fois validée
     ├─ feature/refonte-fondations     ← une branche par zone, partie de feature/refonte-graphique
     ├─ feature/refonte-entete            et mergée dedans quand la zone est finie
     ├─ feature/refonte-agenda
     ├─ feature/refonte-meteo
     ├─ feature/refonte-taches
     └─ feature/refonte-pied
```

- Chaque zone part de `feature/refonte-graphique` **à jour** (les fondations d'abord : toutes
  les autres en dépendent).
- Une zone finie et verte en CI est mergée dans `feature/refonte-graphique` ; les branches de zone
  encore ouvertes se remettent à jour depuis elle.
- Quand tout est validé sur le kiosque : `feature/refonte-graphique` → `dev`, puis `dev` → `main`
  comme d'habitude.

## Ce qui ne change pas

- Les données et leurs sources (agenda, météo, tâches) : seule l'apparence change.
- Les icônes SVG météo de l'app.
- Les images de fond des cartes d'événement (anniversaires, fêtes…) : posées sur la carte
  pastel, avec un voile pour garder le texte lisible.
- La bascule jour/nuit automatique (`themeStore`).

## Zones, dans l'ordre

### 0. Fondations — `feature/refonte-fondations`
Fichiers : `assets/base.css`, `assets/main.css`, `stores/themeStore.ts`, `composables/useTheme.ts`.
- Jetons de couleur jour et nuit de la maquette (fond `#F3F2EF` / `#0F1115`, surfaces, texte,
  texte secondaire, filets, accent `#2C63D9` / `#7FA6FF`, fond « aujourd'hui »), à la place des
  variables du gabarit Vite (`--vt-c-*`).
- Police Nunito (servie en local, le kiosque ne doit pas dépendre de Google Fonts), chiffres
  tabulaires pour heures et températures.
- Rayons, ombres et espacements communs.
- Grille de la page : en-tête, agenda, bande météo + tâches, pied.

### 1. En-tête — `feature/refonte-entete`
Fichiers : `components/Header.vue`, `components/DateTimeModule.vue`.
- Logo Ab + « AbView » à gauche, pilule centrée date + heure, nom du foyer à droite.
- Nom du foyer lu depuis la config (vérifier d'où vient « Alves » aujourd'hui ; jamais codé en dur).

### 2. Agenda 8 jours — `feature/refonte-agenda` (la plus grosse zone)
Fichiers : `components/CalendarModule.vue` (763 lignes), `components/BirthdayEffect.vue`.
- Colonnes en cartes blanches ; aujourd'hui = fond bleu léger + pastille bleu plein.
- Événements en cartes pastel par catégorie, avec étiquette (Travail, Santé, Sport, Garde,
  Anniversaire, Repos) ; badges Jaune/Noire conservés.
- Images de fond des fêtes/anniversaires sur la carte pastel, avec voile.
- **À trancher avant de commencer :** l'app ne connaît pas ces catégories aujourd'hui (seulement
  les badges jaune/noire et les catégories de jours fériés). D'où viennent-elles : agenda
  d'origine, couleur Google, mots-clés dans le titre ?
- Si la branche devient trop grosse : la couper en `refonte-agenda-colonnes` puis
  `refonte-agenda-cartes`.

### 3. Météo — `feature/refonte-meteo`
Fichiers : `components/WeatherModule.vue` (676 lignes).
- Carte blanche : température et icône, détails en grille 2 colonnes (ressenti, humidité, vent,
  nuages, lever, coucher, UV).
- Prévisions sur 4 jours **en ligne** (aujourd'hui : 5 jours en liste verticale).

### 4. Tâches — `feature/refonte-taches`
Fichiers : `components/TasksModule.vue`, `components/TaskList.vue`, `components/TaskItem.vue`.
- Cartes à en-tête plein couleur, cases colorées, échéances en pastilles.
- **À trancher :** la maquette montre 3 listes, l'app en a 5 ou plus (Action, Courses, Luis,
  Rudy…), qui débordent à droite aujourd'hui. Défilement automatique, rotation par groupes de 3,
  ou cartes plus étroites ?

### 5. Pied — `feature/refonte-pied`
Fichiers : `components/Footer.vue`, `components/ProgressBar.vue`.
- Barre d'actualisation arrondie, texte « dernière mise à jour », version.

### Validation finale (sur `feature/refonte-graphique`)
- Passe jour **et** nuit sur le kiosque (1920×1080), lecture à distance.
- Récap annuel, notifications et écrans d'erreur relus avec les nouveaux jetons.
- Tests client verts.
