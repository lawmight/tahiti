# Explorateur de données — Polynésie française

Application web React/Vite pour explorer cinq jeux de données statistiques de la Polynésie française à partir de fichiers Excel source.

## Fonctionnalités livrées

- **5 onglets d’analyse** :
  - Imports commerciaux
  - Tourisme mensuel par région
  - Tourisme annuel par pays
  - Trafic aérien international
  - Entreprises / établissements (RNTE)
- **Interface 100 % en français**
- **Architecture modulaire par registre**
- **Pré-conversion build-time** des fichiers Excel en JSON
- **Agrégats RNTE uniquement** côté navigateur (pas de dump complet du registre)

## Installation

```bash
npm install
```

## Conversion des données

Les fichiers Excel à la racine sont convertis en JSON via :

```bash
npm run convert
```

Le script génère notamment :

- `public/data/10202.json`
- `public/data/11201.json`
- `public/data/11207.json`
- `public/data/11801.json`
- `public/data/naf-codes.json`
- `public/data/rnte-par-commune.json`
- `public/data/rnte-par-naf.json`
- `public/data/rnte-par-fjur.json`
- `public/data/rnte-par-effectifs.json`
- `public/data/rnte-dynamique.json`

### Important

- Chaque classeur Excel source est lu sur **sa première feuille uniquement** ; un classeur à plusieurs feuilles fait échouer la conversion avec un message explicite.
- Les colonnes `Mois` des fichiers `11201.xlsx` et `11801.xlsx` sont converties en dates ISO `YYYY-MM-DD`.
- Le RNTE est **agrégé hors navigateur**. Le script ne produit jamais de `exportrte.json` complet.
- **Codes NAF** : si `data/naf-codes.json` est présent (fichier versionné dans le dépôt), il est recopié vers `public/data/naf-codes.json` **sans accès réseau**. Sinon le script télécharge la nomenclature sur jsDelivr. Avec `SKIP_NAF_FETCH=1`, l’absence de `data/naf-codes.json` provoque une erreur.

## Développement local

```bash
npm run dev
```

L’application Vite écoute par défaut sur `http://localhost:4173`.

## Build de production

```bash
npm run build
```

## Structure du projet

```text
src/
├── App.tsx
├── registry.ts
├── components/
├── hooks/
├── modules/
│   ├── imports/
│   ├── tourisme-mensuel/
│   ├── tourisme-pays/
│   ├── trafic-aerien/
│   └── entreprises/
├── types/
└── utils/
```

## Ajouter un 6e onglet

Le contrat d’extension est volontairement court.

### 1. Créer un dossier de module

Exemple :

```text
src/modules/nouveau-module/
├── index.tsx
└── meta.ts
```

### 2. Écrire `index.tsx`

Le composant doit :

- charger ses données via `useJsonData(...)` si nécessaire ;
- afficher ses graphiques et états de chargement/erreur ;
- documenter clairement la source, les transformations et les limites du module.

### 3. Enregistrer le module dans `meta.ts`

Exemple minimal :

```tsx
import { lazy } from 'react';
import { registerModule } from '../../registry';

registerModule({
  id: 'nouveau-module',
  label: 'Nouveau module',
  source: 'ma-source.xlsx',
  description: 'Description courte affichée dans le shell.',
  order: 6,
  component: lazy(() => import('./index')),
});
```

### 4. Ajouter une seule ligne dans `App.tsx`

```tsx
import './modules/nouveau-module/meta';
```

Et c’est tout : le registre central s’occupe de l’ordre d’affichage.

## Template mental d’un module

1. **Une source de données** (JSON généré ou agrégat)
2. **Un composant autonome** dans `index.tsx`
3. **Une déclaration de métadonnées** dans `meta.ts`
4. **Un import unique** du `meta.ts` dans `App.tsx`

## Utilitaires partagés

- `src/utils/dateUtils.ts` : conversion des dates Excel et formatage FR
- `src/utils/formatters.ts` : nombres, XPF, pourcentages, classes d’effectifs
- `src/utils/nafLookup.ts` : chargement / lookup des codes NAF
- `src/utils/formeJuridique.ts` : libellés de formes juridiques avec fallback

## Notes d’implémentation

- Le registre des modules est centralisé dans `src/registry.ts`.
- Les composants d’interface réutilisables sont dans `src/components/`.
- Le chargement JSON passe par `src/hooks/useJsonData.ts`.
- Les modules RNTE utilisent exclusivement les agrégats produits par le script de conversion.
