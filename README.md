# AgriForecast

AgriForecast is a proposed weather-driven advisory prototype for Kenyan smallholder farmers. The project base includes the prototype source, planning notes, and a guided database learning path.

## Start here

- [Prototype data inventory](resources/prototype-data.md)
- [iShamba resource catalog for future RAG ingestion](resources/ishamba-rag-sources.json)
- [iShamba research and RAG process notes](docs/ishamba-resource-and-rag-process.md)
- [Related systems analysis: ICRISAT, ILRI, GIS, and farmer finance](docs/related-systems-analysis.md)
- [Product blueprint and implementation status](docs/product-blueprint.md)
- [Database learning path](docs/database-learning-path.md)
- [Prototype README](prototype/agriforecast/README.md)

The prototype's crop and risk-rule values are placeholders. They are useful for learning how to model the application, but must not be treated as verified agricultural guidance. Navigation entries for maps, field operations, knowledge resources, finance, and community are planned areas unless the blueprint marks them implemented.

## Run the prototype on localhost

From the project root:

```bash
cd AgriForecast-project
npm install
npm run dev
```

This will launch the prototype in the app workspace and keep the startup commands consistent. Then open:

- http://localhost:3000

If port 3000 is already in use, Next.js will automatically choose the next available port (for example, http://localhost:3001).

For a production-style check run:

```bash
npm run build
npm start
```

The app does not require API keys; it uses built-in demo weather scenarios and can also pull live weather data from Open-Meteo when enabled in the UI.
