# Result-Visualization

*result-visualization* est une application développée par et pour BIOMAE dans le but de visualiser leurs données sur une carte et pour pouvoir intéragir avec ces dernières dans le but de pouvoir facilement créer une carte de résultat au client (elle-même intéractive).

## Lancer l'application

Trois étapes sont nécessaires après avoir cloné ou reçu par moyen externe l'application. 
- Tout d'abord, il faut s'assurer d'avoir bien le fichier des variables d'environnement (.env) qui ne se trouve pas sur le git par mesure de sécurité. Ces variables permetteront de renseigner au serveur les informations pour pouvoir se connecter à la base de données. De plus, il faut placer les deux fichiers json *SecteurHydro_FXX.json* et *paot_ctxt_cours_deau.json* dans un dossier nommé layers qui sont respectivement les données des bassins hydrographiques et les cours d'eaude France (ces fichiers sont trop gros pour les stocker sur le git).
- Ensuite, il faut s'assurer d'avoir une connexion au VPN de Zabé (WireGuard) parmis celles encore disponibles.
- Enfin, il faut installer les modules node nécessaires au bon fonctionnement du serveur. Comme ils sont pré-enregistrés, il suffit de rentrer dans une console ouverte au bon dossier la commande suivante : 
```
npm i
```

Si vous ne pensez pas utiliser l'application sur votre ordinateur qui héberge le serveur, il est primordial de changer l'adresse ip que la page web va aller requêter pour obtenir les données. Pour cela, ouvrez le fichier .env.development.local qui se trouve dans le dossier front et remplacer 'localhost' par votre adresse IP à vous (adresse IP du réseau internet WiFi ou Ethernet), ensuite compiler le côté client en rentrant la commande  :
 ```
 npm run build
 ```
 Un nouveau dossier /dist va être créé dans le dossier front, il faut alors remplacer l'ancien dossier /dist dans la racine du projet par ce nouveau dossier /dist. 


Une fois tout ceci fait, on peut lancer le serveur avec la commande suivante inscrite dans une console (dans le bon dossier) :
```
npm run dev
``` 
Cette commande mettra à disposition le serveur pour une utilisation locale de l'application. Pour s'y connecter, il faut entrer dans l'URL de votre moteur de recherche :
- Soit localhost:3000 si vous êtes sur l'ordinateur où le serveur a été lancé.
- Soit iplocal:3000 avec iplocal qui est l'adresse ip de l'ordinateur sur votre réseau local (WiFi ou Ethernet) pour une utilisation sur un des ordinateurs du réseau.



## Utiliser l'application

Sur la page principale, l'application se décompose en deux parties distinctes et manipulables :  le menu de personalisation et la carte.

### Le menu

Pour afficher des résultats sur la carte, il faut au préalable choisir un nom de campagne à afficher. Le nom à inscrire doit comporter des majuscules et bien exister dans la base de données pour éviter toute erreur. Une fois validée, chaque campagne choisie sera située en dessous et un bouton en forme de croix permet la suppression de cette campagne dans la visualisation. Des points vont alors apparaître dans la carte à leur coordonnée propre. L'ajout de campagnes similaires (différentes campagnes d'une même agence) sont combinés au même point (le numéro du point étant le dernier chiffre de la référence du point de mesure), on peut donc afficher plusieurs résultats de campagnes sur les mêmes points.
Divers menus déroulants et boutons sont disponibles pour la personnalisation des résultats: 

**Taille des points** Cette barre permet de régler la taille des points affichés sur la carte.

**Afficher les numéros** Cette case à cocher permet de choisir si les points affichent leur numéros correspondants. *utile lorsque que beaucoup de points sont affichés*

**Modifier la personnalisation** Ce bouton permet de choisir parmis les points affichés, lesquels sont affichés (case à cocher à côté) ainsi que leurs résultats. Par un soucis d'affichage, un choix doit se faire quant à l'affichage de points possédants plusieurs résultats du même biotest par campagne. Soit on choisit un seul résultat, soit on choisit plusieurs et alors tous les points n'ayant qu'un résultat ne sont pas affichés.

**Fond de carte** Ce menu déroulant permet de choisir le fond parmis ceux disponibles par mapboxgl. Cependant, lorsqu'un changement de fond est choisi, les différentes couches choisies sont supprimées (bassins versants, cours d'eau, flèches).

**Version** La version par défaut est la dernière en date dans la base de données traitées. Si un changement s'opère, l'intégralité des données traitées est rechargée dans la version voulue.

**Biotest** Ce menu déroulant permet de choisir quel résultat est affiché parmis les biotests de toxicité et chimie.

Pour la toxicité, on peut n'afficher que l'alimentation, la neurotoxicité ou la fécondité en résultat *simple*, on peut aussi afficher tous en même temps avec l'onglet toxicité (à ceux-là s'ajoute les résultats de mue et de perturbation endocrinienne). *L'onglet toxicité n'est disponible que lorsqu'un seul résultat par point est précisé, lorsque qu'on choisit d'afficher tous les résultats, on ne peut pas choisir le bouton toxicité*. 

Pour la chimie, on peut choisir un affichage NQE ou BBAC. Ensuite il faut présicer l'élément chimique que l'on souhaite afficher. *Pour la NQE, on a la possibilité d'afficher aussi si le témoin a dépassé le seuil de validation (résultat encadré en rouge).*

Une ou plusieurs légendes apparaitront en fonction du biotest choisi, ces légendes sont cliquables/glissables sur toute la fenêtre. Le intitulés des campagnes sont modifiables en cliquant dessus.

**Ajouter les bassins versants** Ce bouton permet d'afficher les différents bassins versants de France pour les coloriés. Une fois chargés, les bassins versants peuvent être survolés (ce qui indique leur nom) ou cliqués. Si l'un d'entre eux est cliqué, un onglet permettent de choisir la couleur ainsi que l'opacité apparaît dans le menu. Une légende rappelant chaque bassin colorié apparaît en haut à gauche de la fenêtre si un changement de couleur est choisi (cette légende s'adapte à cahque nouveau changement).

Une case à cocher **afficher jusqu'au sous bassin** permet d'aller à un nouveau de profondeur plus important dans la coloration des régions hydrographiques.

**Ajouter les cours d'eau** Ce bouton permet d'afficher les fleuves et rivières importantes sur tout le territoire

**La carte**

La partie principale de l'application est la carte intéractive qui affiche les résultats. On peut zoomer/dézoomer avec l'aide de la molette, on peut se déplacer sur la carte en cliquant/glissant la carte et on peut rotationner la carte en faisant "Clic droit + déplacement souris".

**déplacer un point** Les points peuvent tous être déplacés en cliquant/glissant le point. Un "flèche" noire apparaîtra pour préciser la position réelle du point. Cette même couleur de flèche peut être modifiée lorsque un des points a été déplacé par l'onglet prévu à cet effet qui apparaît sur la droite en bas du menu de personalisation . 
