# Production notes

Farm Expert can be used for internal testing. It is not ready for a public launch or paid customers. Prices are illustrative, SMS and USSD are simulators, and there is no live market feed.

This document separates what the code does from what still needs a provider, a data agreement, or an operator.

## What a farmer can do today

- Ask about supported crop prices, fertilizer, and a planting budget in English or Kiswahili.
- Use the web app, the SMS simulator, or the USSD simulator.
- Keep using bundled prices and the budget calculator when the browser is offline.
- Save an optional farm profile on the device: county, crop, farm size, budget, and language. No account is required.
- Send anonymous feedback (helpful / not helpful, plus an optional comment).

The supported crops are maize, beans, potatoes, tomatoes, tea, and sukuma wiki. The supported counties in the demo set are Nakuru, Eldoret (Uasin Gishu), and Kericho.

## Data

Every shipped price and fertilizer listing is demo data:

- `isDemoData` is true
- `freshness` is `illustrative`
- the source string names the Farm Expert demo dataset
- `lastUpdated` is the time the demo database was seeded, not a market collection date

The interface must say there is no market collection date on file. A future verified record can set `freshness` to `verified`, `isDemoData` to false, and a real `lastUpdated`. Do not invent a source or a date to fill that in.

Budget totals are estimates from the crop's stated per-acre assumptions (seed, labour, land preparation, and fertilizer bags). They are not a profit forecast and not a guaranteed yield. The reply includes a disclaimer to check rates with a soil test or an agricultural extension officer.

## AI

Numbers come from the calculation code and the stored records. An optional language model may rephrase a reply. If that rephrasing drops a number, adds a number, or adds a claim such as "today", "current", "verified", "official", or "guaranteed" that the template did not authorize, the server drops it and sends the template reply instead. Hosted AI stays off unless an API key is set outside this repository.

A crop name does not decide the answer. Symptom and distress questions, including a dying crop or leaf spots without the word "disease", are escalated to an extension officer. The reply does not diagnose, name a pesticide, or give a dose. Fertilizer quantity questions are not answered with a price list. The bag rates in the catalogue are illustrative, not approved application rates, so the assistant refuses to prescribe a quantity. A budget is calculated only when crop, county, acreage, and budget are all present. Missing pieces are asked for. Yield and profit are not guaranteed.

## Accounts

There are no user accounts. A farmer can use the tools without signing up. The optional profile stays in `localStorage` under `farmexpert:profile`.

## Privacy

| Information | Why | Where | How long | Shared |
|---|---|---|---|---|
| Farm profile (county, crop, size, budget, language) | Prefill the tools | This browser only | Until the farmer deletes it or clears site data | Not sent as a profile |
| Questions sent from the web app | To produce an answer | Server memory for that request. Offline questions wait in this browser until they can be sent | Not stored as an account | Not sold. An optional AI provider receives the question text only when that provider is configured |
| Feedback rating and optional comment | To learn whether an answer helped | SQLite `feedback` table | 90 days, then deleted on the next feedback write | No name or phone number is accepted |
| Cached prices | Offline use | This browser | Until overwritten or site data is cleared | Stays on the device |

The Help screen explains this and has **Delete farm details**. That removes the profile from the browser. It does not delete a feedback row already stored on the server, because feedback is not tied to a person.

Do not put a name or phone number in a feedback comment. The API rejects a payload that includes a phone field.

This is not a legal opinion on the Kenya Data Protection Act. Before a public release, have a qualified person review the actual data flows, the chosen host, and any contract with an AI or SMS provider.

Support contact is `VITE_SUPPORT_CONTACT`, read when the web app is built. If it is empty, Help says a contact is not configured. Do not invent an email or phone number.

## SMS

The SMS tab is a simulator. It calls `POST /api/sms` inside this app. It is not connected to a phone network.

A real gateway can call `POST /api/providers/sms` only after `SMS_WEBHOOK_TOKEN` is set to a long random value:

```http
POST /api/providers/sms
Content-Type: application/json
x-farmexpert-token: <SMS_WEBHOOK_TOKEN>

{ "sessionId": "gateway-session", "text": "Bei ya mahindi Nakuru?", "locale": "sw" }
```

- If the token is unset, the route returns `503` and `{ "configured": false }`.
- A wrong token returns `401`.
- A body that contains `from`, `msisdn`, `phone`, `phoneNumber`, or `sender` returns `400`. Keep the phone number in the gateway. Send only a session id.
- The JSON response is the same shape as the simulator (`agentText`, `history`, `response`).

The gateway adapter (Africa's Talking, a telco, or another provider) is not included. Write that adapter in the provider's own process and do not claim live SMS until a real handset has received a reply.

## USSD

The USSD tab is a simulator. A real gateway can call `POST /api/providers/ussd` after `USSD_WEBHOOK_TOKEN` is set:

```http
POST /api/providers/ussd
Content-Type: application/json
x-farmexpert-token: <USSD_WEBHOOK_TOKEN>

{ "sessionId": "gateway-session", "locale": "sw" }
```

Send `input` on later requests (`"1"`, `"0"`, an acre count, or a budget). An empty or missing `input` starts the menu. Do not send a phone number. Session state is kept in server memory, so a restart ends open sessions. Responses are short menus. `done: true` means the session should close.

Do not claim live USSD until a provider session has been tested on a handset.

## Security

- Security headers: `nosniff`, `SAMEORIGIN`, `no-referrer`, a Permissions-Policy that disables camera, microphone, and location, and a Content-Security-Policy. Styles allow inline CSS because the budget bar sets its width that way. Scripts do not.
- CORS is off unless `CORS_ORIGIN` lists the browser origins. Same-host deployment does not need it.
- `POST` chat, SMS, USSD, feedback, provider webhooks, demo reset, and queue processing are limited to 80 requests per minute per IP, in memory. A second server process has its own counter.
- Chat and SMS text are capped at 800 characters.
- API errors returned to the farmer do not include a stack trace.
- Production request logs are method, path, status, and duration. They do not include the question text.

## Operations

`GET /health` returns `ok`, `dataMode: "demo"`, `database`, and `storage`. It does not include paths or secrets. `database` is `unavailable` and `ok` is false when SQLite cannot be queried. Render uses that path.

Each API response has an `X-Request-Id` header (`FE-` plus six hex characters). A server failure shown to the farmer is `Something went wrong. Reference: FE-……` and does not include a stack trace. Production logs are timestamped by the host and contain method, path, status, duration, request id, and, on failure, the error class. They do not include the question text, a phone number, or the farm profile.

`POST /api/demo/reset` works in development. In production it returns 404 unless `DEMO_RESET_TOKEN` is set and the request sends the same value in `x-farmexpert-token`. The production web build does not show the reset button. Resetting demo prices does not delete feedback.

Rate limits are an in-memory counter on one process: 80 writes per minute per IP. A restart clears the counter. That is enough for one pilot instance. It is not a shared limit across multiple servers.

Structured request logs are written only when `NODE_ENV=production`.

There is no product analytics. Do not add a tracker in order to "see usage" without a separate decision.

The pilot database path is `/var/data/farmexpert.db` on a Render disk (`render.yaml`). That path is outside `/tmp`, so production will start. A path under the OS temp directory is refused in production unless `ALLOW_EPHEMERAL_DB=1`. The farm profile stays on the device. Feedback is the server row that must survive a restart. See `docs/PILOT_RUNBOOK.md` for backup, restore, and rollback. Those host checks are not the same as a passing local test.

## Environment

Copy `.env.example` to `.env` in the repository root. The server reads that file first. `server/.env` is an optional override and wins when both exist. Put `VITE_SUPPORT_CONTACT` in `client/.env`, from `client/.env.example`. Never commit `.env`.

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | No | API port. Default 4000 |
| `FARMEXPERT_DB_PATH` | Pilot | SQLite file. Pilot uses `/var/data/farmexpert.db`. `/tmp` is refused in production |
| `PILOT_REQUIRE_SUPPORT` | Pilot build | `1` makes `scripts/check-pilot-env.mjs` require a real support contact and a persistent database path |
| `DEMO_RESET_TOKEN` | No | Production secret for demo reset. Leave empty so the route stays closed |
| `ALLOW_EPHEMERAL_DB` | Development only | `1` lets production start with a temp database. Do not set this for the pilot |
| `SERVE_CLIENT` | Production | `1` so Express serves `client/dist` |
| `CORS_ORIGIN` | No | Comma-separated allowed origins. Leave empty for same-host |
| `SMS_WEBHOOK_TOKEN` | For a real SMS gateway | Shared secret. Leave empty until then |
| `USSD_WEBHOOK_TOKEN` | For a real USSD gateway | Shared secret. Leave empty until then |
| `OLLAMA_HOST`, `OLLAMA_MODEL` | No | Optional local model |
| `HOSTED_AI_API_KEY`, `HOSTED_AI_BASE_URL`, `HOSTED_AI_MODEL`, `API_STYLE` | No | Optional hosted rephrasing |
| `AI_REPLY_BUDGET_MS` | No | How long to wait for rephrasing before the template reply |
| `VITE_SUPPORT_CONTACT` | Pilot | Support route, baked into the website at build time. Visible to anyone who opens the site. Do not put a secret here |

## Deploy

1. Set the variables above on the host. Do not put secrets in the repository.
2. `npm ci` and `npm run build` on Node 22 or newer.
3. Start with `npm start` (`SERVE_CLIENT=1`). The process serves the built site and the API on one port, over HTTPS at the host.
4. Confirm `GET /health` returns `dataMode: "demo"`.
5. Open the site and complete one budget, one fertilizer comparison, and one refused disease question.
6. To roll back the application, redeploy the previous build, then follow `docs/PILOT_RUNBOOK.md`. Schema version 1 only adds `schema_meta`. A rollback of the app does not delete feedback. A rollback has not been executed on a live host from this repository.

`render.yaml` is the pilot path: one starter web service and a 1 GB disk at `/var/data`. Vercel is not the pilot host, because its filesystem does not keep SQLite. A custom domain, HTTPS, and an off-site backup still have to be checked on the real host.

## Business models

None of these are implemented. They are options to decide later:

- A free farmer tier for the calculators, with demo or licensed prices.
- A paid planning tier for cooperatives that want saved plans on a server.
- A cooperative or agribusiness subscription that pays for a live price feed.
- An input-supplier partnership, only with a contract that keeps advertising separate from the calculation.
- A B2B or API licence for the deterministic calculators.

Do not add payments until one of these is chosen and the price data is allowed to be shown to those customers.

## Launch

1. **Internal testing.** Use this build. Treat every price as a demo estimate.
2. **Small farmer pilot.** Only after a person who knows the local crops has checked the budget assumptions, a support contact is configured, and the host has HTTPS, logs, and a rollback. Still say the prices are estimates unless a real feed is connected.
3. **Public beta.** Needs a licensed or official price source with dates, a reviewed privacy notice, monitoring, and a way to reach support. SMS and USSD stay simulators unless a gateway is connected and tested.
4. **Commercial launch.** Needs the beta items plus a chosen business model, a data agreement, backups if any farmer data moves to the server, and extension review of the recommendations.
