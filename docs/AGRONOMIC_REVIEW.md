# Agronomic review

Farm Expert will not prescribe a fertilizer quantity until a person who knows the crop marks that crop's rate as verified.

## Where the rate lives

`server/src/shared/crops.ts`

Each crop has `budgetDefaults.fertilizerBagsPerAcre` and an optional `rateStatus`.

- Omitted, or `"illustrative"`: the Ask path refuses to prescribe a quantity. The budget calculator may still use the number as a planning estimate, and the reply says the rate is illustrative.
- `"verified"`: only after the sign-off below. The Ask path may then calculate bags from that approved per-acre rate.

Every crop in this repository is illustrative. Do not change that to make a demo look finished.

## Sign-off

The reviewer writes their name and date here. An empty row means the rate is not approved.

| Crop | Bags per acre | Fertilizer | Status | Reviewer | Date | Notes |
|---|---|---|---|---|---|---|
| Maize | 2 | DAP | illustrative | | | |
| Beans | 1 | DAP | illustrative | | | |
| Potatoes | 4 | DAP | illustrative | | | |
| Tomatoes | 3 | DAP | illustrative | | | |
| Tea | 4 | NPK | illustrative | | | Established bushes. No seed or land-prep cost. |
| Sukuma wiki | 2 | DAP | illustrative | | | |

Seed, labour, and land-preparation amounts in the same file are planning estimates, not approved recommendations.

## What the product must not do before this table is signed

- Name a disease from a text description.
- Recommend a pesticide or a dose.
- Guarantee yield or profit.
- Call a demo price today's price, an official price, or a verified market price.
