# AgriForecast (prototype)

Weather-aware decision support for smallholder farmers. Web app (PWA) that works on phones, tablets and desktop.

**Status: working prototype.** The rule parameters are placeholders and must be validated by KALRO / county extension officers before real farmers rely on the advice. Swahili text needs a native-speaker review.

## What it does

Three advice topics, all through one engine:

1. **What and when to plant**: planting window from recent and forecast rain, dry-spell length, soil type, elevation, crop and variety. If a planting date is given, it estimates the growth stage and warns about dry spells at flowering or rain near harvest.
2. **Crop disease risk**: weather-favourability screens (Hutton-style for potato late blight; simple proxies for maize, beans and sorghum foliar diseases). Wording is "conditions favour", never "your crop has".
3. **Livestock**: heat stress (THI for cattle, goats, sheep; temperature for poultry), plus water and pasture/drought signals from recent and forecast rain and the farmer's own pasture observation.

Every result has the same structure: **headline, confidence, why, what to do, what is missing (with an "Add this" button), what we assumed, what would change the advice, rule version, sources.** Weather alone never decides the answer: with a missing crop, soil, variety, species and so on, the service asks or lowers its confidence.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 18 rule tests
npm run build && npm start   # production mode (enables the service worker / offline shell)
```

No API keys needed. Weather comes from Open-Meteo (free tier; **check its terms before commercial use**). The "Demo weather" dropdown in the form uses built-in scenarios so you can test every rule offline.

## Structure

```
src/lib/types.ts          shared types, Advice structure, rule version
src/lib/weather.ts        Open-Meteo client, ~10 km grid-cell cache, THI, demo scenarios
src/lib/rules/crops.ts    crop table (PLACEHOLDER values), suitability, maturity
src/lib/rules/planting.ts planting window + in-season stage advice
src/lib/rules/disease.ts  disease favourability screens
src/lib/rules/livestock.ts heat, water, pasture/drought
src/lib/advisory.ts       advise(topic, context, weather): pure function
src/app/api/advice/route.ts  POST /api/advice (validates input, returns advice + small weather series)
src/app/page.tsx          farm workspace UI, EN/SW, weather view, advice form
public/                   manifest, icon, service worker
tests/advisory.test.ts    rule tests
```

## Design choices worth knowing

- **Advisory engine is a pure function**, so every result can be reproduced and audited from (context, weather, rule version).
- **Forecasts are cached by grid cell**, not per user, so many farmers nearby cost one API call.
- **Offline**: the app shell is cached by a service worker, and the last advice is saved in the browser.
- **Low bandwidth**: the API returns only 21 days of daily values, no hourly data.

## Known gaps (next steps)

- Not yet verified against live Open-Meteo responses in the build sandbox; first thing to check on your machine (`npm run dev`, turn demo off, pick a county).
- No accounts, database or saved farms yet (planned: Postgres + PostGIS, phone-number OTP login).
- No SMS, USSD or M-Pesa yet (planned: Africa's Talking).
- Soil comes only from the farmer; iSDAsoil lookup is not integrated.
- Drought signal uses recent rain only, not a local normal (CHIRPS) or vegetation (NDVI).
- Rule parameters (crop elevation and temperature ranges, maturity days, thresholds, THI bands) are rough and need validating.
- No rate limiting or authentication on `/api/advice`.
- Data protection: location and phone numbers are personal data under Kenya's Data Protection Act 2019; add consent and retention rules before collecting any.

## Product blueprint and status

See the workspace-level [`docs/product-blueprint.md`](../../docs/product-blueprint.md) for the wider farm-management direction and a distinction between implemented, prototype, planned, and partner-dependent areas. Sidebar items such as satellite images, soil analysis, prescription/application/yield maps, and reports are navigation placeholders; they do not imply that those data services are connected.
