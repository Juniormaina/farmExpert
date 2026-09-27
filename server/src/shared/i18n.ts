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
    productName: "SmartShambaAI",
    tagline: "Farming decisions, made simpler.",
    subtitle: "Ask about crop prices, fertilizer costs, and your planting budget, even when connectivity is limited.",
    greeting: "Habari! I'm SmartShambaAI. Ask me about crop prices, fertilizer costs, or your planting budget.",
    help: "I can help with maize, beans, Irish potatoes, tomatoes, tea and sukuma wiki. Try: 'What is the maize price in Nakuru?', 'Tomato prices in Eldoret?', 'How much is DAP fertilizer?', or 'I have KSh 12,000 for 1 acre of beans in Nakuru, help me plan.'"
  },
  sw: {
    productName: "SmartShambaAI",
    tagline: "Maamuzi ya kilimo, kwa urahisi zaidi.",
    subtitle: "Uliza bei za mazao, gharama ya mbolea, na bajeti ya kupanda, hata mtandao ukiwa mbovu.",
    greeting: "Habari! Mimi ni SmartShambaAI. Niulize kuhusu bei za mazao, gharama ya mbolea, au bajeti ya kupanda.",
    help: "Naweza kusaidia na mahindi, maharagwe, viazi, nyanya, majani chai na sukuma wiki. Jaribu: 'Bei ya mahindi Nakuru ni ngapi?', 'Bei ya nyanya Eldoret?', 'Bei ya mbolea DAP ni ngapi?', au 'Nina shilingi 12,000 kwa ekari moja ya maharagwe Nakuru, nisaidie kupanga.'"
  }
};
