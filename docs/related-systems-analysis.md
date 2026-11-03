# Related systems and feature research

Research notes supplied by the AgriForecast product owner on 12 October 2026. These are product discovery observations, not independently verified descriptions of current partner APIs, service availability, or production integrations. Confirm details with each organization before designing dependencies or presenting them as live capabilities.

## Product direction observed

The final AgriForecast web app may combine hyperlocal weather, farm and crop/livestock records, geospatial monitoring, curated agricultural knowledge, and links to financial and advisory services. The prototype is still a starting point; these observations should be converted into validated requirements and sourced data contracts before implementation.

## iShamba

The user noted iShamba as a useful model for crop and livestock articles, spray programmes, practical farm topics, and weather/advisory services. Its public resource inventory and proposed RAG preparation workflow are documented in [`ishamba-resource-and-rag-process.md`](ishamba-resource-and-rag-process.md), with source metadata in [`ishamba-rag-sources.json`](../resources/ishamba-rag-sources.json).

Feature ideas observed in the user's notes:

- Farmer sign-up and community membership
- Free tier: agritips for one commodity and weather updates
- Premium tier: more commodity tips, more weather updates, community groups, call-centre access, event alerts, and broader farming information
- Articles on crops, livestock, spraying, drip irrigation, compost, hydroponics, and related practices

These are reference-product observations, not a finalized AgriForecast pricing or entitlement design.

## ICRISAT iSAT and agricultural finance

The user observed an ICRISAT iSAT concept for farmer financial inclusion: after farmer/crop/land records are populated, an eligibility engine could show competing loan offers from banks. The described one-click application would reuse verified farmer, land-parcel, and crop records to prefill an application, subject to farmer consent and lender requirements.

Potential AgriForecast capabilities to investigate:

- A verified farmer profile linked to farms, parcels, crop cycles, and consent records
- A lender-offer comparison interface based on lender-provided eligibility rules
- Farmer-authorized prefill of applications from verified records
- Clear provenance, correction, revocation, and audit trails for shared information

Open questions: confirm what “iSAT” refers to in this context; whether ICRISAT exposes a public or partner API; which registries can legally be queried; who verifies farmer/parcel/crop attributes; what consent and data-sharing agreements apply; and whether a lender would accept AgriForecast-generated prefill. Do not assume a government registry integration exists until validated.

## Geospatial mapping and yield estimation

The user highlighted geospatial technology for mapping rice areas and identifying Direct Seeded Rice (DSR) suitability, plus GIS and remote sensing for crop-type mapping and crop-health assessment.

Candidate capability areas:

- Map farms and land parcels with farmer-controlled visibility
- Use remote sensing to classify crop type and monitor vegetation/crop health
- Estimate planted area and pre-harvest yield with uncertainty ranges
- Provide DSR suitability layers only where the method, data resolution, season, and validation geography are known
- Record imagery date, sensor/source, processing version, model version, and confidence for every derived field

The notes mention a “field Estimation System (TEG-TECH)” with a geo-tagged crop-health photo hub: farmer/scout photos are captured at defined growth stages, ingested into a cloud database, and associated with parcel IDs. Spelling/name and project details are unverified. Treat this as a reference workflow to investigate rather than a confirmed API or supplier.

Possible value stated in the notes: accurate pre-harvest yield estimates could help insurers settle claims earlier and help agencies refine procurement and logistics planning. This outcome needs evidence and should not be promised without validated accuracy and operational studies.

## ILRI and livestock knowledge

The user mentioned an on-farm feed advisor mobile app associated with ILRI, an ILRI livestock master plan, and a ready-to-use semen dilutor/preservation medium for fresh cooled goat semen.

For AgriForecast, possible research tracks are:

- Feed planning/advice linked to species, production stage, locally available feed ingredients, season, and location
- Livestock reference plans with source/version and geography metadata
- Reproductive-management educational resources, with qualified veterinary review
- Potential data/API or research partnership with ILRI where publicly documented and permitted

Confirm the exact names, owners, availability, licensing, API access, country coverage, and current recommendations. These notes do not establish that the tools are APIs or that AgriForecast can embed them.

## Data, safety, and implementation principles

1. Keep farmer identity, parcel boundaries, crop records, photos, and derived health/yield measures under explicit consent, access control, retention, and audit policies.
2. Separate observations (e.g. a farmer photo) from model predictions (e.g. crop class or disease risk); retain confidence and the model/data version.
3. For finance, do not make automated eligibility promises. Display lender-provided terms, explain factors, and let the farmer review and submit.
4. For animal health, semen handling, and pesticide use, require qualified local review and current official labels/guidance before operational advice.
5. Evaluate geospatial estimates against labeled field observations across seasons and counties; report uncertainty and avoid treating estimates as ground truth.
6. Treat third-party products and APIs as dependencies only after their access terms, uptime, documentation, data rights, and support model are confirmed.

## Research and validation checklist

- Identify primary documents and official product pages for ICRISAT iSAT, the referenced field-estimation system, ILRI feed advice/livestock master-plan material, and the semen product.
- Record owner, canonical URL, publication/update date, geographic scope, license/terms, and contact/partnership route.
- Ask organizations directly about API availability, sandbox/demo access, permitted data use, and attribution requirements.
- Validate dataset/registry access with the relevant government agency and define the farmer consent flow before prototyping any data exchange.
- Define a small pilot geography and crop/livestock scope; identify ground-truth labels and responsible agronomy/veterinary reviewers.
- Keep each item in a source register as `observed`, `verified`, `partner_confirmed`, or `implemented` so research ideas are not mistaken for delivered features.
