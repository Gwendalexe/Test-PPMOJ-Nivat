# Frontend

## Leaderboard

### 1. Why?

Since Mojette is a game that relies heavily on time and score, it was essential to integrate a leaderboard system so that users could see how they rank against others. The goal was to strengthen the competitive aspect and motivate players to improve.

### 2. How?

We began by developing a reusable leaderboard component, allowing us to easily include it in different parts of the application. Then, we created a dedicated leaderboard page that includes a leaderboard table. On the Mojette grid page, once a grid is completed, it remains visible, and the leaderboard component appears on the right. Additionally, on the grid selection interface, if a user clicks on a grid they have already completed, they are redirected to the corresponding leaderboard page.

### 3. What?

We implement a leaderboard which users can see both after finishing a grid and choosing the finished grid . The table displays players' performance on completed grids.

## Daily grid

### 1. Why?

We want to add a daily grid feature to provide a new challenge every day and encourage regular engagement. It also creates a shared game dynamic for all players.

### 2. How?

We modified the page so that clicking the "Jeu Mojette" button leads directly to the daily grid. The grid is selected from the database based on the current date. Users can choose to play the “Grille du jour” or view the leaderboards from previous days of the current month. To ensure fairness, we disabled the hint button for the daily grid. After finishing the grid, users are automatically shown the corresponding leaderboard.

### 3. What?

We created a daily challenge system without hints and with a dedicated leaderboard, allowing users to compare their performance on a daily basis.

# Backend

## Vadrouille en France : Normandie

### 1. Pourquoi?

- Nouveau territoire : enrichir le jeu avec la 3ᵉ région, la Normandie, pour diversifier les parcours des joueurs.

- Nouvelles énigmes : proposer 2 énigmes par département (3 pour le département-capitale) mêlant mathématiques et informatique, pour renouveler le challenge.

- Uniformité de l'expérience : s'intégrer au mécanisme existant de zoom sur une région, puis sur ses départements, comme pour les Pays de la Loire et la Bretagne.

### 2. Fichiers et conventions de nommage

- **`_departments.json`**
  Liste des départements de chaque région avec :

  - `id` : numéro du département
  - `name` : nom du département
  - `region` : code de la région associée
  - `coordinates` : chemin SVG relatif pour tracer le département
  - `zones` : définition des zones interactives (boutons d'énigmes)

- **`_enigmes.json`**
  Contient toutes les énigmes disponibles, structuré par :

  - `id` : identifiant unique (dép * 10 + type)
  - `region` : code de la région (ex. `NORM`)
  - `figure` : nom de l'image SVG associée (`mXX.svg`, `iXX.svg`, `rXX.svg`)
  - autres champs : énoncé, variables, solutions…

- **`_regions.json`**
  Définition des régions avec :

  - `id` : code (`BRE`, `PDL`, `NORM`, etc.)
  - `name` : nom affiché
  - `viewBox` : boîte de vue SVG (pour `<svg>`)
  - `coordinates` : chemin SVG relatif de la région

- **`_problem_type.json`**
  Énumère les types d'énigmes :

  - `id` 0 = Mathématique
  - `id` 1 = Informatique
  - `id` 2 = Région

### 3. Comment ?

- Changement des images: ajout des images pour la Normandie.
- Mise à jour de `enigmes.json`: insertion des nouvelles énigmes pour chaque département de Normandie (2 par dpt + 1 type Région pour Calvados).
- Ajout dans `departments.json`: création des entrées Normandie avec `id`, `name`, `region`, `coordinates` (SVG relatif) et `zones` (boutons d'énigmes).
- Mise à jour de `regions.json`: ajout de la Normandie avec son `viewBox` pour permettre l'affichage de la nouvelle région.

### 4. Problème des coordonnées des départements

- Les coordonnées utilisées pour les régions viennent de ce site ([https://www.data.gouv.fr/fr/datasets/cartes-des-regions-et-departements-issus-d-openstreetmap/](https://www.data.gouv.fr/fr/datasets/cartes-des-regions-et-departements-issus-d-openstreetmap/)) et sont fournis en coordonnées absolues.
- Le front-end nécessite des chemins SVG relatifs (`m`,`l`,`z`) dans `departments.json` pour tracer correctement chaque `<path>`.
- Pour les régions existantes (Pays de la Loire, Bretagne), les coordonnées relatives étaient déjà disponibles.
- Pour la Normandie, il n'y avait pas de données relatives pour les départements et on ne sait pas comment les avoir puisse celles sur le site vu juste au dessus sont en absolues et non en relatives.

### 5. Solution temporaire

- Hack visuel: on a repris le `viewBox` d'une autre région et les coordonnées relatives des départements d'une région existante.
- Ainsi, cliquer sur la Normandie affiche les contours relatifs d'une autre région, mais associés aux bons départements normands.
- Il reste à générer les véritables coordonnées SVG relatives pour chaque département de Normandie afin de corriger l'affichage.

## Leaderboard

### 1. Pourquoi?

- Fournir un classement en temps réel des joueurs pour chaque grille Mojette.

- Valoriser la performance des utilisateurs (temps de résolution et aides utilisées).

- Permettre à chaque joueur de se situer par rapport aux autres (top N, contexte autour de sa position).

- Offrir une expérience interactive : dès qu'un utilisateur termine une grille, son rang et celui des autres sont mis à jour.

### 2. Comment ?

#### 2.1. Route API

``GET /mojettes/<id>/leaderboard``

Paramètres de requête :

- size (int, défaut 10) : nombre de meilleurs joueurs à renvoyer.

- range (int, défaut 2) : nombre de joueurs à afficher autour de l'utilisateur.

#### 2.2. Calcul à la volée

La méthode ReadRankedLeaderboard construit une sous-requête qui :

- Joint mojette_completed et user.

- Calcule le score de chaque joueur.

- Numérote les lignes avec ROW_NUMBER() OVER (ORDER BY score DESC) pour garantir une position unique même en cas d'égalité de score.

On récupère ensuite :

- ``top N`` joueurs ``(position <= size)``

- Position de l'utilisateur courant (s'il a un score).

- Joueurs juste au-dessus et juste en-dessous de lui, en prenant les positions dans l'intervalle ``[user_position - range, user_position + range]``.

> En cas d'égalité, le tie-break se fait implicitement par l'ordre défini dans la sous-requête (ex. date de complétion, ID…), ce qui est acceptable pour éviter la complexité supplémentaire.

Retour de l'API :

```json
{
  "top": […],           // liste des meilleurs joueurs
  "user": {…} | null,   // l'entrée de l'utilisateur (ou null)
  "above_user": […],    // joueurs juste au-dessus (hors top si besoin)
  "below_user": […]     // joueurs juste en-dessous
}
```

Si aucun score n'existe pour la grille, toutes les listes sont vides et user vaut null.

### 3. Complexité et axes d'améliorations

#### 3.1. Complexité globale

Temps : O(n·log n)

- Le tri SQL via ROW_NUMBER() OVER (…) sur n complétions coûte environ O(n·log n).

- Le filtrage Python (recherche de l'utilisateur, découpage top/above/below) est O(n) + O(n), ce qui reste dominé par le tri.

Mémoire : O(n)

- L'intégralité des lignes du classement est récupérée en mémoire par l'API avant d'être limitée.

#### 3.2. Axes d'améliorations potentiels

Index SQL :

- Ajouter un index sur (grid_id, completion_time, helps_used) (ou, au minimum, sur grid_id) pour que le tri et le filtre WHERE grid_id = … dans la sous-requête soient beaucoup plus rapides.

Cache courte durée :

- Mettre en cache les résultats du top N et de la section utilisateur pendant 30 secondes.

- Invalider la clé cache dès qu'une nouvelle complétion est insérée, afin de ne pas servir de données obsolètes.

Chargement progressif côté front :

- Renvoyer d'abord le top N (rendu instantané), puis, en tâche de fond, charger la partie above/below pour une interface plus réactive et dégradée en cas de latence.

## Grille du jour

### 1. Pourquoi?

- Proposer une grille différente chaque jour.

- Favoriser la rétention des utilisateurs via un contenu quotidien renouvelé.

- Permettre aux joueurs de se comparer avec les autres via un classement journalier.

- Offrir un nouveau prétexte de communication régulière pour le site.

Pour cela, il a été décidé de réutiliser le système existant de gestion des grilles mojette, sans modification de la base de données. Les identifiants des grilles du jour sont stockés dans un fichier JSON qui est réinitialisé chaque mois.
L'utilisation d'une table en base aurait été possible, mais jugée superflue pour ce besoin léger et temporaire (les ID sont réinitialisés chaque mois et ne concernent qu'un nombre fixe de grilles).

### 2. Comment?

#### 2.1. Stockage et sélection des grilles

Lors du premier appel du mois à la route /mojettes/daily, le système :

- Détermine le nombre de jours du mois en cours.

- Sélectionne aléatoirement autant de grilles depuis la base de données **qui n'ont jamais été complétées**.

- Stocke ces identifiants dans un fichier `daily_grid.json`, accompagné du mois courant.

Exemple de structure JSON :

```json
{
  "month": "2025-05",
  "grids": {
    "1": 2312,
    "2": 4499,
    "3": 8821,
    ...
  }
}
```

#### 2.2. Récupération de la grille du jour

Quand un utilisateur demande la grille du jour via /mojettes/daily :

- Si un paramètre day est précisé, il est vérifié pour s'assurer qu'il ne dépasse pas la date actuelle.

- Sinon, le jour en cours est utilisé.

- L'ID correspondant à ce jour est récupéré dans le fichier JSON.

- La grille est ensuite chargée via le système existant de récupération des grilles.

#### 2.3. Réutilisation des routes et fonctionnalités existantes

- Vérification de complétion :

    La route ``/mojettes/<id>/completed`` permet de vérifier si l'utilisateur a terminé la grille du jour.

- Leaderboard journalier :
    Le classement est généré via la route `/mojettes/<id>/leaderboard`, comme pour les autres grilles.

- Récupération des données de la grille :
    Les données (structure, indices, valeurs) sont obtenues via les méthodes actuelles, évitant des développements supplémentaires côté front et back.

#### 2.4. Route pour connaitre les grilles du jour complétées

Permet l'affichage de l'information de la complétion (petite coches vertes)dans la table de sélection des grilles du jour.

Nouvelle route route : `/mojettes/daily/completed`

- Méthode : GET

- Authentification : Requiert un token utilisateur

- Retourne : Un dictionnaire dont les clés sont les jours du mois (sous forme de string) et les valeurs des booléens indiquant la complétion.

Exemple de réponse :

```json
{
  "1": true,
  "2": false,
  "3": true
}
```

Fonctionnement :

- Récupère le mois courant et les IDs des grilles quotidiennes.

- Parcourt chaque jour du mois jusqu'à aujourd'hui.

- Vérifie pour chaque grille si l'utilisateur l'a complétée via la table des scores.

- Retourne un dictionnaire récapitulatif.

### 3. Quoi?

Résumé de l'architecture et de la logique :

- Fichier JSON unique par mois contenant les IDs des grilles à jouer.

- Pas de table en base spécifique pour les grilles du jour.

- Sélection et attribution aléatoire des grilles (non complétées) chaque début de mois.

- Réutilisation totale des routes existantes pour :

  - Charger les grilles.

  - Vérifier la complétion.

  - Générer le leaderboard.

- Ajout d'une nouvelle route pour permettre au front de visualiser la complétion des grilles quotidiennes.

### 4. Axes d'améliorations

Un problème identifié dans le système initial concernait le cas où une grille du jour pouvait être sélectionnée alors qu'elle avait déjà été complétée par certains utilisateurs. Dans ce cas, ces utilisateurs se retrouvaient automatiquement avec leur score antérieur dans le classement du jour, sans possibilité de rejouer la grille, ce qui faussait l'expérience.

#### 4.1. Solution adoptée

Pour résoudre ce problème, il a été décidé de filtrer les grilles lors du tirage mensuel, en sélectionnant uniquement des grilles qui n'ont encore été complétées par aucun utilisateur.

Avec plus de 16 000 grilles disponibles et seulement une centaine jouées par les utilisateurs (hors grille du jour), cette solution garantit une rotation saine et durable des grilles du jour pendant plusieurs décennies (estimée à plus de 45 ans avant épuisement potentiel du stock de grilles vierges).

#### 4.2. Amélioration future envisageable

Une solution plus flexible et pérenne pourrait consister à autoriser plusieurs complétions d'une même grille par un même utilisateur en base de données.

Dans ce cas :

- La grille du jour pourrait être choisie librement, même si elle a déjà été jouée.

- Le système distinguerait les complétions effectuées le jour même de celles des jours précédents.

- Le classement journalier n'afficherait que les scores réalisés le jour de publication de la grille, assurant ainsi une égalité des chances et une expérience cohérente.

Cette solution offrirait plus de souplesse et supprimerait définitivement la contrainte sur la sélection des grilles.
