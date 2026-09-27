import type { FertilizerType, Locale } from "../shared/types.js";
import { getMaizePrices } from "../agriculture/marketService.js";
import { getFertilizerListings } from "../agriculture/fertilizerService.js";
import { calculateBudget, FertilizerUnavailableError } from "../agriculture/budgetCalculator.js";

type UssdState =
  | "MAIN"
  | "MAIZE_COUNTY"
  | "MAIZE_RESULT"
  | "FERT_TYPE"
  | "FERT_COUNTY"
  | "FERT_RESULT"
  | "BUDGET_COUNTY"
  | "BUDGET_FARM_SIZE"
  | "BUDGET_AMOUNT"
  | "BUDGET_FERT_TYPE"
  | "BUDGET_RESULT"
  | "LANGUAGE"
  | "ENDED";

interface UssdSessionData {
  state: UssdState;
  locale: Locale;
  county?: string;
  farmSizeAcres?: number;
  budgetKsh?: number;
  fertilizerType?: FertilizerType;
}

export interface UssdStepResult {
  text: string;
  done: boolean;
}

const sessions = new Map<string, UssdSessionData>();

const COUNTIES: Array<{ key: string; label: string }> = [
  { key: "1", label: "Nakuru" },
  { key: "2", label: "Uasin Gishu" }
];

const FERT_TYPES: Array<{ key: string; type: FertilizerType }> = [
  { key: "1", type: "DAP" },
  { key: "2", type: "NPK" },
  { key: "3", type: "UREA" },
  { key: "4", type: "CAN" }
];

function t(locale: Locale, en: string, sw: string): string {
  return locale === "sw" ? sw : en;
}

function mainMenu(locale: Locale): string {
  return [
    t(locale, "WELCOME to ShambaAI", "KARIBU ShambaAI"),
    t(locale, "1. Maize price", "1. Bei ya mahindi"),
    t(locale, "2. Fertilizer price", "2. Bei ya mbolea"),
    t(locale, "3. Plan budget", "3. Panga budget"),
    t(locale, "4. Change language", "4. Badilisha lugha"),
    t(locale, "5. Exit", "5. Toka")
  ].join("\n");
}

function countyMenu(locale: Locale): string {
  return [
    t(locale, "Select county:", "Chagua eneo:"),
    "1. Nakuru",
    "2. Eldoret (Uasin Gishu)",
    t(locale, "0. Back", "0. Rudi")
  ].join("\n");
}

function fertTypeMenu(locale: Locale): string {
  return [
    t(locale, "Select fertilizer:", "Chagua mbolea:"),
    "1. DAP",
    "2. NPK",
    "3. UREA",
    "4. CAN",
    t(locale, "0. Back", "0. Rudi")
  ].join("\n");
}

function languageMenu(): string {
  return ["1. English", "2. Kiswahili", "0. Back"].join("\n");
}

function resolveCounty(key: string): string | undefined {
  return COUNTIES.find((c) => c.key === key)?.label;
}

function resolveFertType(key: string): FertilizerType | undefined {
  return FERT_TYPES.find((f) => f.key === key)?.type;
}

export function startUssdSession(sessionId: string, locale: Locale = "en"): UssdStepResult {
  sessions.set(sessionId, { state: "MAIN", locale });
  return { text: mainMenu(locale), done: false };
}

export function stepUssdSession(sessionId: string, input: string): UssdStepResult {
  const session = sessions.get(sessionId) ?? { state: "MAIN" as UssdState, locale: "en" as Locale };
  const trimmed = input.trim();
  const { locale } = session;

  switch (session.state) {
    case "MAIN": {
      if (trimmed === "1") {
        session.state = "MAIZE_COUNTY";
        sessions.set(sessionId, session);
        return { text: countyMenu(locale), done: false };
      }
      if (trimmed === "2") {
        session.state = "FERT_TYPE";
        sessions.set(sessionId, session);
        return { text: fertTypeMenu(locale), done: false };
      }
      if (trimmed === "3") {
        session.state = "BUDGET_COUNTY";
        sessions.set(sessionId, session);
        return { text: countyMenu(locale), done: false };
      }
      if (trimmed === "4") {
        session.state = "LANGUAGE";
        sessions.set(sessionId, session);
        return { text: languageMenu(), done: false };
      }
      if (trimmed === "5") {
        session.state = "ENDED";
        sessions.set(sessionId, session);
        return { text: t(locale, "Thank you for using ShambaAI.", "Asante kwa kutumia ShambaAI."), done: true };
      }
      return { text: t(locale, "Invalid choice.\n", "Chaguo si sahihi.\n") + mainMenu(locale), done: false };
    }

    case "MAIZE_COUNTY": {
      if (trimmed === "0") {
        session.state = "MAIN";
        sessions.set(sessionId, session);
        return { text: mainMenu(locale), done: false };
      }
      const county = resolveCounty(trimmed);
      if (!county) {
        return { text: t(locale, "Invalid choice.\n", "Chaguo si sahihi.\n") + countyMenu(locale), done: false };
      }
      session.county = county;
      const prices = getMaizePrices({ county });
      const lines = prices.map(
        (p) =>
          `${p.market}: KSh ${p.pricePerBag.toLocaleString()}/${p.bagSizeKg}kg (${p.classification})`
      );
      session.state = "MAIZE_RESULT";
      sessions.set(sessionId, session);
      return {
        text: [
          t(locale, `Maize prices - ${county}`, `Bei za mahindi - ${county}`),
          ...lines,
          t(locale, "(DEMO DATA)", "(TAARIFA YA MFANO)"),
          t(locale, "0. Main menu  5. Exit", "0. Menyu kuu  5. Toka")
        ].join("\n"),
        done: false
      };
    }

    case "MAIZE_RESULT":
    case "FERT_RESULT":
    case "BUDGET_RESULT": {
      if (trimmed === "5") {
        session.state = "ENDED";
        sessions.set(sessionId, session);
        return { text: t(locale, "Thank you for using ShambaAI.", "Asante kwa kutumia ShambaAI."), done: true };
      }
      session.state = "MAIN";
      sessions.set(sessionId, session);
      return { text: mainMenu(locale), done: false };
    }

    case "FERT_TYPE": {
      if (trimmed === "0") {
        session.state = "MAIN";
        sessions.set(sessionId, session);
        return { text: mainMenu(locale), done: false };
      }
      const type = resolveFertType(trimmed);
      if (!type) {
        return { text: t(locale, "Invalid choice.\n", "Chaguo si sahihi.\n") + fertTypeMenu(locale), done: false };
      }
      session.fertilizerType = type;
      session.state = "FERT_COUNTY";
      sessions.set(sessionId, session);
      return { text: countyMenu(locale), done: false };
    }

    case "FERT_COUNTY": {
      if (trimmed === "0") {
        session.state = "FERT_TYPE";
        sessions.set(sessionId, session);
        return { text: fertTypeMenu(locale), done: false };
      }
      const county = resolveCounty(trimmed);
      if (!county) {
        return { text: t(locale, "Invalid choice.\n", "Chaguo si sahihi.\n") + countyMenu(locale), done: false };
      }
      const listings = getFertilizerListings({ type: session.fertilizerType, county });
      const lines = listings.map((f) => `${f.supplier}: KSh ${f.pricePerBag.toLocaleString()} (${f.availability})`);
      session.state = "FERT_RESULT";
      sessions.set(sessionId, session);
      return {
        text: [
          t(locale, `${session.fertilizerType} prices - ${county}`, `Bei ya ${session.fertilizerType} - ${county}`),
          ...(lines.length > 0 ? lines : [t(locale, "No listings found.", "Hakuna taarifa.")]),
          t(locale, "(DEMO DATA, fictional suppliers)", "(TAARIFA YA MFANO, wasambazaji wa mfano)"),
          t(locale, "0. Main menu  5. Exit", "0. Menyu kuu  5. Toka")
        ].join("\n"),
        done: false
      };
    }

    case "BUDGET_COUNTY": {
      if (trimmed === "0") {
        session.state = "MAIN";
        sessions.set(sessionId, session);
        return { text: mainMenu(locale), done: false };
      }
      const county = resolveCounty(trimmed);
      if (!county) {
        return { text: t(locale, "Invalid choice.\n", "Chaguo si sahihi.\n") + countyMenu(locale), done: false };
      }
      session.county = county;
      session.state = "BUDGET_FARM_SIZE";
      sessions.set(sessionId, session);
      return { text: t(locale, "Enter farm size in acres:", "Weka ukubwa wa shamba (ekari):"), done: false };
    }

    case "BUDGET_FARM_SIZE": {
      if (trimmed === "0") {
        session.state = "BUDGET_COUNTY";
        sessions.set(sessionId, session);
        return { text: countyMenu(locale), done: false };
      }
      const size = parseFloat(trimmed);
      if (Number.isNaN(size) || size <= 0) {
        return { text: t(locale, "Enter a valid number of acres:", "Weka nambari sahihi ya ekari:"), done: false };
      }
      session.farmSizeAcres = size;
      session.state = "BUDGET_AMOUNT";
      sessions.set(sessionId, session);
      return { text: t(locale, "Enter your budget in KSh:", "Weka bajeti yako kwa shilingi:"), done: false };
    }

    case "BUDGET_AMOUNT": {
      if (trimmed === "0") {
        session.state = "BUDGET_FARM_SIZE";
        sessions.set(sessionId, session);
        return { text: t(locale, "Enter farm size in acres:", "Weka ukubwa wa shamba (ekari):"), done: false };
      }
      const amount = parseFloat(trimmed.replace(/,/g, ""));
      if (Number.isNaN(amount) || amount < 0) {
        return { text: t(locale, "Enter a valid budget amount:", "Weka kiwango sahihi cha bajeti:"), done: false };
      }
      session.budgetKsh = amount;
      session.state = "BUDGET_FERT_TYPE";
      sessions.set(sessionId, session);
      return { text: fertTypeMenu(locale), done: false };
    }

    case "BUDGET_FERT_TYPE": {
      if (trimmed === "0") {
        session.state = "BUDGET_AMOUNT";
        sessions.set(sessionId, session);
        return { text: t(locale, "Enter your budget in KSh:", "Weka bajeti yako kwa shilingi:"), done: false };
      }
      const type = resolveFertType(trimmed);
      if (!type) {
        return { text: t(locale, "Invalid choice.\n", "Chaguo si sahihi.\n") + fertTypeMenu(locale), done: false };
      }
      session.fertilizerType = type;
      try {
        const budget = calculateBudget(
          {
            county: session.county!,
            crop: "maize",
            farmSizeAcres: session.farmSizeAcres!,
            budgetKsh: session.budgetKsh!,
            fertilizerType: type
          },
          locale
        );
        session.state = "BUDGET_RESULT";
        sessions.set(sessionId, session);
        return {
          text: [
            t(locale, "Budget Plan:", "Mpango wa Bajeti:"),
            ...budget.lineItems.map((li) => `${li.label}: KSh ${li.amountKsh.toLocaleString()}`),
            t(locale, `Total: KSh ${budget.totalEstimatedCostKsh.toLocaleString()}`, `Jumla: KSh ${budget.totalEstimatedCostKsh.toLocaleString()}`),
            budget.isShortfall
              ? t(locale, `Shortfall: KSh ${Math.abs(budget.remainingBudgetKsh).toLocaleString()}`, `Upungufu: KSh ${Math.abs(budget.remainingBudgetKsh).toLocaleString()}`)
              : t(locale, `Remaining: KSh ${budget.remainingBudgetKsh.toLocaleString()}`, `Kilichobaki: KSh ${budget.remainingBudgetKsh.toLocaleString()}`),
            t(locale, "0. Main menu  5. Exit", "0. Menyu kuu  5. Toka")
          ].join("\n"),
          done: false
        };
      } catch (err) {
        if (err instanceof FertilizerUnavailableError) {
          return { text: t(locale, "That fertilizer is unavailable in this county.\n", "Mbolea hii haipatikani eneo hili.\n") + fertTypeMenu(locale), done: false };
        }
        throw err;
      }
    }

    case "LANGUAGE": {
      if (trimmed === "0") {
        session.state = "MAIN";
        sessions.set(sessionId, session);
        return { text: mainMenu(locale), done: false };
      }
      if (trimmed === "1") session.locale = "en";
      if (trimmed === "2") session.locale = "sw";
      session.state = "MAIN";
      sessions.set(sessionId, session);
      return { text: mainMenu(session.locale), done: false };
    }

    case "ENDED":
    default: {
      return startUssdSession(sessionId, locale);
    }
  }
}

export function clearUssdSessions(): void {
  sessions.clear();
}
