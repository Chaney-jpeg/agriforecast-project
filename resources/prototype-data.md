# Prototype data inventory

Reviewed from `agriforecast-prototype_1.zip` on 9 October 2026. The archive is a working Next.js/PWA code prototype. It does **not** include CSV, Excel, or other standalone data files. The prototype stores its sample catalogue and thresholds as TypeScript constants.

## Data currently represented in code

| Concept | Prototype values | Likely database role | Caution |
|---|---|---|---|
| Crop | Maize, beans, potato, sorghum; bilingual names; elevation/temperature bands; maturity by variety | `crops` reference table and crop-specific rule tables | Values are explicitly marked placeholders. |
| Farm inputs | Coordinates, elevation, crop, planting date, soil, maturity/variety, species, shade, water source, pasture condition | `farms`, crop cycles, livestock groups, and farm observations/preferences | Currently request context, not saved accounts/farms. |
| Weather day | Date, forecast/observed flag, rainfall, min/max temperature, high-humidity hours, max THI | `weather_records` with source and issue/valid times | Current source is Open-Meteo or demo data. Preserve missing vs zero. |
| Crop disease screen | Per-crop disease label, thresholds, qualifying days | `diseases` and versioned `disease_rules` | Rules are proxies/placeholders, not diagnosis. |
| Livestock thresholds | Species THI bands; poultry max temperature; water/pasture signals | Species reference table and versioned `livestock_rules` | Several thresholds are rough and need specialist review. |
| Advisory | Topic, level, bilingual headline/reasons/actions, confidence, assumptions, missing inputs, changes, rule version, sources | `advisories` plus child tables for localized text, evidence, actions, and source references | Save the inputs and versions needed to reproduce each result. |
| Weather feed | Open-Meteo client plus offline demo scenarios | `weather_sources`, `weather_imports`, and weather records | Terms need review before commercial use; demo observations must stay clearly marked. |

The archive README also identifies future requirements that are not yet implemented: user accounts, saved farms, Postgres/PostGIS, phone OTP, soil lookup, historical climate baselines, authentication/rate limits, and consent/retention safeguards for personal data.

## Proposed first learning scope

Start by modeling the core relational data: `farms`, `crops`, `crop_cycles`, `livestock_groups`, and `weather_records`. Then add sourced, versioned rule records and saved advisories. Do not copy placeholder thresholds into production reference data as if validated. Use a separate seed/demo dataset and name it accordingly.

## Provenance

Source archive: `/Users/chaneykarechu/Downloads/agriforecast-prototype_1.zip`  
Working copy: [`prototype/agriforecast`](../prototype/agriforecast)
