# AGENTS.md

## Cursor Cloud specific instructions

This repository contains French Polynesia (Tahiti) statistical datasets in Excel (`.xlsx`) format and a master execution prompt (`PROMPT.md`) used to generate a **React SPA** (no backend) for interactive exploration.

At rest, the repository may contain only data + docs; the application code is expected to be created by a cloud agent following `PROMPT.md`.

### Repository contents

| File | Description | Rows |
|------|-------------|------|
| `10202.xlsx` | Import trade data by country (2023) | ~132 |
| `11201.xlsx` | Monthly tourism stats by region | ~1,793 |
| `11207.xlsx` | Annual tourism stats by country (2024) | ~862 |
| `11801.xlsx` | Airport traffic data (freight, passengers) | ~469 |
| `exportrte.xlsx` | Business registry (~190K entries) | ~189,823 |
| `PROMPT.md` | Master prompt for cloud agent implementation | — |

### Working with the data

- **Node.js 18+** is the primary runtime for the checked-in pipeline. Excel files are converted with **`npm run convert`**, which runs [`scripts/convert-xlsx-to-json.mjs`](scripts/convert-xlsx-to-json.mjs) using the **SheetJS** (`xlsx`) package (see `package.json`).
- Place the `.xlsx` files at the **repository root** before running `npm run convert`. The script reads each workbook’s **first sheet only**; multi-sheet files are rejected with a clear error.
- **RNTE (`exportrte.xlsx`)** is **aggregated** during conversion (commune, NAF, forme juridique, effectifs, dynamique). The script does **not** emit a full-row `exportrte.json`; the SPA loads only those JSON aggregates under `public/data/`.
- **NAF labels**: if `data/naf-codes.json` is present, it is copied into `public/data/naf-codes.json` with no network. Otherwise the script downloads nomenclature from jsDelivr unless `SKIP_NAF_FETCH=1` (then `data/naf-codes.json` is required).
- All data is in French. Column headers include: `Année` (Year), `Pays` (Country), `Mois` (Month), `Region`, etc.
- `Mois` columns in `11201.xlsx` and `11801.xlsx` are Excel serial numbers (base `1899-12-30`), not date strings. The conversion script normalizes them to ISO dates.
- `exportrte.xlsx` is ~29 MB; loading the full workbook in Node for aggregation is memory-heavy—run convert on a machine with sufficient RAM.

### Expected app commands (once generated)

- `npm install`
- `npm run convert` (generates `public/data/*.json` from `.xlsx`)
- `npm run dev`
- `npm run build`

There are no pre-existing lint/test commands in the repository; if the app is generated, keep checks lightweight and focused on build/runtime correctness. CI runs `npm ci` and `npm run build` (see `.github/workflows/ci.yml`).
