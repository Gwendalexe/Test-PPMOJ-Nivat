# Paiement via stripe

on utilise stripe pour le paiement en ligne. avec un environnement de test il est possible de tester le paiement sans avoir à payer.

- paiement accepté: 4242 4242 4242 4242
- paiement refusé: 4000 0000 0000 9995

il est nécéssaire de récuper les clés publiques et privées de stripe, et les ajouter a l'environnement du back et du front.

## Doc

- [stripe api](https://docs.stripe.com/api)
- [stripe checkout quickstart](https://docs.stripe.com/checkout/quickstart)
- [ngx-stripe](https://ngx-stripe.dev/docs/introduction)

## Configuration de stripe

pour la logique applicative, quelques métadonnées sont ajoutées au produits et au tarrifs.

il faut créer un produit mojette avec 5 tarifs ponctuels forfaitaires
et ensuite ajouter une métadonnée `type` avec la valeur `mojette` au produit.

ensuite il faut créer un produit token avec 10 tarifs ponctuels forfaitaires (les tarifs usuels et les tarifs réduits)
et ensuite ajouter une métadonnée `type` avec la valeur `token` au produit.
ensuite, pour chaque tarif on ajoute une métadonnée `promo_mojette` a 'true' ou 'false' pour indiquer si le tarif bénéficie d'une réduction grace au mojettes, ainsi qu'une métadonnée `promo_mojette_amount` pour indiquer combien de mojettes sont nécessaires pour bénéficier de la réduction.
