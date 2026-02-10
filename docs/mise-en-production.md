# 6. Mise en production

Pour la mise en production et permettre une redirection lors d'un appel de route, il faut faire attention à bien avoir dans le build un fichier :

.htaccess

Avec comme contenue : ErrorDocument 404 /index.html

Lorsque l'error 404 survient on redirige la commande à index.html.
