# Farm Expert pilot runbook

Pilot shape: 8–12 farmers, Nakuru, maize, web only, two weeks, a facilitator in the room. SMS off. USSD off. Hosted AI off. Demo prices stay demo prices.

This is an operator checklist. It is not a claim that the live host has already been checked.

## Roles

Fill these in before the first farmer session. Do not invent a person.

| Role | Name | How to reach them |
|---|---|---|
| Technical owner | [NAME] | [CONTACT] |
| Agricultural reviewer / extension officer | [NAME] | [CONTACT] |
| Privacy reviewer | [NAME] | [CONTACT] |
| Pilot support contact | [same value as `VITE_SUPPORT_CONTACT`] | [CONTACT] |

Escalation:

- Application failure → technical owner
- Agronomic concern, diagnosis, or pesticide question → agricultural reviewer / extension officer
- Privacy concern → privacy reviewer
- A farmer needs help with the phone or the answer → pilot support contact, with the facilitator

## Environment variables

| Variable | Class | Pilot value |
|---|---|---|
| `NODE_ENV` | required | `production` |
| `SERVE_CLIENT` | required | `1` |
| `CLIENT_DIST_PATH` | required | `./client/dist` |
| `FARMEXPERT_DB_PATH` | required | `/var/data/farmexpert.db` |
| `PILOT_REQUIRE_SUPPORT` | pilot only | `1` |
| `VITE_SUPPORT_CONTACT` | pilot only, client-visible | The real support route. Not a secret. |
| `PORT` | optional | Host default |
| `CORS_ORIGIN` | optional | Empty when the site and API share a host |
| `AI_REPLY_BUDGET_MS` | optional | `10000` |
| `DEMO_RESET_TOKEN` | optional | Empty, unless an operator must rebuild demo prices |
| `HOSTED_AI_API_KEY` | development only for this pilot | Empty |
| `SMS_WEBHOOK_TOKEN` | development only for this pilot | Empty |
| `USSD_WEBHOOK_TOKEN` | development only for this pilot | Empty |
| `ALLOW_EPHEMERAL_DB` | development only | Unset |
| `OLLAMA_HOST` | optional | Unset on the pilot host |

`VITE_*` values are visible in the website. Do not put an API key there.

## Database

| Question | Answer |
|---|---|
| Where does it live? | SQLite at `FARMEXPERT_DB_PATH`. The pilot blueprint mounts a Render disk at `/var/data`. If that directory cannot be created, the process starts on the application data directory and `/health` reports `storage: "ephemeral"`. That copy does not survive a deploy. |
| What is stored? | Demo market and fertilizer rows, a request queue, feedback (rating, optional comment, context, time), and `schema_meta` version `1`. |
| What is not stored? | The farm profile. That stays in the browser under `farmexpert:profile`. Questions are not kept as an account. |
| Process restart | Files on the disk remain. In-memory rate limits and USSD simulator sessions do not. USSD is not part of the pilot. |
| Deployment | Render keeps files under the disk mount. Files outside it are replaced. |
| Host restart | Render's disk documentation says the mount survives an instance restart. **NOT VERIFIED** on this project's live host. |
| Schema | Startup creates missing tables. The only destructive step rebuilds a pre-multi-crop `market_prices` table that has no `unit` column. Feedback is not dropped. Demo reset deletes prices, fertilizer rows, and the queue. It does not delete feedback. |
| Rollback and schema | Version 1 adds `schema_meta`. An older build ignores that table. Rolling the app back does not delete feedback. |

### Backup

| Question | Answer |
|---|---|
| What | The SQLite file, including feedback and demo rows |
| Where | `FARMEXPERT_BACKUP_DIR`, or `./backups` if unset. Copy that file off the server the same day. The disk is not an off-site backup. |
| How often | Once before the pilot starts, then at the end of each pilot day |
| Who | Technical owner |
| Command | `FARMEXPERT_DB_PATH=/var/data/farmexpert.db FARMEXPERT_BACKUP_DIR=/var/data/backups node scripts/sqlite-backup.mjs backup` |
| Restore | Stop the process. `node scripts/sqlite-backup.mjs restore <backup-file>`. Start the process. Open `/health`, ask one price question, and confirm a known feedback row if one existed. |
| Proof | The restore function is covered by `server/tests/operations.test.ts` on a temporary file. A restore on the live Render disk is **NOT VERIFIED**. |

Status: backup command **IMPLEMENTED**. Local restore **TESTED**. Live-host backup **NOT VERIFIED**.

## Before the pilot

1. Deploy the blueprint. Confirm the service plan can attach the disk. The free plan cannot.
2. Open the site with HTTPS. Record the URL. **HTTPS and the domain are NOT VERIFIED from this repository.**
3. `GET /health` returns `ok: true`, `dataMode: "demo"`, `database: "ok"`, `storage: "persistent"`.
4. Help shows the real support contact, not "not configured".
5. Run the backup command and copy the file off the server.
6. Read the rollback section. A live rollback is **NOT VERIFIED** until someone does it once on a staging service.
7. Ask "What is maize selling for in Nakuru?" and confirm the demo notice.
8. Confirm `HOSTED_AI_API_KEY` is empty. Status should show the deterministic provider.
9. `POST /api/providers/sms` and `POST /api/providers/ussd` return 503.
10. `POST /api/demo/reset` without the admin token returns 404.
11. On a phone: no horizontal scrolling, English and Kiswahili both load, Help opens.
12. Walk `docs/PILOT_TEST_SCRIPT.md` with the facilitator.

## During the pilot

Watch:

- `/health` once a day, and after any deploy
- Host logs for `"level":"error"` or status 500. Use the `requestId` if a farmer reports a reference `FE-……`
- Support requests
- Answers the facilitator thinks are wrong, especially diagnosis, pesticide, or "today's price"
- Confusion about demo prices

Do not log farmer questions, phone numbers, or farm profiles. The app does not log request bodies.

## If something goes wrong

1. Stop directing farmers to the site. Tell the facilitator.
2. Note the time, the URL, and any `FE-` reference. Do not copy the farmer's question into a public ticket.
3. Escalate with the table at the top of this file.

### Rollback

**ROLLBACK NOT VERIFIED** on a live host. The procedure is:

1. Detect the bad deployment from health, errors, or a facilitator report.
2. Stop directing farmers to it.
3. In the host dashboard, find the last known-good build (the previous successful deploy).
4. Redeploy that build. Do not change `FARMEXPERT_DB_PATH`.
5. `GET /health` shows `database: "ok"` and `dataMode: "demo"`.
6. Ask "My maize is dying." Expect an extension-officer reply and no price list.
7. Run the one-acre maize budget for Nakuru at KSh 12,000. Expect about KSh 20,000 estimated and KSh 8,000 short, while the catalogue rates are unchanged.
8. Open maize prices for Nakuru and confirm the demo notice.
9. Open Help and confirm the support contact.
10. Resume the pilot only after the facilitator has repeated those four checks.

If the bad deploy corrupted the database, restore the latest off-site backup with the command above before resuming. That restore has been tested on a local file, not on the host.

## Privacy inventory

This is a description of the pilot, not a legal opinion and not a claim of compliance with the Kenya Data Protection Act, GDPR, or any agricultural regulation. A qualified reviewer still has to read it.

| Data | Necessary for the pilot? | Where | Retention | Deletion | Sent outside the server? |
|---|---|---|---|---|---|
| County, crop, acres, budget, language | Optional, on the device, to shorten forms | Browser `farmexpert:profile` | Until the farmer deletes it or clears site data | Help → Delete farm details, or the browser's site-data control | No |
| A successful question | Yes, to answer once | In the request, then the reply. Not stored as an account. Production logs record the path, not the question text | The request only | Not kept after the reply | No, while hosted AI is off |
| A question the server failed to answer | Only so a later retry can run | SQLite `request_queue`, as JSON with channel and time | Kept after a retry is marked done. Removed by demo reset or by deleting the database file | Not per farmer | No, while hosted AI is off |
| Demo prices saved for offline use | Yes, so the phone can answer without the network | Browser `farmexpert:cache:markets`, `farmexpert:cache:fertilizer`, `farmexpert:cache:status` | Until the browser drops them or the farmer clears site data | Clearing site data | No |
| Feedback rating, optional comment, context, time | Optional | SQLite `feedback` | 90 days from the next write. Not tied to a person. There is no name or phone field | Age-based, for every row. There is no per-farmer delete | No |
| Caller address for the write limit | Yes, to slow repeated writes | Process memory, 80 writes per minute. A restart clears it | The current minute | Restart | The host sees the connection. The app does not write the address to SQLite |
| Request id, method, path, status, duration, error class | Yes, to see failures | Host logs | Whatever the host keeps | Host log retention | The host's own logging |
| Demo prices | Yes, as labelled illustrations | SQLite, reseeded | Replaced by demo reset or a fresh seed | Demo reset, or delete the database file | No |

Hosted AI is off for this pilot. If a key were set later, the question text would be sent to that provider. The pilot build check rejects a key. The web pilot does not ask for a phone number. Provider routes reject phone fields.

The in-app notice is Help → "What Farm Expert keeps". It says the profile stays on the phone, questions are sent to answer and are not stored as an account, feedback lasts about 90 days and is not tied to a name, demo prices are not a live quote, and Farm Expert is not a substitute for an extension officer. The notice does not yet mention the failed-question queue.

### Privacy reviewer checklist

Status: **NOT REVIEWED**. An empty row is not an approval.

| Check | Reviewer | Date |
|---|---|---|
| The table above matches what the pilot build actually stores | | |
| The failed-question queue is acceptable for 8–12 farmers | | |
| Feedback without a per-person delete is acceptable | | |
| Hosted AI, SMS, and USSD stay off | | |
| The in-app notice is plain enough for the facilitator to read aloud | | |

## Channels that stay off

- SMS is a labelled simulator. The provider webhook stays closed without `SMS_WEBHOOK_TOKEN`. No farmer phone number is required.
- USSD is not part of the pilot. Simulator sessions are in memory and disappear on restart. That is acceptable because farmers will not use USSD.
- Hosted AI stays off.
