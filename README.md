# GoalFirst

Responsive Next.js / TypeScript shopping preparation MVP, built from the parent PRD. English UI; fictional catalog and simulated checkout only.

## Run locally

Requires Node.js 20.9+ and pnpm.

```powershell
cd C:\hackathon\retail_ai_goalFirst\app
pnpm install
Copy-Item .env.example .env
# Edit .env locally and add your own OPENAI_API_KEY (optional).
pnpm dev
```

Open http://127.0.0.1:3000. No credential is needed for the complete Japan sample journey. `.env` and `.env.local` are ignored; never commit or share API keys. Restart the server after changing environment variables.

Environment variables:
- `OPENAI_API_KEY`: optional server-only OpenAI credential.
- `OPENAI_MODEL`: defaults to `gpt-4.1-mini`; use a model available to your project that supports Responses structured outputs.

## Demo walkthrough

1. Choose Japan trip and build the checklist. Without a key the UI explicitly says Sample mode.
2. Mark toiletries Already have, organizers Don't need, eSIM and day bag To buy.
3. Find my missing pieces. Compare two bags, select a product, then Add to cart.
4. Open Your cart; change quantities or remove products. Checklist status changes flag cart mismatches without removing cart lines.
5. Complete Demo Checkout. The confirmation explicitly says no payment or merchant order was created.
6. Refresh preserves the active goal, checklist and cart. Start a new goal opens a reset confirmation and clears that browser session.

## Architecture

- `src/app/api/plan/route.ts`: server-only OpenAI Responses integration with Zod structured output, 20-second request timeout, one retry, validated deterministic fallback. `store:false` is set. No provider error details or credentials are sent to clients.
- `src/app/api/recommend/route.ts`: validates plan and filters to-buy IDs; returns only seeded catalog IDs.
- `src/lib/catalog.ts`: 24 fictional products in 6 categories, deterministic matching and price limits.
- `src/lib/schemas.ts`: input, plan, status, and browser session validation.
- `src/components/Workspace.tsx`: goal workspace, status controls, comparison, cart, native dialogs, explicit checkout and local persistence.

Sample mode only tailors duration and purpose for Japan; unrelated goals display an explicit Japan fallback notice. Live AI handles other goals but can only shop categories present in the demo catalog. No live weather, legal, visa, airline, voltage, coverage, stock or merchant information is supplied. Product illustrations are generic icons, not product photography. Price limit is per product, not a total-trip budget. There is no deployment, account system, real checkout or tracking.

Browser storage holds the entered goal, plan and cart until reset. In live mode goals and previous checklist are sent to OpenAI. Do not enter sensitive information. The app has no authentication or production abuse protections; run the demo locally.

## Validation

```powershell
pnpm typecheck
pnpm test
pnpm build
```

Live API verification requires a user-provided key and is separate from the offline sample checks.

API documentation used: https://developers.openai.com/api/docs/guides/structured-outputs

## Adaptive questions and portable plans (25 October 2026)

`POST /api/questions` generates 0–3 goal-specific follow-up questions per round. It extracts known facts before asking, does not run a fixed questionnaire, and permits an immediate draft. After six answers the interview stops. Answers and follow-up notes become planning context. Provider failure produces honestly labeled adaptive sample questions.

For travel goals with an exact date and confirmed city, Open-Meteo supplies daily temperatures and rain probability for covered trip dates (up to 16 days). Uncovered dates stay unknown. Rain/layer suggestions use displayed rules and start unreviewed. Saved weather is a snapshot; refresh before packing. This version supports one weather location per plan; multi-city segments remain future work.

Product cards link to their actual fixture source at `/api/catalog?productId=...`. Amazon Singapore links search externally. Optional `EXA_API_KEY` in `.env` enables the explicit “Find retailer sources (Exa)” action. Results include retailer URLs and retrieval times; they do not verify price/stock or enter the demo cart. Real Amazon catalog API access and scraping are not configured.

Download checklist/shopping list exports readable Markdown. Save session JSON exports a versioned resumable session with statuses, trip notes, weather snapshot, research sources and cart. Upload & continue validates format, size, URLs, statuses and catalog IDs, previews replacement, and restores after confirmation. Markdown is for reading; JSON is for resuming. No credentials are exported.

Data flow: Open-Meteo receives the city query or coordinates; Exa receives the selected item query after an explicit click; OpenAI receives goal/answers/context. The public non-commercial Open-Meteo API is used for this hackathon demo; review terms for commercial deployment.

References: https://open-meteo.com/en/docs , https://open-meteo.com/en/docs/geocoding-api , https://exa.ai/docs/reference/search , https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction .

Verification: 18 offline tests passed, covering goal-dependent questions, known-fact suppression, weather coverage and packing rules, provenance and session round-trip. TypeScript and production build passed. Live city search, a five-day Tokyo forecast, and AI generation of a relevant city question were verified. Live Exa research remains unverified until its key is configured.

## Personal additions and live product pages — 25 October 2026

The checklist now separates AI suggestions from “Your additions”. The latter starts empty and is exclusively user-entered; users can add, rename, remove and set statuses for any personal item. `session.customItems` is separate from the AI plan and survives replanning, refresh, JSON export/import and Markdown download. AI generation never creates or overwrites personal additions.

Product results now use live Exa product-page discovery as the primary shopping flow. The local fictional product cards are removed from the shopping area. To-buy items from either list can be searched, queries can be refined, and result cards link directly to merchant product pages. The adapter restricts supported retailer domains and product URL patterns, discards generic search/category links and deduplicates results. No prices or stock are invented; indexed excerpts are optional and labeled potentially outdated. The legacy simulated cart is retained for saved data but hidden when empty.

Live verification: Exa returned actual Logitech product pages from Amazon Singapore, FairPrice and Challenger. Challenger and FairPrice example pages were independently opened successfully. The running app also displayed actual power-bank results from Decathlon, Challenger, Lazada, Apple and Shopee. Product metadata and availability must be checked on the retailer page.

### Three options per item

The shopping area displays every to-buy need in its own section, including user additions, instead of hiding all but one active tab. Each search returns at most three real product-page matches. The first result is labeled Recommended as a transparent search-relevance starting point, not a claim of best quality or lowest price. Users can choose another product; one saved URL per checklist item is retained in JSON sessions and readable downloads. Live UI verification confirmed four sections (power bank, eSIM, Japan adapter and toiletries), each with three results and exactly one recommendation. 24 tests passed.

## Unified plan and iterative product search

The UI now downloads one `goalfirst-plan.json` file and offers Upload & continue. It saves the goal conversation, AI checklist, user additions, trip/weather snapshot, real product results, selected products, and per-item search discussion/preferences. Old version-1 session files remain compatible. Conversations are restored when discussing the same goal; new replies continue from the saved answers. A maximum of 100 messages is retained locally and in the portable file.

Each product tab has “Tell AI what to change”. Users can append natural-language constraints, e.g. Under S$100, white, Logitech, only Amazon.sg; later corrections override previous preferences. OpenAI returns validated search intent, and Exa searches using the interpreted query and explicit domain filters. If interpretation fails, the exact user wording is searched with an honest notice. Website filters are enforced on returned URLs; price/color/brand are search targets, not verified retailer attributes. Indexed prices and variants can be stale, so confirm on the merchant page. Preferences and refinement history survive export/import. Clear preferences restarts the item search without those constraints.

Selected product tabs now display a downward arrow; unselected tabs keep the right arrow. Live verification: AI interpreted max SGD 100, white, Logitech and amazon.sg correctly, and all three returned product URLs were on amazon.sg.

## Purchase preparation and totals

Chosen real products are now collected in a Purchase plan, separate from the legacy fictional cart. Each line records the product URL/title, quantity, user-entered SGD unit price and the timestamp of price entry. Choosing a different product clears that item's old price; choosing the same URL preserves its price and quantity. Checklist changes flag mismatches without silently deleting choices.

The summary calculates in integer cents and updates on price/quantity changes. Delivery, extra fees and a total budget can be entered. Unknown prices/fees are never treated as confirmed free costs: incomplete sums are labeled Known amount so far, with unpriced item counts; an entirely unpriced selection says Awaiting prices. Once all prices and fees are entered (including explicit zero fees), the amount is labeled Estimated total. Budget warnings remain valid even when known costs alone exceed the budget. These are buyer-entered planning figures, not live merchant quotes or a payment checkout.

All quantities, prices, fees and budget settings are included in the existing single-file plan export/import. 35 tests passed, including decimal arithmetic, partial totals, quantity changes, budget overrun, selection changes and persistence.

## Question cards, source prices and task classification

Dynamic follow-ups now use a question card with numbered answer rows, a free-text Other field and Skip. Options come from the AI for the current question. There is no fixed total-question count; users can dismiss the card and use normal chat.

Product search requests page text as well as excerpts. Explicit SGD price evidence is retained with product results. One unambiguous amount is shown as an indexed estimate and used for purchase-plan estimates when selected; missing or ambiguous prices remain unknown. Foreign currencies, delivery fees, vouchers, original prices and identifiable related-product sections are excluded. Indexed evidence is not a live checkout quote. User-entered prices override estimates.

AI checklist entries now distinguish concrete items from tasks. Budget management, planning, checking and packing are tasks with To do / Done / Skip controls, excluded from product recommendations. Older saved action entries are recognized by their wording. The plan schema allows an empty checklist and no longer forces at least six entries.

### Lowest-price preference

At the user's request, the price policy now uses the lowest recognized listed SGD amount for the product, retaining its exact indexed excerpt. Prices identified as original/list prices, delivery, vouchers or foreign currencies are excluded. Retrieved product pages are sorted by their known indexed price before limiting to three options; unknown prices sort last. This is the lowest found indexed offer among retrieved pages, not a guarantee of the lowest live price or a particular variant. The first priced card is labeled Lowest price found. Selecting it uses the indexed amount as an editable purchase-plan estimate. Live UI verification showed three prices sorted as S$6.00, S$7.20 and S$12.15; gift-budget and packing entries were shown as tasks. 44 tests passed.

## Local Amazon.sg purchase preparation agent

Open `/buying` using **Prepare purchases with agent** in the purchase plan. Select products and quantities first, then explicitly authorize adding these items to the cart. The agent processes one item at a time in a separate Edge session. It only accepts direct Amazon.sg product pages; other retailers require choosing an Amazon alternative. Variants, login, verification, stock problems and uncertain cart results pause for user input. Confirm the currently open variant before resuming when prompted.

The agent checks the cart before adding and only records **In cart** after matching the product ASIN and quantity. It never clicks Buy Now, Checkout or Place Order. Final checkout belongs to the user. **Purchased** is a separate, explicitly confirmed user report, not a verified order. Cost checking is not part of this execution flow.

Requires local Node and installed Microsoft Edge. Playwright uses the installed Edge channel; no separate browser download is required. Run `pnpm dev` locally. This process-owned browser workflow is not designed for serverless hosting. The browser context is isolated and non-persistent: users enter login/verification themselves, and passwords, payment details and cookies are never saved in the exported plan. Closing it loses that browser session; a signed-in Amazon account can retain its own cart.

The existing single JSON file now includes preparation progress. Server jobs live in memory; after restarting the server, rebuild preparation from the saved plan. The agent reconciles the cart before retrying and preserves user-reported purchased items. Amazon page changes can require manual handoff; uncertain outcomes are not marked successful. Automated tests use a fake browser adapter, and the browser smoke check opens only a blank Edge page. Live Amazon cart mutations and checkout are not exercised by these checks.
