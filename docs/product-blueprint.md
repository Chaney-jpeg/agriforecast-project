# AgriForecast product blueprint

## Purpose

AgriForecast is a weather-aware farm management and decision-support product for Kenyan smallholder farmers. The long-term product direction combines farm records, bilingual advisories, weather, practical learning resources, and carefully validated mapping and service integrations.

## Current prototype scope

The Next.js prototype currently provides:

- A responsive farm workspace UI inspired by the supplied MyEasyFarm reference: primary farm navigation, a contextual farm-tools rail, and a large weather workspace.
- English and Swahili display controls.
- County-town or GPS coordinates for a weather request.
- A seven-day weather view built from the advice API response.
- A farm-guidance form for planting, crop disease risk, and livestock heat/water/pasture topics.
- An auditable advice shape: headline, confidence, reasons, actions, missing inputs, assumptions, what could change the advice, rule version, and sources.
- Built-in demo weather scenarios and browser storage for the latest advice result.

The crop/livestock rule values remain placeholders. No farmer account system, database connection, map service, photo pipeline, resource retrieval system, financial product, or third-party API is connected in the prototype.

## Product areas from the original research

### Farm workspace

- Dashboard and farm overview
- Farms, fields/parcels, and crop cycles
- Tasks, equipment, workers, warehouse/inventory, reference dictionaries, and reports
- Weather, farm guidance, notes, and farm reports

These labels establish a navigation structure. Screens marked “Planned workspace” are visual placeholders, not completed features.

### Weather and guidance

- Free weather updates as a basic value proposition
- Weather-aware planting, crop-risk, and livestock advisories
- Source, issue time, location, and confidence shown alongside advice
- Longer-term integration of local climate normals and validated sources

### Knowledge library and RAG

- Crop, livestock, spray-safety, irrigation, compost, hydroponics, and other farmer learning materials
- Bilingual and low-bandwidth presentation where validated translations exist
- Retrieval answers tied to exact source, version, page/section, and review status
- The iShamba source catalog is a research inventory only; no articles/PDFs have been ingested or approved for retrieval yet.

### Geospatial and field observations

- Farmer-controlled fields/parcels and map views
- Later satellite/remote-sensing layers for crop type, crop health, area, and yield estimates
- Geo-tagged crop-health images associated with field/plot IDs and crop growth stages
- Clear uncertainty, image date, sensor/source, and model version for derived results
- Do not present estimates as verified observations. Validate against field data before use.

### Livestock knowledge

- Livestock groups and farm context
- Future feed-planning and livestock resources informed by vetted sources such as ILRI research
- Qualified veterinary review for animal-health, feed-ration, and reproductive recommendations

### Farmer finance and services

- Future farmer-authorized comparison of lender offers and application prefill
- A farmer must review and approve shared profile, farm, parcel, and crop-cycle information
- No automated eligibility promise and no assumption of ICRISAT, registry, government, or bank API access until documented and partner-confirmed

### Accounts, community, and subscriptions

- Sign-up/sign-in and community membership are future capabilities
- Free/premium plans can be researched using iShamba's offer as a reference, but AgriForecast entitlements and pricing are undecided
- Before collecting personal or precise location data, define consent, access control, correction, retention, and audit requirements

## Build sequence

1. Stabilize the responsive workspace and keep the current guidance flow easy to reach.
2. Validate weather data, response provenance, accessibility, and Swahili wording.
3. Connect the learner-built PostgreSQL schema through server-side code; keep secrets out of browser code.
4. Add authenticated farmer/farm/field records with consent and least-privilege access.
5. Add a reviewed knowledge-source registry and authorized ingestion/indexing pipeline.
6. Pilot mapping and field-photo workflows in a limited geography with ground truth and uncertainty reporting.
7. Explore service partnerships for finance and livestock only after access, rights, and integration terms are confirmed.

## Status vocabulary

- **Implemented:** present and usable in this prototype.
- **Prototype:** present but uses placeholder data/rules or needs validation.
- **Planned:** represented in product research or navigation, not connected yet.
- **Partner confirmation needed:** depends on an external organization's data, API, permission, or service agreement.
