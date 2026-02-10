# PPMOJ

## Init repo

```sh
git clone https://github.com/NinoAur/PPMOJ.git
cd PPMOJ
```

## Development environment

A development environment is available through VS Code devcontainer feature. Further information on the specifics regarding this environment can be found [in the documentation](./docs/dev-env.md).

If you do not want to use this feature and instead run and develop the app directly on your machine. Please refer to [this documentation](./docs/configuration-installation.md) instead, as well as the [Front](#front) and [Back](#back) parts of this `README` file.

## Front

### Getting started

Run these commands to install the required NPM packages

```sh
cd /front
npm i
```

Run this command to start Angular live server (listening on `localhost:4200`)

```sh
npm run start-host
```

## back

### Setup

every command is executed from /back

```bash
cd back
```

#### Installing dependencies

```bash
pip install -r requirements.txt
```

#### migrating database

Download a DB Management Tool to create and connect to a local database (for example [MySQLWorkbench](https://dev.mysql.com/downloads/workbench/))

```bash
flask db upgrade head -d database/migrations/
```

#### filling database with data

(pour l'instant toujours via mysql connector mais sujet a changement)

```bash
python3 script_db.py -p
```

### Launching the server

Run this command to start the API ( listening on `localhost:5000` )

```bash
flask --app app run --debug
```

### evolving the database

#### editing the database

modifier le fichier database/models.py pour refleter l'etat souhaité de la base de données
effectuer tout autre changement dans le code (CRUD, fichier de peuplement, etc.)

#### Creating a migration

```bash
flask db migrate -d database/migrations/ -m "description de la migration"
```

#### Applying the migration

```bash
flask db upgrade head -d database/migrations/
```

#### (optionnal) reverting/recreating the migration

if you modified the model, already created a migration and want to add more changes to it, you can revert the migration and recreate it with the new changes

```bash
flask db downgrade -d database/migrations/
# delete the migration file in database/migrations/versions/
flask db migrate -d database/migrations/ -m "description de la migration"
flask db upgrade head -d database/migrations/
```

### updating the database schema graph

dans un premier temps, [installez graphviz](https://graphviz.org/download/), puis executez la commande suivante :

```bash
python3 script_db.py -d
```

#### finally, pushing the changes to the repo

```bash
git add .
git commit -m "description des changements"
git push
```

### File structure

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
