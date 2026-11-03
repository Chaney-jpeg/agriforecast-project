# iShamba resources and RAG preparation

Catalogued on 12 October 2026. This document records public iShamba agricultural resources for AgriForecast research and the planned retrieval-augmented generation (RAG) knowledge base.

## What was done

1. Reviewed iShamba's public farming-information catalogue and blog index.
2. Recorded public, directly linked PDF guides found during research, including crop production, livestock, irrigation, and an impact report.
3. Added source metadata and RAG status to [`resources/ishamba-rag-sources.json`](../resources/ishamba-rag-sources.json). This machine-readable catalog is the proposed input manifest for a future ingestion job.
4. Kept source documents at their publisher URLs. The project currently contains links and metadata, not downloaded/reproduced article text, extracted chunks, embeddings, or a running RAG feature.

## iShamba catalogue coverage

The catalogue groups material into crops, livestock, spray information, and other farm topics. It lists crop pages for avocado, banana, button mushroom, capsicum, carrots, courgette, cucumber, dry beans, fish, garlic, ginger, lettuce, mango, onion, passion fruit, Irish potato, sorghum, soya beans, tomato, turmeric, vegetables, and watermelon. Livestock/farm topics include dairy cattle and goats, poultry, pigs, rabbits, sheep, feeds, housing, silage, and vaccination. Other listed topics include drip irrigation, compost, compost tea, hydroponics, and vegetable nurseries. The site describes additional commodities beyond the items surfaced in the page extraction, so treat this as the visible catalogue, not a complete validated inventory.

## Linked documents found

See the JSON catalog for stable IDs and metadata. Directly found PDFs include:

- Tomato, dry beans, avocado, mango
- Drip irrigation installation, compost manure
- Tomato/pepper and vegetable spray programmes
- Dairy cattle production, indigenous chicken production, meat goat rearing, fish farming
- iShamba Farmer Insights impact report

The catalogue includes URLs for these resources. Hydroponics is listed on iShamba's farming-info page, but I did not locate a direct hydroponics PDF during this pass. Do not invent a PDF URL if a direct document link has not been confirmed.

## RAG ingestion workflow to implement

1. **Rights and source review:** confirm permission/licensing for retrieval and any public or commercial use. Capture the publisher, canonical URL, title, retrieval date, language, geography, and allowed uses. Publicly accessible does not itself mean freely redistributable.
2. **Fetch and archive:** only ingest sources approved for this use. Preserve an immutable original or approved snapshot, checksum, fetch time, and source version. Respect the publisher's terms and robots/access rules.
3. **Extract and quality-check:** extract PDF text with page numbers; retain headings and tables where possible. Flag OCR, garbled tables, missing pages, and product-branded recommendations for human review.
4. **Normalize without losing provenance:** store source-level metadata separately from chunk text. Give each chunk a stable ID and record page/section, language, geography, topic tags, and extraction version.
5. **Chunk and embed:** split on section boundaries first, then into retrieval-sized chunks. Avoid combining unrelated commodities or instructions in one chunk. Generate embeddings only for approved text and version the embedding model/configuration.
6. **Retrieve with filters:** query by commodity/species, topic, location relevance, source type, language, and approval status. Include the source title and page/section citation with every retrieved passage.
7. **Answer with guardrails:** require grounded citations, say when the source is silent, and distinguish educational material from a diagnosis, pesticide prescription, or veterinary treatment. Route health/spray safety questions to qualified local experts and authoritative current labels/guidance.
8. **Maintain:** schedule link checks and source re-review; replace stale copies by version rather than silently overwriting; retain audit records of chunk/source versions used by an advisory.

## Suggested RAG source record

The JSON manifest is a starting point. When ingestion is implemented, track at least: `source_id`, canonical URL, publisher, title, source type, language, geography, commodity/species, topic tags, publication/update date (if available), retrieval date, rights/permission status, review status, checksum, document version, extraction status, chunk IDs, and last-checked date.

Suggested review states: `discovered`, `rights_pending`, `approved_for_ingestion`, `ingested_needs_review`, `approved_for_retrieval`, `stale`, and `rejected`.

## Limits and safeguards

- The catalogued PDFs are English-language pages found through public search; it is not an exhaustive crawl of all iShamba knowledge products.
- Search-index snippets and older PDFs can be stale. Re-check each document's publication date and advice before use.
- Guides may contain specific pesticide, fertilizer, feed, or dosage statements. Do not serve these as current prescriptions without a qualified reviewer checking local registration, label instructions, species/crop context, and recency.
- iShamba sources are one knowledge stream, not a substitute for Kenya-specific government guidance, KALRO/ILRI research, meteorological data, or professional agronomy/veterinary review.
- Current AgriForecast has no RAG ingestion/indexing or retrieval endpoint. This catalog prepares the source inventory; implementation remains a separate build step.

## Research links

- [iShamba farming information](https://ishamba.com/farming-info)
- [iShamba blog](https://ishamba.com/blog)
- [iShamba services](https://ishamba.com/services)
- [iShamba about](https://ishamba.com/about)
- [Partner with iShamba](https://ishamba.com/partner-with-us)

