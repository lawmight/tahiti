# Explorateur de données – Polynésie française

## Contexte

Je travaille sur un projet de visualisation de données statistiques pour la Polynésie française (source : ISPF — Institut de la statistique de la Polynésie française).

Les fichiers de données brutes sont à la **racine du dépôt** (pas dans un sous-dossier). Ce sont tous des fichiers **Excel 2007+ (`.xlsx`)**, lisibles avec `openpyxl`.

---

## Description exacte des 5 jeux de données

### 1. `10202.xlsx` — Imports commerciaux par pays (2023)

- **131 lignes** de données, année unique : 2023
- **Colonnes** : `Année`, `Pays`, `ISO2`, `Valeur imports` (en XPF), `Poids imports` (en kg)
- Contient les échanges avec 131 pays. Les valeurs sont en **francs CFP (XPF)**.
- Top 3 partenaires : France (59,4 Md XPF), Chine (34,5 Md), USA (23,1 Md).

### 2. `11201.xlsx` — Tourisme mensuel par région d'origine

- **1 792 lignes** de données, de **janvier 2007 à décembre 2025** (225 mois)
- **Colonnes** : `Mois` (date série Excel), `Region`, `Nombre de touristes`, `Nombre de croisièristes`, `Nuitées touristiques`, `Durée de séjour moyenne`
- 8 régions d'origine : Afrique, Amérique Centrale, Amérique du Nord, Amérique du Sud, Asie, Europe, Pacifique, Proche et Moyen Orient
- ⚠️ La colonne `Mois` est un **numéro série Excel** (ex : 45992 = décembre 2025). Il faut la convertir en date via `datetime(1899, 12, 30) + timedelta(days=valeur)`.

### 3. `11207.xlsx` — Tourisme annuel par pays d'origine

- **861 lignes** de données, de **2007 à 2024** (18 années)
- **Colonnes** : `Année`, `Region`, `Pays`, `ISO3`, `Nombre de touristes`, `Nombre de croisièristes`, `Nuitées touristiques`, `Durée de séjour moyenne`
- 48 pays répartis dans les mêmes 8 régions que `11201`.
- Le champ `ISO3` est parfois `None` (pour les agrégats régionaux comme "Afrique" ou "Autre Pacifique").

### 4. `11801.xlsx` — Trafic aérien international mensuel

- **468 lignes** de données, de **janvier 1987 à décembre 2025** (39 ans d'historique !)
- **14 colonnes** dont :
  - `Mois` (date série Excel, même format que `11201`)
  - `Coefficient moyen de remplissage du trafic total international (*)` (ratio 0–1)
  - `Fret (débarqué+embarqué)`, `Fret débarqué`, `Fret embarqué` (tonnes)
  - `Mouvements d'avions arrivés`
  - `Passagers (arrivées + départs)`, `Passagers arrivés`, `Passagers départs`
  - `Passagers en transit direct`
  - `Sièges occupés (arrivées+départs)`, `Sièges offerts (arrivées + départs)`, `Sièges offerts arrivées`, `Sièges offerts départs`

### 5. `exportrte.xlsx` — Registre des entreprises polynésiennes (RNTE)

- **189 822 lignes** de données (~29 Mo). Utiliser `read_only=True` avec openpyxl.
- **34 colonnes**, structurées en deux niveaux : entreprise (ENT) et établissement (ETAB).
- Colonnes clés :
  - **Identifiants** : `Numtah` (ID entreprise), `NumETA` (N° établissement), `NumtahETA` (ID composé)
  - **Entreprise** : `Nom_ENT`, `Sigle_ENT`, `code_Fjur` (forme juridique, 33 valeurs distinctes), `NAF2008_ENT` (code activité NAF), `Classe_Effectifs` (01 à 10)
  - **Localisation établissement** : `Code_Postal_ENT`, `Com_ETAB` (code commune), `Com_ETAB_libelle` (nom commune, 129 communes uniques), `PK`, `Quartier`, `Rue`, `Immeuble`, `ADRGEO`
  - **Activités multiples** : `NAF2008_ETAB`, `NAF2008_ETAB_1` à `NAF2008_ETAB_5` (jusqu'à 6 codes NAF par établissement, 488 codes distincts)
  - **Dates** (séries Excel) : `Insc_ENT` (inscription), `Mod_ENT` (modification), `Rad_ENT` (radiation/fermeture), `Reins_ENT` (réinscription), idem pour ETAB
- ~31 % des entreprises ont une date de radiation (fermées).
- Dates d'inscription couvrent **mars 2006 à mars 2026**.

---

## Ce que je veux construire

Une **application web React** monopage qui permet d'explorer ces données de manière interactive. L'interface est **entièrement en français**.

Le principe central est un **système d'onglets extensible** : chaque onglet est un module d'analyse autonome. L'objectif à long terme est que cette app soit évolutive — de nouveaux modules pourront être ajoutés lors de sessions futures, sans avoir à comprendre tout le codebase.

---

## Contraintes techniques non négociables

| Contrainte | Détail |
|---|---|
| **Framework** | React (via Vite ou Create React App) |
| **Langue** | Tout le texte affiché est en français : labels, axes, tooltips, messages d'erreur, titres d'onglets |
| **Architecture plugin/tab** | Chaque module est indépendant et s'enregistre dans un registre central. Ajouter un module = ajouter un fichier + l'enregistrer dans ce registre, sans devoir refactoriser les autres modules existants. |
| **Pas de backend** | Tout tourne dans le navigateur. Les fichiers `.xlsx` sont lus côté client ou pré-convertis en JSON à l'étape de build. |
| **Format des données** | Les fichiers sont au format Excel `.xlsx`, pas CSV. S'ils doivent être convertis (ex : en JSON pour le bundle), le script de conversion doit être inclus. |
| **Dates Excel** | Les colonnes `Mois` de `11201` et `11801` sont des numéros série Excel. La conversion doit être gérée proprement (base : 1899-12-30). |
| **Performance** | `exportrte.xlsx` fait 29 Mo / 190K lignes. Prévoir un chargement différé ou une pré-conversion pour ne pas bloquer le navigateur. |
| **Prototype** | Priorité à la clarté et à la lisibilité du code, pas au design pixel-perfect. |

---

## Critères de succès

1. **Les 5 sources de données** sont exploitées et leurs insights clés sont visibles dans l'app.
2. Un développeur peut **ajouter un 6ᵉ onglet d'analyse** en lisant uniquement la documentation générée, sans aide extérieure.
3. L'app **tourne sans erreurs bloquantes** dans la console du navigateur.
4. Un fichier **`NEXT_STEPS.md`** existe à la racine, listant les analyses non implémentées, classées par priorité.

---

## Décisions techniques validées (à suivre)

- **Stack** : Vite + React, TypeScript, **Recharts** pour les graphiques, **SheetJS (xlsx)** pour la lecture/conversion.
- **Aucun backend** : tout doit tourner dans le navigateur.
- **Stratégie données** :
  - Les 4 fichiers légers (`10202.xlsx`, `11201.xlsx`, `11207.xlsx`, `11801.xlsx`) sont **pré-convertis en JSON** à l’étape de build.
  - `exportrte.xlsx` (RNTE, 190K lignes) n’est **pas chargé brut** dans le navigateur : on génère uniquement des **agrégats JSON**.
- **Langue** : 100% du texte visible en français.

## Architecture imposée (plugin/tab)

### Objectif
Chaque onglet est un module autonome enregistré dans un registre central. Ajouter un module ne doit pas nécessiter de refactoriser les autres modules : on ajoute un dossier de module + un enregistrement.

### Structure de fichiers attendue

```
./
├── 10202.xlsx
├── 11201.xlsx
├── 11207.xlsx
├── 11801.xlsx
├── exportrte.xlsx
├── NEXT_STEPS.md
├── package.json
├── scripts/
│   └── convert-xlsx-to-json.mjs
├── public/
│   └── data/
│       ├── 10202.json
│       ├── 11201.json
│       ├── 11207.json
│       ├── 11801.json
│       ├── rnte-par-commune.json
│       ├── rnte-par-naf.json
│       ├── rnte-par-fjur.json
│       ├── rnte-par-effectifs.json
│       ├── rnte-dynamique.json
│       └── naf-codes.json
└── src/
    ├── App.tsx
    ├── registry.ts
    ├── components/
    │   ├── ErrorBoundary.tsx
    │   ├── LoadingSpinner.tsx
    │   └── TabBar.tsx
    ├── modules/
    │   ├── imports/
    │   │   ├── index.tsx
    │   │   └── meta.ts
    │   ├── tourisme-mensuel/
    │   │   ├── index.tsx
    │   │   └── meta.ts
    │   ├── tourisme-pays/
    │   │   ├── index.tsx
    │   │   └── meta.ts
    │   ├── trafic-aerien/
    │   │   ├── index.tsx
    │   │   └── meta.ts
    │   └── entreprises/
    │       ├── index.tsx
    │       └── meta.ts
    └── utils/
        ├── dateUtils.ts
        ├── formatters.ts
        ├── nafLookup.ts
        └── formeJuridique.ts
```

### Registre central (contrat de module)

Créer `src/registry.ts` avec ce contrat :

- `id`: string unique
- `label`: string FR affichée dans l’onglet
- `source`: nom du fichier source (ex: `10202.xlsx`)
- `description`: string FR
- `component`: composant React (lazy)
- `order`: number (ordre d’affichage)

API minimale :
- `registerModule(meta)`
- `getModules()`

### Enregistrement d’un module

Chaque module a :
- `src/modules/<module>/index.tsx`: UI + chargement data JSON
- `src/modules/<module>/meta.ts`: enregistrement dans le registre via `registerModule`

Pour ajouter un 6ᵉ onglet :
- créer `src/modules/nouveau/` avec `index.tsx` + `meta.ts`
- ajouter **une seule ligne** d’import dans `src/App.tsx` : `import './modules/nouveau/meta';`

## Utilitaires obligatoires (à centraliser)

### `src/utils/dateUtils.ts`

- `excelSerialToDate(serial: unknown): Date | null` :
  - base `1899-12-30` en UTC
  - utiliser `Math.floor` (dates Excel parfois décimales)
- `formatDateFR(date: Date | null, variant: 'long'|'short'|'month-year'): string`

### `src/utils/formatters.ts`

- `formatXPF(value: unknown): string` (XPF, k/M/Md, séparateurs fr-FR)
- `formatNumberFR(value: unknown): string`
- `formatPercentFR(value: unknown, digits?: number): string`

### `src/utils/nafLookup.ts`

- Charger `public/data/naf-codes.json` (issu de `SocialGouv/codes-naf`).
- `getNafLabel(code: unknown): string` :
  - essai exact
  - fallback sans la lettre finale (`01.11Z` → `01.11`)
  - fallback `"Code inconnu (XXX)"`.

### `src/utils/formeJuridique.ts`

- Table de correspondance des codes `code_Fjur` (au minimum : EI, SARL, SAS, associations) + fallback `"Forme juridique <code>"`.

### `src/utils/formatters.ts` (classes effectifs)

- Table `CLASSES_EFFECTIFS` :
  - `01`: 0 salarié
  - `02`: 1 à 2
  - `03`: 3 à 5
  - `04`: 6 à 9
  - `05`: 10 à 19
  - `06`: 20 à 49
  - `07`: 50 à 99
  - `08`: 100 à 199
  - `09`: 200 à 499
  - `10`: 500 et plus

## Script de pré-conversion (obligatoire)

Créer `scripts/convert-xlsx-to-json.mjs` qui :

1. Convertit `10202.xlsx`, `11201.xlsx`, `11207.xlsx`, `11801.xlsx` en JSON dans `public/data/<name>.json`.
2. Convertit `Mois` (séries Excel) en `YYYY-MM-DD` (UTC) pour les datasets mensuels (`11201`, `11801`).
3. Télécharge ou embarque `naf-codes.json` (source : `SocialGouv/codes-naf`) dans `public/data/naf-codes.json`.
4. Pour `exportrte.xlsx`, génère **uniquement** les agrégats suivants :
   - `public/data/rnte-par-commune.json`
   - `public/data/rnte-par-naf.json`
   - `public/data/rnte-par-fjur.json`
   - `public/data/rnte-par-effectifs.json`
   - `public/data/rnte-dynamique.json` (inscriptions/radiations par année)

Règle dure : le script ne doit pas produire un `exportrte.json` complet.

## Analyses recommandées par module (Recharts)

### Module 1 — Imports (`10202.xlsx`)
- BarChart horizontal : top 15 pays par valeur
- ComposedChart : Pareto (barres valeur + ligne cumulée %)
- ScatterChart : ratio valeur/poids (valeur unitaire proxy)

### Module 2 — Tourisme mensuel (`11201.xlsx`)
- LineChart multi-séries : touristes par région (2007–2025)
- AreaChart 100% empilé : part des régions dans le total
- Heatmap (custom) : mois × année pour la saisonnalité

### Module 3 — Tourisme par pays (`11207.xlsx`)
- BarChart + sélecteur d’année : top 10 pays (touristes)
- ComposedChart : touristes vs croisiéristes
- Treemap (optionnel) : pays par région

### Module 4 — Trafic aérien (`11801.xlsx`)
- LineChart : passagers (1987–2025), choc COVID visible
- ComposedChart double axe : taux de remplissage vs sièges offerts
- AreaChart : fret embarqué vs débarqué

### Module 5 — Entreprises (RNTE)
- Vues basées uniquement sur agrégats :
  - top communes
  - top secteurs NAF
  - formes juridiques
  - classes d’effectifs
  - dynamique inscriptions/radiations
  - taux d’actives vs radiées

## Dépendances NPM exactes (à respecter)

Dans `package.json` :
- `react`, `react-dom`
- `recharts`
- SheetJS via tarball : `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`
- Vite + plugin React

Ajouter des scripts :
- `convert`: exécute `node scripts/convert-xlsx-to-json.mjs`
- `dev`, `build`, `preview`

## Informations complémentaires pour le LLM

- La monnaie est le **franc CFP (XPF)**. 1 EUR ≈ 119,33 XPF.
- Les codes `NAF2008` (nomenclature d'activité française) peuvent être traduits en libellés lisibles via une table de correspondance publique.
- Les codes `code_Fjur` correspondent aux formes juridiques françaises (190 = entrepreneur individuel, 541 = SARL, 920 = association…).
- Les classes d'effectifs vont de 01 (0 salarié) à 10 (+ de 500 salariés).
- Les communes (`Com_ETAB_libelle`) couvrent l'ensemble de la Polynésie : Tahiti, Moorea, Bora Bora, les Tuamotu, les Marquises, les Australes, etc.

## Références et inspirations validées

- Pour le **profilage initial** des 5 fichiers, inspire-toi de l'approche de `ydata-profiling` : détection de types, valeurs manquantes, distributions, corrélations, outliers simples et traitement explicite des séries temporelles.
- Pour les modules de **dashboard économique**, tu peux t'inspirer des patterns d'analyse vus dans des stacks `Streamlit + Plotly`, mais l'implémentation finale doit rester une **SPA React** propre et maintenable.
- Pour `10202.xlsx`, les visualisations de type **classement des partenaires, parts relatives, contributions cumulées, comparaisons de poids vs valeur** sont particulièrement pertinentes.
- Pour `11201.xlsx`, `11207.xlsx` et `11801.xlsx`, privilégie des lectures **time series** : tendances longues, saisonnalité, comparaisons interannuelles, pics et ruptures.
- Pour `exportrte.xlsx`, les solutions de type **annuaire d'entreprises / SIRENE** montrent qu'il faut privilégier des **agrégations, index logiques et filtres rapides** (commune, NAF, forme juridique, effectifs, statut actif/radié) plutôt qu'une restitution brute des 190K lignes.

## Décisions de mise en oeuvre recommandées

- Commence par livrer une base solide sur les 4 jeux de données les plus légers (`10202.xlsx`, `11201.xlsx`, `11207.xlsx`, `11801.xlsx`), puis ajoute un module RNTE optimisé dans un second temps si nécessaire.
- Si un arbitrage est nécessaire, préfère une **pré-conversion à l'étape de build** pour `exportrte.xlsx`, et éventuellement pour les autres fichiers si cela simplifie fortement le runtime.
- Centralise les transformations communes dans des utilitaires réutilisables : conversion des séries Excel en dates, formatage des montants XPF, pourcentages, grands nombres, et gestion robuste des `None`/`null`.
- Ne charge pas ni ne rends par défaut une table exhaustive de `exportrte.xlsx` si cela dégrade l'expérience. Utilise plutôt un **chargement différé**, des **agrégats pré-calculés**, des vues dérivées, ou une exploration progressive.
- Pour le RNTE, privilégie des analyses à forte valeur métier : répartition par commune, secteur NAF, forme juridique, classe d'effectifs, dynamique d'inscription/radiation, densité d'établissements et top activités.
- Si tu dois choisir entre sophistication visuelle et robustesse de l'analyse, favorise toujours la **lisibilité**, la **vitesse** et la **clarté des insights**.

## Sorties attendues enrichies

- Inclure une **documentation courte mais exploitable** expliquant comment ajouter un nouvel onglet, où placer les données transformées, comment enregistrer le module dans le registre central, et quelles conventions suivre.
- Chaque onglet doit expliciter clairement : **source utilisée**, **métriques clés**, **transformations appliquées**, **graphiques affichés**, **hypothèses éventuelles** et **limites connues**.
- Prévoir dans la documentation un **template mental de module** : un fichier/module autonome, une définition de métadonnées, une fonction de chargement des données, puis une ou plusieurs vues.
- Le fichier `NEXT_STEPS.md` doit être alimenté avec des pistes priorisées comme : analyses avancées non livrées, enrichissement des libellés NAF, cartographie, croisements entre jeux de données, détection d'anomalies, ou exports supplémentaires.

## Critères d'acceptation techniques

- Le chargement initial de l'application ne doit **pas dépendre du parsing complet** de `exportrte.xlsx`.
- Les colonnes `Mois` de `11201.xlsx` et `11801.xlsx` doivent être converties de manière **cohérente et centralisée** à partir de la base `1899-12-30`, puis affichées avec un format lisible en français.
- Les valeurs manquantes comme `ISO3 = None` dans `11207.xlsx` ne doivent provoquer **ni crash, ni clé invalide, ni graphique cassé**.
- Tous les labels, titres, axes, tooltips, filtres, états de chargement et messages d'erreur visibles dans l'interface doivent être **en français**.
- L'application doit éviter les erreurs console bloquantes et limiter les warnings évitables liés au rendu, au chargement des données ou aux clés React.
- Un développeur qui découvre le projet doit pouvoir ajouter un 6e onglet sans relire tout le codebase, uniquement en suivant la documentation produite.

**Propose-moi un plan avant de commencer.**
