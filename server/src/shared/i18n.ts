import type { Locale } from "./types.js";

export const DEMO_DATA_NOTICE: Record<Locale, string> = {
  en: "DEMO DATA: Illustrative prices, not a verified live market quote.",
  sw: "TAARIFA YA MFANO: Bei za mfano, si bei halisi ya sokoni kwa sasa."
};

export const AGRONOMIC_DISCLAIMER: Record<Locale, string> = {
  en: "These fertilizer application rates are illustrative, not universal agronomic advice. Confirm actual rates with a soil test or your local agricultural extension officer.",
  sw: "Kiwango cha mbolea kilichotajwa ni cha mfano tu, si ushauri wa kilimo unaofaa kila shamba. Thibitisha kiwango sahihi kwa kupima udongo au kushauriana na afisa ugani."
};

export const UI_STRINGS: Record<Locale, Record<string, string>> = {
  en: {
    productName: "ShambaAI",
    tagline: "Farming decisions, made simpler.",
    subtitle: "Ask about maize prices, fertilizer costs, and your planting budget, even when connectivity is limited.",
    greeting: "Habari! I'm ShambaAI. Ask me about maize prices, fertilizer costs, or your planting budget.",
    help: "You can ask things like: 'What is the maize price in Nakuru?', 'How much is DAP fertilizer?', or 'I have KSh 12,000 for 1 acre, help me plan.'"
  },
  sw: {
    productName: "ShambaAI",
    tagline: "Maamuzi ya kilimo, kwa urahisi zaidi.",
    subtitle: "Uliza bei ya mahindi, gharama ya mbolea, na bajeti ya kupanda, hata mtandao ukiwa mbovu.",
    greeting: "Habari! Mimi ni ShambaAI. Niulize kuhusu bei ya mahindi, gharama ya mbolea, au bajeti ya kupanda.",
    help: "Unaweza kuuliza kama: 'Bei ya mahindi Nakuru ni ngapi?', 'Bei ya mbolea DAP ni ngapi?', au 'Nina shilingi 12,000 kwa ekari moja, nisaidie kupanga.'"
  }
};
