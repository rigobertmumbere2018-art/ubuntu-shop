# Guide d'utilisation des éléments graphiques UBUNTU

Les fichiers de `public/assets/brand/` proviennent des visuels de marque fournis pour UBUNTU SHOP.

| Fichier | Utilisation prévue |
|---|---|
| `hexagons-outline.png` | Frises et fonds décoratifs très discrets |
| `hexagons-solid.png` | Composition d'hexagones pleins, en accent visuel |
| `hexagons-tricolor.png` | Frise répétitive aux trois couleurs de la marque |
| `ubuntu-symbol-blue.png` | Symbole de marque source, à utiliser sur fond clair ou avec une variante claire pour les fonds sombres |
| `ubuntu-symbol-navy.png` | Variante bleu nuit, notamment sur les surfaces claires et l'icône du site |

## Contraste du logo

- Sur un fond sombre (bleu nuit, bleu profond, brun ou noir), utiliser le logo blanc ou jaune.
- Sur un fond clair, utiliser la version bleu nuit.
- Ne jamais afficher un logo bleu nuit ou noir sur un fond bleu profond.
- Ne pas déformer, étirer, redessiner ou modifier les proportions du logo.
- La variante claire peut être obtenue depuis le fichier source monochrome par un traitement CSS uniforme, sans changer la géométrie du symbole.

## Motifs hexagonaux

- Les motifs sont des éléments secondaires : ils ne doivent jamais concurrencer les titres, les paragraphes, les prix, les champs ou les boutons.
- Réduire leur opacité selon le contexte : environ 5 à 15 % derrière les textes, 15 à 30 % dans les zones décoratives, et davantage uniquement dans les frises séparatrices sans contenu.
- Ne jamais placer un motif dense derrière un long texte ou une zone de lecture.
- Préserver les espaces négatifs autour des contenus et du logo.
- Ne pas étirer les visuels : conserver leur ratio d'origine et utiliser `object-fit: contain` ou `cover` selon le rôle de la frise.

## Mise en page et accessibilité

- Conserver la palette officielle : bleu nuit `#00144B`, bleu secondaire `#3A4DA0`, brun `#552A19`, jaune `#F0E912`, blanc et noir.
- Garder un contraste lisible entre texte et arrière-plan.
- Préserver une hiérarchie claire entre navigation, titres, descriptions, actions et informations secondaires.
- Adapter les marges, tailles de texte et grilles aux écrans mobiles.
- Respecter `prefers-reduced-motion`.
