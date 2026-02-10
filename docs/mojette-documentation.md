# 5. Mojette Documentation

## 1. Creation de grille de mojette

Dans la table de problèmes, chaque numéro de problème est associé à un ID de forme. Pour chaque ID de forme, nous récupérons la forme correspondante et la longueur de la table dicoforme associée à cet ID de forme.

Ensuite, nous divisons la ligne de forme par sa longueur afin d'obtenir le nombre de lignes dans cette grille. Pour illustrer, supposons que nous ayons la forme suivante initialement :
'0,0,0,1,0,0,0,0,0,1,1,1,0,0,0,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,0,0,0,1,1,1,0,0'  avec une longueur de 7.
Après la division, nous aurions :

- '0,0,0,1,0,0,0'
- '0,0,1,1,1,0,0'
- '0,1,1,1,1,1,0'
- '1,1,1,1,1,1,1'
- '0,1,1,1,1,1,0'
- '0,0,1,1,1,0,0'

Ensuite, nous créons une grille de table de taille (longueur *nombre de lignes après la division). Si la valeur correspondant à cette grille est 0, nous rendons cette grille invisible et inactive. Si sa valeur est 1, son ID est calculé comme étant longueur* j + i, où i est le numéro de ligne et j est le numéro de colonne.

## 2. Boutton de grille mojette

### les boutons de nombre

Lorsqu'un utilisateur clique sur une grille qu'il souhaite modifier, nous attribuons à une variable grilleID l'ID de cette grille sélectionnée.

Ensuite, chaque fois qu'un bouton de nombre est sélectionné, il modifie la valeur de la grille dont l'ID est enregistré.

### Bouton "Retour"

Pour chaque valeur de grille modifiée, nous stockons l'ID et la valeur précédente de cette grille (L). Lorsqu'un utilisateur effectue un retour en arrière, on fait un pop pour récupérer le dernier élément de la liste et le supprimer dans la liste.

Après avoir récupéré cet élément, nous modifions la grille identifiée par l'ID récupéré avec la valeur récupérée.

## 3. fonctions de couleur

### modification de couleur des bases de projection

Pour la base du bas, on sélectionne l'ID à modifier en fonction de la position j de la grille sélectionnée.
Quant aux bases droite et gauche, nous sélectionnons leurs IDs en fonction des relations suivantes :

- ID-base-droit + ID-base-gauche = 2*i (i est numero de ligne dans la grille est selectionné)
- ID-base-droit = j - 3 + i (i est numero de ligne dans la grille est selectionné, j est numero colonne selectionne)

Après avoir récupéré les IDs des bases, nous modifions leur couleur en '#3333FF'

### modification des grille de projection pour la base bas

Après avoir sélectionné l'ID de la grille principale (IDP), on utilise une boucle while pour sélectionner les grilles dont les IDs sont (IDP + longueur *i) et (IDP - longueur* i) sous les conditions suivants ID > 0 et ID < 39

apres la selection de tout ses ID on change  leurs couleurs en '#3333FF'

### modification des grille de projection pour la base droit

Après avoir sélectionné l'ID de la grille principale (IDP), on utilise une boucle while pour sélectionner les grilles dont les IDs sont (IDP + longueur *i -1) et (IDP - longueur* i +1) sous les conditions suivant ID > 0 et ID < 39

apres la selection de tout ses ID on change  leurs couleurs en '#3333FF'

### modification des grille de projection pour la base gauche

Après avoir sélectionné l'ID de la grille principale (IDP), on utilise une boucle while pour sélectionner les grilles dont les IDs sont (IDP + longueur *i + 1) et (IDP - longueur* i -1) sous les conditions suivant ID > 0 et ID < 39

apres la selection de tout ses ID on change  leurs couleurs en '#3333FF'

## 4. fonction de soustraction

Pour la base du bas, on sélectionne l'ID à modifier pour la soustraction en fonction de la position j de la grille sélectionnée.
Quant aux bases droite et gauche, nous sélectionnons leurs IDs en fonction des relations suivantes :

- ID-base-droit + ID-base-gauche = 2*i (i est numero de ligne dans la grille est selectionné)
- ID-base-droit = j - 3 + i (i est numero de ligne dans la grille est selectionné, j est numero colonne selectionne)

### modification des grille de projection pour la base bas

Après avoir sélectionné l'ID de la grille principale (IDP), une boucle while est utilisée pour soustraire la valeur initiale de la base par rapport à toutes les grilles sélectionnées dont les IDs sont (IDP + longueur *i) et (IDP - longueur* i), avec les conditions suivantes : ID > 0 et ID < 39.

### modification des grille de projection pour la base droit

Après avoir sélectionné l'ID de la grille principale (IDP),une boucle while est utilisée pour soustraire la valeur initiale de la base par rapport à toutes les grilles sélectionnées dont les IDs sont (IDP + longueur *i -1) et (IDP - longueur* i +1) sous les conditions suivant ID > 0 et ID < 39

### modification des grille de projection pour la base gauche

Après avoir sélectionné l'ID de la grille principale (IDP), une boucle while est utilisée pour soustraire la valeur initiale de la base par rapport à toutes les grilles sélectionnées les IDs sont (IDP + longueur *i + 1) et (IDP - longueur* i -1) sous les conditions suivant ID > 0 et ID < 39

## 5. boutton start et recommencer

Lorsque le bouton dstart est pressé, il permet l'écriture sur la grille, lance le chronomètre et transforme ce bouton en bouton recommencer.

Lorsque le bouton de réinitialisation est pressé, toutes les données de jeu sont réinitialisées (valeurs insérées, chronomètre, liste des valeurs modifiées, liste des occurrences des nombres utilisés), l'insertion des nombres dans la grille est bloquée, et le bouton est transformé en bouton start.

## 6. fonction blocage des nombres

Cette fonction enregistre les nombres insérés dans les grilles, calcule leur occurrence et change la couleur des boutons des nombres en fonction du nombre inséré dans la grille en '#3333FF'. Si le nombre des nombres utilisés est égal à 3, cette fonction désactive les autres nombres jusqu'à ce que l'utilisateur effectue un retour pour supprimer des nombres qui semblent erronés pour lui.

## 7. fonction de validation

Cette fonction vérifie si toutes les grilles sont remplies, puis vérifie si toutes les bases sont nulles après la soustraction ou non. Ensuite, elle affiche un message de réussite ou un message indiquant un échec.

## 8. dessin des base de projection

Pour cette tâche, la balise canvas de HTML a été utilisée pour dessiner les trois bases.
