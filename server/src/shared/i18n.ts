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
    productName: "Farm Expert",
    tagline: "Farming decisions, made simpler.",
    subtitle: "Ask about crop prices, fertilizer costs, and your planting budget, even when connectivity is limited.",
    greeting: "Habari! I'm Farm Expert. Ask me about crop prices, fertilizer costs, or your planting budget.",
    help: "I can help with maize, beans, Irish potatoes, tomatoes, tea and sukuma wiki. Try: 'What is the maize price in Nakuru?', 'Tomato prices in Eldoret?', 'How much is DAP fertilizer?', or 'I have KSh 12,000 for 1 acre of beans in Nakuru, help me plan.'",
    outOfScope:
      "I don't have enough reliable information to answer that safely. I can calculate crop prices, fertilizer costs, and planting budgets. For crop disease or pests, ask an agricultural extension officer.",
    clarify: "I can help with crop planning, market prices, fertilizer prices, or a farm budget. Which one do you need?",
    distress:
      "I can't reliably identify what is affecting {crop} from this description alone. Symptoms like these can have different causes. Please speak with an agricultural extension officer or agronomist before applying any pesticide or other chemical. Tell them your county, the crop stage, when the problem started, and whether it is spreading. I can note what you see, but I cannot diagnose it or recommend a dose.",
    unverifiedRate:
      "I don't have a verified agronomic rate for this recommendation yet. I can compare the demo fertilizer prices, but I don't want to guess how much you should apply. Please confirm the recommended rate with an agricultural extension officer.",
    noGuarantee:
      "Farm Expert cannot guarantee yield or profit. Results depend on weather, soil, management, input costs, pests, and market prices. I can still help you estimate a planting budget or compare demo fertilizer prices."
  },
  sw: {
    productName: "Farm Expert",
    tagline: "Maamuzi ya kilimo, kwa urahisi zaidi.",
    subtitle: "Uliza bei za mazao, gharama ya mbolea, na bajeti ya kupanda, hata mtandao ukiwa mbovu.",
    greeting: "Habari! Mimi ni Farm Expert. Niulize kuhusu bei za mazao, gharama ya mbolea, au bajeti ya kupanda.",
    help: "Naweza kusaidia na mahindi, maharagwe, viazi, nyanya, majani chai na sukuma wiki. Jaribu: 'Bei ya mahindi Nakuru ni ngapi?', 'Bei ya nyanya Eldoret?', 'Bei ya mbolea DAP ni ngapi?', au 'Nina shilingi 12,000 kwa ekari moja ya maharagwe Nakuru, nisaidie kupanga.'",
    outOfScope:
      "Sina taarifa za kuaminika za kujibu hilo kwa usalama. Ninaweza kukokotoa bei za mazao, gharama ya mbolea, na bajeti ya kupanda. Kwa ugonjwa wa mazao au wadudu, ongea na afisa ugani.",
    clarify: "Naweza kusaidia kupanga zao, bei za sokoni, bei za mbolea, au bajeti ya shamba. Unahitaji lipi?",
    distress:
      "Siwezi kutambua kwa uhakika kinachoathiri {crop} kutokana na maelezo haya pekee. Dalili kama hizi zinaweza kuwa na visababishi tofauti. Ongea na afisa ugani au mtaalamu wa kilimo kabla ya kutumia dawa yoyote. Mwambie eneo lako, hatua ya zao, lini tatizo lilianza, na kama linaenea. Siwezi kutambua ugonjwa wala kupendekeza kipimo cha dawa.",
    unverifiedRate:
      "Bado sina kiwango cha mbolea kilichothibitishwa na mtaalamu kwa pendekezo hili. Ninaweza kulinganisha bei za mfano za mbolea, lakini sitaki kukisia kiasi unachopaswa kuweka. Thibitisha kiwango na afisa ugani.",
    noGuarantee:
      "Farm Expert haiwezi kuhakikisha mavuno wala faida. Matokeo hutegemea hali ya hewa, udongo, utunzaji, gharama za pembejeo, wadudu, na bei za soko. Bado naweza kukusaidia kukadiria bajeti ya kupanda au kulinganisha bei za mfano za mbolea."
  }
};
