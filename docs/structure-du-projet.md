# 3. Structure du Projet

Ce document décrit la structure de dossiers et de fichiers du projet pour le Front-End et le Back-End.

## Arborescence des Fichiers

### Front-end

La structure du projet Angular se présente comme suit :

```tree
front
│
├── src/
│   ├── app/
│   │   ├── _helpers/                 # Dossier contenant les modalités d'accès aux pages
│   │   │   ├── auth.guard.spec.ts
│   │   │   ├── auth.guard.ts
│   │   │   ├── admin.guard.component.ts
│   │   │   ├── admin.guard.service.ts
│   │   │   └── admin.guard.spec
│   │   │
│   │   ├── _models/            # Dossier avec tous les modèles de variables utilisé dans le projet
│   │   │   ├── Department.ts
│   │   │   ├── Enigmes.ts
│   │   │   ├── Region.ts
│   │   │   ├── Pbcpts.ts
│   │   │   ├── Token.ts
│   │   │   ├── Tuile.ts
│   │   │   ├── User.ts
│   │   │   └── UserTDF.ts
│   │   │
│   │   ├── _services/            # Dossier contenant les services qui font appel au back (api)
│   │   │   ├── Admin.service.spec.ts
│   │   │   ├── Admin.service.ts
│   │   │   ├── auth.service.spec.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── CPT.service.spec.ts
│   │   │   ├── CPT.service.ts
│   │   │   ├── enigme.service.spec.ts
│   │   │   ├── enigme.service.ts
│   │   │   ├── internal.service.spec.ts
│   │   │   ├── internal.service.ts
│   │   │   ├── mojette.service.spec.ts
│   │   │   ├── mojette.service.ts
│   │   │   ├── problem.service.spec.ts
│   │   │   ├── problem.service.ts
│   │   │   ├── region.service.spec.ts
│   │   │   └── region.service.ts
│   │   │
│   │   ├── account/               # Dossier sur les pages lié à la gestion du compte utilisateur
│   │   │   ├── account.component.html      # Page de gestion utilisateur (*)
│   │   │   ├── account.component.scss
│   │   │   ├── account.component.spec.ts
│   │   │   ├── account.component.ts
│   │   │   └── confirmation-dialog.component.ts
│   │   │
│   │   ├── admin/               # Dossier sur les pages lié à l'admin et à l'ajout de donnée dans la DB
│   │   │   ├── Constante/       # Variables utilisé sur la page pour permettre un guidage d'utilisation
│   │   │   │   ├── DepartmentMapping.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── RegionMapping.ts
│   │   │   │   └── Type.ts
│   │   │   ├── create_problemes.component.html    # Page de création de problèmes ou de modification
│   │   │   ├── create_problemes.component.scss
│   │   │   ├── create_problemes.component.spec.ts
│   │   │   └── create_problemes.component.ts
│   │   │
│   │   ├── auth/               # Dossier lié à la page d'accueil et à la connexion/inscription de l'utilisateur
│   │   │   ├── ConfirmationPage/     # Page de confirmation d'email (disponible à l'utilisateur après avoir cliqué sur le lien d'un mail)
│   │   │   │   ├── confirmationAccount.component.html
│   │   │   │   ├── confirmationAccount.component.scss
│   │   │   │   ├── confirmationAccount.component.spec.ts
│   │   │   │   └── confirmationAccount.component.ts
│   │   │   ├── httpInterceptors/     # Utile à la sécurité des commandes du Back
│   │   │   │   └── auth-interceptor.ts
│   │   │   ├── LostPassword/             # Page de mot de passe oublié
│   │   │   │   ├── LostPW.component.html
│   │   │   │   ├── LostPW.component.scss
│   │   │   │   ├── LostPW.component.spec.ts
│   │   │   │   └── LostPW.component.ts
│   │   │   ├── register/             # Page d'accueil
│   │   │   │   ├── register.component.html
│   │   │   │   ├── register.component.scss
│   │   │   │   ├── register.component.spec.ts
│   │   │   │   └── register.component.ts
│   │   │   ├── auth-routing.module.ts      # Route de toute les pages avec leur restriction d'accès
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── carreparterre/            # Page du jeu Carré par terre (Côté au carré)
│   │   │   │   ├── carreparterre.component.html
│   │   │   │   ├── carreparterre.component.scss
│   │   │   │   ├── carreparterre.component.spec.ts
│   │   │   │   └── carreparterre.component.ts
│   │   │
│   │   ├── components/               # Dossier contentant des composants réutilisables
│   │   │   ├── navbar/            # Composant navbar
│   │   │   │   ├── modal.component.html
│   │   │   │   ├── modal.component.scss
│   │   │   │   ├── modal.component.spec.ts
│   │   │   │   └── modal.component.ts
│   │   │
│   │   ├── game/               # Dossier lié au jeu Vadrouille en France
│   │   │   ├── map/            # Affichage de la carte de france, région et département
│   │   │   │   ├── custom-types.ts
│   │   │   │   ├── map.component.html
│   │   │   │   ├── map.component.scss
│   │   │   │   ├── map.component.spec.ts
│   │   │   │   └── map.component.ts
│   │   │   ├── Problemes/      # Page des problèmes (/game/id)
│   │   │   │   ├── problemes.component.html
│   │   │   │   ├── problemes.component.scss
│   │   │   │   ├── problemes.component.spec.ts
│   │   │   │   └── problemes.component.ts
│   │   │   ├── game.component.html
│   │   │   ├── game.component.html
│   │   │   ├── game.component.scss
│   │   │   └── game.component.spec.ts
│   │   │
│   │   ├── mojette/            # Page du jeu mojette
│   │   │   ├── mojette.component.html
│   │   │   ├── mojette.component.html
│   │   │   ├── mojette.component.scss
│   │   │   └── mojette.component.spec.ts
│   │   │
│   │   ├── app-routing.module.ts    # Route de toutes les pages avec la déclaration de leur component
│   │   ├── app.component.html
│   │   ├── app.component.html
│   │   ├── app.component.scss
│   │   └── app.component.spec.ts
│   │
│   ├── assets/                  # Ressources statiques (images, fonts, fichiers de traduction)
│   │       ├── departments/      # Images pour les departements
│   │       ├── enigmes/          # Images pour les problèmes
│   │       ├── ProfMojetteIcon   # Favicon du site
│   │       └── ...
│   │
│   ├── environments/                   # Variable d'environnement utilisé dans la partie du front
│   │       ├── environment.dev.ts      # Variable d'environnement utilisé sur le serveur du site en dev
│   │       ├── environment.prod.ts     # Variable d'environnement utilisé sur le serveur du site
│   │       └── environment.ts          # Variable d'environnement utilisé sur le serveur local
│   │
│   ├── index.html                      # Affichage générale du site
│   ├── main.ts
│   └── styles.scss                     # style générale du site

│
├── angular.json                  # Configuration du projet Angular
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.app.json
├── tsconfig.json
└── tsconfig.spec.json
```

### Back-end

```tree
.
├── app.py              -- API Init file
├── client.py           -- Testing client
├── core
│   ├── models.py       -- API models
├── database
│   ├── models.py       -- Database models
│   ├── database.py     -- SQL Queries (Create, Read, Update, Delete)
│   ├── migrations/     -- Alambic folder to manage database migrations - do not mess with it unless you know what you're doing
├── Json/               -- JSON files to populate the database
├── requirements.txt
├── routers/            -- Routers namespaces
|   |──auth.py          -- Auth related routes
|   |──carres.py        -- Carre du Parterre related routes
|   |──mojettes.py      -- Jeu Mojette related  routes
|   |──problems.py      -- Vadrouille en France related routes
|   |──users.py         -- Users related routes
├── script_db.py        -- Script to populate and reset the database
├── templates/          -- HTML Templates for mailing
└── utils
    ├── common.py       -- Common functions
    ├── decorators.py   -- Custom decorators
    ├── mail.py         -- Mailing functions
    ├── token.py        -- Token handling function
    └── validation.py   -- Validation functions
```
