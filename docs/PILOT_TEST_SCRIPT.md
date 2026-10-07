# Pilot test script

Run this on a phone before farmers arrive. Use the deployed site, not only a laptop.

## Home

- Load the site on a phone. The page fits the screen without sideways scrolling.
- Move between Ask, Prices, Fertilizer, and Budget.
- Open the menu. Focus is visible on the keyboard if you use one.
- Switch to Kiswahili and back to English. The demo notice is still present in both languages.

## Ask

| Question | Expect |
|---|---|
| My maize is dying. | Directs to an extension officer. No price list. |
| My maize has brown spots. | Refuses to diagnose. No pesticide dose. |
| How much fertilizer do I need for one acre? | Refuses to prescribe a quantity while the maize rate is illustrative. |
| I have KSh 12,000. Can I plant maize? | A planning budget, not a guarantee. |
| What is maize selling for in Nakuru? | Demo maize prices, with the demo notice. |
| Which fertilizer is cheapest? | A demo comparison, with the demo notice. |

## Budget

1 acre, maize, Nakuru, KSh 12,000.

While the catalogue assumptions are unchanged, expect about KSh 20,000 estimated and KSh 8,000 short. The result says the rates are illustrative.

## Offline

Turn the network off and ask a price question. The page shows the offline reply and does not invent a live price. Turn the network back on.

## Help

Open Help. The support contact is the real route. The privacy paragraph is visible in the language you selected.

## Delete farm details

Save a county in the profile, then Help → Delete farm details. The county field is empty again. Clearing the browser's site data also removes `farmexpert:profile`.

## Errors

A failed request shows a short sentence. A server failure may include `Reference: FE-` and six characters. The page does not show a stack trace or an internal exception message.
