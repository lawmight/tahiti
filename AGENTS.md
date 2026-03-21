# AGENTS.md

## Cursor Cloud specific instructions

This is a **data-only repository** containing French Polynesia (Tahiti) statistical datasets in Excel (`.xlsx`) format. There is no application code, no build system, no test framework, and no linting configuration.

### Repository contents

| File | Description | Rows |
|------|-------------|------|
| `10202.xlsx` | Import trade data by country (2023) | ~132 |
| `11201.xlsx` | Monthly tourism stats by region | ~1,793 |
| `11207.xlsx` | Annual tourism stats by country (2024) | ~862 |
| `11801.xlsx` | Airport traffic data (freight, passengers) | ~469 |
| `exportrte.xlsx` | Business registry (~190K entries) | ~189,823 |

### Working with the data

- Python 3 with `openpyxl` is the primary tool for reading/manipulating these files.
- The update script installs `openpyxl` via pip. No other dependencies are needed.
- All data is in French. Column headers include: `Année` (Year), `Pays` (Country), `Mois` (Month), `Region`, etc.
- `exportrte.xlsx` is ~29 MB and takes 10-15 seconds to load; use `read_only=True` mode with openpyxl for performance.
- There are no lint, test, or build commands for this repository.
