# 2. Configuration et Installation

## Prérequis : Logiciels, versions, et outils nécessaires pour travailler sur le front-end et back-end

### Front-end

- **Node.js** : Angular nécessite un environnement de serveur Node.js pour exécuter ses outils de ligne de commande et ses dépendances. Téléchargez et installez la version LTS (Long Term Support) de Node.js à partir du [lien node JS](https://nodejs.org/).

- **npm (Node Package Manager)** : npm est installé automatiquement avec Node.js et est utilisé pour gérer les paquets et dépendances dans les projets Angular.

- **Angular CLI (Command Line Interface)** : Un outil de ligne de commande pour initialiser, développer, construire et maintenir des applications Angular.Compris dans Node.js

- **Un Éditeur de Code (Visual Studio Code)**

- **Navigateurs pour le Test**

### Back-end

- **Python** : Téléchargez et installez Python à partir du [lien python](https://www.python.org/downloads/). Assurez-vous d'ajouter Python et pip (le gestionnaire de paquets Python) à votre variable d'environnement PATH lors de l'installation.
- **Flask** : Après avoir installé Python, vous pouvez installer Flask et Flask-Cors (si nécessaire pour votre application) en utilisant pip : pip install Flask Flask-Cors
- **MySQL Server** : Le système de gestion de base de données. Téléchargez et installez MySQL Server à partir du [lien mysql serveur](https://dev.mysql.com/downloads/windows/installer/8.0.html) et ce sera MSI installer le moins lourd de .msi à installer.
- **MySQL Connector/Python (MySQL CLC)** : Un pilote MySQL pour Python. Installez-le à l'aide de pip pour permettre à votre application Flask de communiquer avec votre base de données MySQL : ```pip install mysql-connector-python```
- **MySQL Workbench** : Un outil visuel pour la conception, le développement, et l'administration de bases de données MySQL.

## Guide d'installation

### Front-End

Sur un autre Terminal déplacez vous dans les fichiers contenant le front : ```cd .\front```
Effectuez une installation de tout les modules node avec : ```npm install```
Et vous pouvez ensuite lancez le serveur avec ```npm start```
Votre Serveur Front-end est lancé.  

### Back-end

Après avoir installé tous les requis : \newpage

Sur MySQL installer :
Choosing a Setup Type : Custom
Select Products :

```tree
MySQL Servers
└── MySQL Servers
    └── MySQL Servers 8.0
        └── MySQL Servers 8.0.36 
```  

Cliquez sur la =>. Puis :

```tree
Applications
└── MySQL Workbench
    └── MySQL Workbench 8.0
        └── MySQL Workbench 8.0.36 
```

Cliquez sur la =>.

Download : Execute, Next  
Installation : Execute, Next  
Product Configuration : Next  

Type and Networking : Laissez les paramètre comme ils sont et cliquez sur Next  
Authentification Method : Next
Account and Roles : Très important pour le root mettez le mot de passe que vous voules mais il est important de s'en souvenir.  
                    Puis cliquez sur Add User. Sur cette onglet ajout l'user : User Name : nino, Host: localhost, Role: DB Admin : Password:   4TVZZHn3xU  
                    Puis cliquez sur Next
Windows Service : Next  
Server File Permissions : Next  
Apply Configuration : Execute, Finish  

Product Configuration : Next  
Installation Completed : Finish  

Ensuite vous pouvez aller sur mysql Workbench : Connectez vous au serveur local avec le mot de passe du root.  
                                                Ici vous aurez les informations sur votre DB et ce que chaque table contiennent en cliquant sur Schemas et en sélectionnant votre DB  

Ouvrez ensuite l'application MySQL 8.0 Command Line Client:  

- Tapez le mots de passe du root
- Entrez la ligne : ```CREATE DATABASE DB_DATABASE```;  
- Puis entrez la ligne : ```USE DB_DATABASE```;  
- allez ensuite dans le fichier mysql_schema.sql dans les fichiers du back du projet et copiez l'intégralité du document pour le coller dans le MySQL CLC  
Votre Serveur est prêt à l'utilisation.  

Sur votre projet ouvrez un terminal :
Entrez : ```cd .\back```  
Puis si votre python est bien implémenté faites : ```pip install -r .\requirements.txt```  
Créez un environnement si cela ne fonctionne pas dans un premier temps
Puis lancez le serveur en écrivant : ```python .\class_server.py```  
Votre Serveur Back-end est lancé.  
