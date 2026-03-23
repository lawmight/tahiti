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

- Python 3 with `openpyxl` is the primary tool for reading/manipulating these files.
- The update script installs `openpyxl` via pip. No other dependencies are needed.
- All data is in French. Column headers include: `Année` (Year), `Pays` (Country), `Mois` (Month), `Region`, etc.
- `Mois` columns in `11201.xlsx` and `11801.xlsx` are Excel serial numbers (base `1899-12-30`), not date strings.
- `exportrte.xlsx` is ~29 MB and takes 10-15 seconds to load; use `read_only=True` mode with openpyxl for performance.

### Expected app commands (once generated)

- `npm install`
- `npm run convert` (generates `public/data/*.json` from `.xlsx`)
- `npm run dev`
- `npm run build`

There are no pre-existing lint/test commands in the repository; if the app is generated, keep checks lightweight and focused on build/runtime correctness.
