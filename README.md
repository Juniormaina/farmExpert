# Farm Expert

Farm Expert helps a farmer plan a crop, compare demonstration fertilizer prices, read demonstration market figures, and structure a question. The first controlled pilot, when the remaining human and host checks are done, is web only: maize, Nakuru, a facilitator in the room, and the deterministic agent.

This repository is ready for internal testing. It is not ready for farmers until an agronomic reviewer signs the rates, a real support contact is configured, and the Render host is deployed and checked. Those gates are in [docs/PILOT_RUNBOOK.md](docs/PILOT_RUNBOOK.md).

Prices and fertilizer listings are demonstration data. SMS and USSD in the app are simulators. They are not connected to a phone network.

## What you can do in this build

- Ask a question in English or Kiswahili. Distress, disease, and pesticide questions are sent to an extension officer. The reply does not diagnose or name a dose.
- Compare demo fertilizer prices and read demo market figures. Both stay labelled as demonstration data.
- Calculate a planting budget from the crop catalogue. Missing crop, county, acreage, or budget is asked for. The result is an estimate, not a profit or yield guarantee.
- Keep using bundled prices and the budget calculator when the browser is offline.
- Save an optional farm profile on the device: county, crop, acres, budget, and language. There is no account.

Supported crops: maize, beans, potatoes, tomatoes, tea, sukuma wiki. Demo counties: Nakuru, Eldoret (Uasin Gishu), and Kericho.

## What this build does not do

It does not provide a live market feed, a verified fertilizer rate, hosted AI, a real SMS gateway, or a real USSD gateway. Weather, voice, photo diagnosis, payments, and a marketplace are out of scope. Crop bag rates stay illustrative until a person signs [docs/AGRONOMIC_REVIEW.md](docs/AGRONOMIC_REVIEW.md).

## Requirements

- Node.js 22 or newer
- npm (the repository is an npm workspace)

No API key is required. With no hosted key and no running Ollama, every answer comes from the deterministic agent.

## Run it locally

```bash
npm install
cp .env.example .env
cp client/.env.example client/.env
npm run dev
```

Open http://localhost:5173. The API is http://localhost:4000. The Vite dev server proxies `/api` and `/health` to that port.

Leave `VITE_SUPPORT_CONTACT` empty until someone gives you the real support route. Help will say that a contact is not configured. Do not invent an email or a phone number.

| Command | What it does |
|---|---|
| `npm run dev` | API and web UI together |
| `npm run dev:server` | API only, http://localhost:4000 |
| `npm run dev:client` | UI only, http://localhost:5173 |
| `npm test` | Server suite, then client suite |
| `npm run test:server` | Server tests |
| `npm run test:client` | Client tests |
| `npm run build` | Typecheck and build `server/dist` and `client/dist` |
| `npm start` | Serve the built site and the API on one port |
| `npm run seed` | Rebuild the demo market and fertilizer rows |

`npm start` sets `NODE_ENV=production` and `SERVE_CLIENT=1` unless you already set them. Production refuses to start when `FARMEXPERT_DB_PATH` is under the operating-system temp directory.

## A short local check

With the app running, these questions should behave as follows.

| Question | Result |
|---|---|
| My maize is dying. | Extension-officer escalation. No price list. |
| My maize has brown spots. | Same escalation. No diagnosis and no pesticide. |
| How much fertilizer do I need for one acre of maize? | Refusal to prescribe a quantity while the maize rate is illustrative. |
| I have KSh 12,000. Can I plant maize? | A budget question. County and acres are asked for if they were not given. |
| What is the maize price in Nakuru? | Demo maize prices, with the demo notice and a unit. |

The budget form, with 1 acre of maize in Nakuru and KSh 12,000, estimates about KSh 20,000 and KSh 8,000 short while the catalogue assumptions are unchanged. The rate line says the figure is illustrative.

The longer script is [docs/PILOT_TEST_SCRIPT.md](docs/PILOT_TEST_SCRIPT.md).

## Environment

Copy [.env.example](.env.example) to `.env`. The server loads the root `.env`, then `server/.env` if you create one. Values in `server/.env` win. Never commit a filled `.env`.

`VITE_SUPPORT_CONTACT` is the exception. Vite reads it from `client/.env` at build time and bakes it into the JavaScript. Treat every `VITE_` name as public.

| Variable | Class | Purpose |
|---|---|---|
| `PORT` | optional | API port. Default `4000`. |
| `NODE_ENV` | required on the host | `production` on Render. `npm start` sets this if it is empty. |
| `FARMEXPERT_DB_PATH` | optional locally, required for the pilot | SQLite file. Local default in the example is `./data/farmexpert.db`. Pilot value is `/var/data/farmexpert.db`. |
| `ALLOW_EPHEMERAL_DB` | development only | `1` lets production start with a database under the temp directory. Do not set it for the pilot. |
| `FARMEXPERT_BACKUP_DIR` | optional | Directory for `scripts/sqlite-backup.mjs`. Default `./backups`. |
| `SERVE_CLIENT` | required for a single host | `1` so Express serves `client/dist`. `0` is API only. |
| `CLIENT_DIST_PATH` | optional | Built site. Default `client/dist`. |
| `CORS_ORIGIN` | optional | Comma-separated browser origins. Empty when the site and API share a host. |
| `PILOT_REQUIRE_SUPPORT` | pilot only | `1` makes `scripts/check-pilot-env.mjs` fail the build on an unsafe pilot configuration. |
| `VITE_SUPPORT_CONTACT` | pilot only, public | Real support route, in `client/.env`. |
| `DEMO_RESET_TOKEN` | optional | Production secret for `POST /api/demo/reset`. Leave empty so the route stays closed. |
| `AI_REPLY_BUDGET_MS` | optional | How long to wait for a model rephrase. Default `10000`. |
| `API_STYLE` | optional | `openai` or `anthropic`, only if a hosted key is set. |
| `HOSTED_AI_API_KEY`, `HOSTED_AI_BASE_URL`, `HOSTED_AI_MODEL` | development only for this pilot | Hosted rephrase. Leave the key empty. |
| `HOSTED_AI_TIMEOUT_MS`, `HOSTED_AI_MAX_TOKENS` | optional | Hosted request limits. |
| `MODELSCOPE_API_KEY`, `MODELSCOPE_BASE_URL`, `MODELSCOPE_MODEL` | development only for this pilot | Aliases for the hosted provider. A pilot build rejects a key. |
| `OLLAMA_HOST`, `OLLAMA_MODEL` | optional | Local model. `OLLAMA_BASE_URL` is an alias for the host. Leave unset on the pilot host. |
| `SMS_WEBHOOK_TOKEN`, `USSD_WEBHOOK_TOKEN` | development only for this pilot | Shared secrets for a future gateway. Leave unset. The webhooks then return 503. |

Older names `SMARTSHAMBAAI_DB_PATH`, `SHAMBAAI_DB_PATH`, and `DATABASE_PATH` are still accepted if `FARMEXPERT_DB_PATH` is unset.

## How an answer is chosen

One intent detector is shared by the server, the offline agent in the browser, and the SMS simulator. The order is:

1. Agricultural distress, including a dying crop or leaf spots, goes to an extension officer.
2. A request to guarantee yield or profit is refused.
3. A fertilizer quantity question does not become a price list. Unverified bag rates are not prescribed.
4. An affordability question becomes a budget, or a request for the missing crop, county, acres, or amount.
5. Fertilizer price, fertilizer availability, and crop price follow.
6. Help, greeting, then a clarification when the question is unknown.

Numbers come from the catalogue and the demo tables. If a hosted or local model is configured, it may rephrase that reply. A rephrase that drops a number, adds a number, or adds an unauthorized "today", "current", "official", "verified", or "guarantee" claim is discarded, and the template reply is sent instead. The pilot leaves hosted AI off.

## Layout

```text
client/          React, TypeScript, Vite, installable PWA
server/          Express API, SQLite, deterministic agent
scripts/         dev, start, pilot env check, SQLite backup
docs/            Production notes, pilot runbook, facilitator guide
api/             Vercel serverless adapter. Not the pilot host.
render.yaml      Pilot host: one web service and a persistent disk
```

The crop catalogue is `server/src/shared/crops.ts`. The web client imports that file, so the server and the offline agent use the same names, units, and budget defaults.

## HTTP API

The UI calls these. Amounts are Kenyan shillings. A write is limited to 80 requests a minute per address, in memory, on that one process. A restart clears the counter.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | `ok`, `dataMode` (`demo`), `database`, `storage`. 503 when SQLite cannot be queried. No filesystem path and no secrets. |
| `GET` | `/api/status` | Which reply provider is active. |
| `GET` | `/api/crops` | Crop catalogue summary. |
| `GET` | `/api/markets` | Demo prices. Optional `county` and `crop` query. |
| `GET` | `/api/fertilizer` | Demo fertilizer listings. |
| `POST` | `/api/chat` | `{ message, locale }`. Locale is `en` or `sw`. |
| `POST` | `/api/budget` | Planting estimate from crop, county, acres, and budget. |
| `POST` | `/api/feedback` | `helpful` or `not_helpful`, plus an optional comment. No name or phone field. |
| `POST` | `/api/sms` and `/api/ussd/*` | Simulators used by the web UI. |
| `POST` | `/api/providers/sms` and `/api/providers/ussd` | Closed unless the matching webhook token is set. |
| `POST` | `/api/demo/reset` | Open in development. In production, 404 unless `DEMO_RESET_TOKEN` matches the `x-farmexpert-token` header. |

Every response includes `X-Request-Id` (`FE-` and six hex characters). A server failure shown to the farmer is `Something went wrong. Reference: FE-……`. The page does not show a stack trace. Production logs record method, path, status, duration, request id, and, on failure, the error class. They do not record the question.

## Data on the device and on the server

| Data | Where |
|---|---|
| Farm profile | Browser `farmexpert:profile`. Help → Delete farm details removes it. Clearing site data removes it too. |
| Demo prices for offline use | Browser `farmexpert:cache:*`. |
| Demo market and fertilizer rows | SQLite. Reseeded when the market table is empty, and replaced by demo reset. |
| Feedback | SQLite `feedback` for 90 days from the next write. Not tied to a person. There is no per-farmer delete. |
| A question the server failed to answer | SQLite `request_queue`. A successful question is not stored as an account. |
| Caller address for the write limit | Process memory for the current minute only. |

The in-app notice is Help → "What Farm Expert keeps". The operator inventory, including what a privacy reviewer still has to sign, is in [docs/PILOT_RUNBOOK.md](docs/PILOT_RUNBOOK.md). That note is not a claim of legal compliance.

## Backup

On a machine that has the database file:

```bash
FARMEXPERT_DB_PATH=./data/farmexpert.db FARMEXPERT_BACKUP_DIR=./backups node scripts/sqlite-backup.mjs backup
```

Restore only after the server is stopped. Restoring while the process is running lets a live write replace the restored file.

```bash
node scripts/sqlite-backup.mjs restore ./backups/farmexpert-<timestamp>.db
```

The script is covered by the server tests on a temporary file. A backup of a live Render disk has not been run from this repository. Copy the backup off the server the same day. The disk is not an off-site copy.

## Deploy

Render is the pilot host. The blueprint in `render.yaml` is one starter web service and a 1 GB disk mounted at `/var/data`. The free plan has no disk, so it is not the pilot path. Vercel is not the pilot path either: its filesystem does not keep SQLite.

1. In the Render dashboard, create a Blueprint from this repository.
2. When asked, set `VITE_SUPPORT_CONTACT` to the real support route. Leave `HOSTED_AI_API_KEY`, `SMS_WEBHOOK_TOKEN`, and `USSD_WEBHOOK_TOKEN` empty.
3. The build runs `node scripts/check-pilot-env.mjs`, then `npm install` and `npm run build`. Start is `npm start`.
4. Confirm the health check path is `/health` and `FARMEXPERT_DB_PATH` is `/var/data/farmexpert.db`. In the dashboard, the service needs a disk mounted at `/var/data`. Pushing this repository does not attach that disk to an existing service.
5. `GET /health` should report `storage: "persistent"` once that disk is mounted. `storage: "ephemeral"` means the process started on the application data directory because `/var/data` could not be created. That copy is replaced on the next deploy.
6. Follow [docs/PILOT_RUNBOOK.md](docs/PILOT_RUNBOOK.md) before a farmer opens the site. A blueprint file is not proof that HTTPS, the disk, or rollback have been checked.

`vercel.json` remains for a serverless preview. Do not point the pilot at it.

## Tests

```bash
npm test
npm run build
```

Server tests use a temporary SQLite file and force the deterministic agent. They do not call a hosted model. Client tests cover the offline agent, budget math, profile deletion, error text, and the support-contact presentation.

## Documentation

| Document | Who it is for |
|---|---|
| [docs/PRODUCTION.md](docs/PRODUCTION.md) | What the running app does, and what an operator still has to check |
| [docs/PILOT_RUNBOOK.md](docs/PILOT_RUNBOOK.md) | Deploy, health, backup, rollback, privacy inventory, escalation |
| [docs/PILOT_FACILITATOR_GUIDE.md](docs/PILOT_FACILITATOR_GUIDE.md) | What to tell a farmer before the first question |
| [docs/PILOT_TEST_SCRIPT.md](docs/PILOT_TEST_SCRIPT.md) | Manual checks on a phone |
| [docs/AGRONOMIC_REVIEW.md](docs/AGRONOMIC_REVIEW.md) | Where a crop reviewer records approval. Empty means illustrative. |

## Repository

https://github.com/Juniormaina/farmExpert
