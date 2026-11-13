# UBUNTU SHOP — UBUNTU HOLDING DRC

Boutique en ligne de UBUNTU HOLDING DRC, basée à Goma (RDC). Cette version intègre la première couche de présentation publique et les éléments graphiques corrigés fournis pour l'identité visuelle.

## Identité visuelle intégrée

- Bleu nuit principal : `#00144B`
- Bleu secondaire : `#3A4DA0`
- Brun : `#552A19`
- Jaune : `#F0E912`
- Blanc : `#FFFFFF`
- Typographie : Century Gothic, avec solution de repli système.
- Motifs officiels : frise hexagonale en contour, frise tricolore, hexagones pleins et symbole Ubuntu en bleu.

Les fichiers graphiques sont conservés dans `public/assets/brand/`. Ils sont utilisés sans recoloration ni déformation. La feuille de style est `public/styles/brand.css`.

## Stack

- Cloudflare Workers + Hono
- Cloudflare D1
- Cloudflare Workers Static Assets
- TypeScript

## Installation locale (Windows 11)

1. Installer Node.js LTS (version 20 ou supérieure).
2. Extraire l'archive et ouvrir le dossier du projet dans un terminal.
3. Installer les dépendances :
   ```bash
   npm install
   ```
4. Renseigner un véritable identifiant D1 dans `wrangler.toml` (remplacer `REPLACE_WITH_REAL_D1_DATABASE_ID`).
5. Appliquer la migration locale :
   ```bash
   npx wrangler d1 execute ubuntu-shop-db --local --file=migrations/0001_initial_schema.sql
   ```
6. Démarrer :
   ```bash
   npm run dev
   ```

## Vérifications

```bash

npm run typecheck
npm test
npm run build
```

## Déploiement Cloudflare

Créer la base D1 dans le compte Cloudflare, renseigner son identifiant réel dans `wrangler.toml`, puis exécuter les migrations sur la base cible avant `npm run deploy`. Ne jamais déposer de secrets dans GitHub.

## Endpoints présents

- `GET /` : vitrine UBUNTU SHOP responsive, FR/EN.
- `GET /api/health` : état de l'API.
- `GET /api/products` : produits publiés issus de D1.
- `GET /api/exchange-rate` : taux USD/CDF configuré en base ; renvoie une erreur explicite si aucun taux n'est défini.

## État réel de cette livraison

Cette archive est une base de projet avec la vitrine et les ressources de marque intégrées. Elle n'est pas encore une boutique complète prête à encaisser des commandes : l'administration, l'authentification complète, les imports Word/Excel, le panier/checkout, les paiements vérifiés, les reçus/factures et les workflows de production restent à développer et tester. Le schéma D1 initial est également à renforcer avant toute mise en production, notamment pour la gestion monétaire en unités entières et les règles de sécurité.

Ne pas connecter le domaine de production ni accepter de paiements avec cette version sans avoir terminé ces modules et les tests de sécurité.

---

© UBUNTU HOLDING DRC · Réalisation graphique : RIGOURA DESIGN
