# Farm Expert

**Farming decisions, made simpler.**

An offline-first agricultural AI assistant for Kenyan smallholder farmers. Check crop
prices, compare fertilizer costs, and plan a planting budget over **Web**, **SMS-style**,
and **USSD-style** interfaces — even when connectivity is limited.

<p align="center">
  <img src="docs/screenshots/desktop.png" alt="Farm Expert dashboard" width="92%" />
</p>

## The problem

Most AI tools need a smartphone and good internet. Many smallholder farmers have
neither.

## Our solution

One assistant that works on **any phone** and **without internet**.

| Channel | Who it is for |
|---|---|
| Web app | Farmers with a smartphone or computer |
| SMS | Farmers with a basic phone |
| USSD menu | Farmers with a feature phone, no internet needed |

## Key features

- **6 crops:** maize, beans, potatoes, tomatoes, tea, sukuma wiki
- **3 counties:** Nakuru, Eldoret, Kericho
- **Fertilizer prices:** DAP, NPK, Urea and CAN, with the cheapest in stock highlighted
- **Budget planner:** shows the total cost and whether the farmer's budget is enough
- **English and Kiswahili:** replies in the farmer's language
- **Works offline:** prices and budgets still work with no connection
- **Always accurate:** numbers come from calculations, never guessed by the AI

## Demo

**Mary** farms 1 acre of maize in Nakuru with KSh 12,000. She asks in Kiswahili:

> *"Bei ya mbolea ni ngapi, na mahindi yanauzwa bei gani sokoni? Nina budget ya
> shilingi 12,000."*
> (How much is fertilizer, what does maize sell for, and I have KSh 12,000.)

Farm Expert replies with maize and fertilizer prices, and tells her the plan costs
**KSh 20,000**, so she is **KSh 8,000 short**.

**Try it:** click **Start Demo**, then open the **SMS** and **USSD** tabs to see the same
answer on a basic phone.

## Run it locally

Requires **Node.js 22** or newer.

```bash
npm install
npm run dev
```

Open **http://localhost:5173** (UI). The API listens on **http://localhost:4000**.

```bash
npm run dev:server     # API only → http://localhost:4000
npm run dev:client     # UI only  → http://localhost:5173
npm test               # full suite
npm run build          # production build
```

Optional AI providers are configured in `server/.env` (see `server/.env.example`).
No API keys are required for the demo — the deterministic fallback always works.

## Tests

Verified locally before this release:

| Suite | Files | Tests | Result |
|---|---:|---:|---|
| Server (`npm run test:server`) | 10 | 95 | All passed |
| Client (`npm run test:client`) | 6 | 28 | All passed |
| **Total** | **16** | **123** | **0 failed** |

```bash
npm test
# Vitest results: 95 passed (server)
# Vitest results: 28 passed (client)
```

Production build also verified:

```bash
npm run build   # server tsc + client Vite/PWA build
```

## Deploy

### Vercel (frontend + serverless API)

The repo already includes `vercel.json` and `api/[[...path]].ts`.

1. Import the GitHub repo in [Vercel](https://vercel.com/new).
2. Framework preset: **Other** (build settings come from `vercel.json`).
3. Set environment variables (optional — demo works without them):

| Variable | Purpose |
|---|---|
| `HOSTED_AI_API_KEY` | Hosted model API key |
| `HOSTED_AI_BASE_URL` | Chat completions URL |
| `HOSTED_AI_MODEL` | Model id |
| `API_STYLE` | `openai` or `anthropic` |
| `MODELSCOPE_API_KEY` | Alias for hosted key |
| `MODELSCOPE_BASE_URL` | Alias for hosted base URL |
| `MODELSCOPE_MODEL` | Alias for hosted model |
| `AI_REPLY_BUDGET_MS` | Max wait for AI phrasing (default `10000`) |
| `FARMEXPERT_DB_PATH` | SQLite path (use `/tmp/farmexpert.db` on Vercel) |

4. Deploy. The UI is static from `client/dist`; `/api/*` hits the Express app via the serverless function.

CLI alternative:

```bash
npx vercel --prod
```

### Render (single web service: UI + API)

The repo includes `render.yaml`.

1. In [Render](https://dashboard.render.com), **New → Blueprint**, connect this repo.
2. Render creates a Node web service that runs:
   - **Build:** `npm install && npm run build`
   - **Start:** `npm start` (serves `client/dist` + `/api`, including PWA `sw.js` / manifest)
3. Confirm `healthCheckPath` is `/health`.
4. Optionally set hosted AI secrets in the Render dashboard (`HOSTED_AI_*` or `MODELSCOPE_*`).
5. SQLite uses `/tmp/farmexpert.db` on the free plan (ephemeral disk — demo data is reseeded on cold start).

Manual service (without Blueprint):

| Setting | Value |
|---|---|
| Runtime | Node |
| Build command | `npm install && npm run build` |
| Start command | `npm start` |
| Health check | `/health` |

## Built with

| Part | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, PWA |
| Backend | Node.js, Express |
| Database | SQLite (`node:sqlite`) |
| Offline | Service worker + on-device agent fallback |
| AI (optional) | Ollama locally, or hosted OpenAI/Anthropic-compatible APIs |
| Testing | Vitest — **123 tests passing** |
| Deploy | Vercel serverless + Render web service |

## Note

All prices are **demo data** for illustration, not live market quotes. SMS and USSD
are **simulators**, not connected to a real phone network.
