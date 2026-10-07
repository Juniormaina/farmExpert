import type { CropId, FertilizerType, Locale } from "../shared/types.js";
import { COUNTIES, CROPS, getCrop } from "../shared/crops.js";
import { availabilityLabel, cropName, formatKsh, formatUnitPrice } from "../shared/format.js";
import { getCropPrices } from "../agriculture/marketService.js";
import { getFertilizerListings } from "../agriculture/fertilizerService.js";
import { calculateBudget, FertilizerUnavailableError } from "../agriculture/budgetCalculator.js";

type UssdState =
  | "MAIN"
  | "PRICE_CROP"
  | "PRICE_COUNTY"
  | "FERT_TYPE"
  | "FERT_COUNTY"
  | "BUDGET_CROP"
  | "BUDGET_COUNTY"
  | "BUDGET_FARM_SIZE"
  | "BUDGET_AMOUNT"
  | "BUDGET_FERT_TYPE"
  | "RESULT"
  | "LANGUAGE"
  | "ENDED";

interface UssdSessionData {
  state: UssdState;
  locale: Locale;
  crop?: CropId;
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
const FERT_TYPES: FertilizerType[] = ["DAP", "NPK", "UREA", "CAN"];

function t(locale: Locale, en: string, sw: string): string {
  return locale === "sw" ? sw : en;
}

function numbered<T>(items: T[], label: (item: T) => string): string[] {
  return items.map((item, i) => `${i + 1}. ${label(item)}`);
}

function pick<T>(items: T[], input: string): T | undefined {
  const n = Number(input);
  return Number.isInteger(n) && n >= 1 && n <= items.length ? items[n - 1] : undefined;
}

function mainMenu(locale: Locale): string {
  return [
    t(locale, "WELCOME to Farm Expert", "KARIBU Farm Expert"),
    t(locale, "1. Crop prices", "1. Bei za mazao"),
    t(locale, "2. Fertilizer price", "2. Bei ya mbolea"),
    t(locale, "3. Plan budget", "3. Panga bajeti"),
    t(locale, "4. Change language", "4. Badilisha lugha"),
    t(locale, "5. Exit", "5. Toka")
  ].join("\n");
}

function cropMenu(locale: Locale): string {
  return [t(locale, "Select crop:", "Chagua zao:"), ...numbered(CROPS, (c) => c.name[locale]), t(locale, "0. Back", "0. Rudi")].join("\n");
}

function countyMenu(locale: Locale): string {
  return [
    t(locale, "Select county:", "Chagua eneo:"),
    ...numbered(COUNTIES, (c) => (c.label === c.value ? c.label : `${c.label} (${c.value})`)),
    t(locale, "0. Back", "0. Rudi")
  ].join("\n");
}

function fertTypeMenu(locale: Locale, usualFor?: CropId): string {
  const usual = usualFor
    ? [t(locale, `Usual for ${cropName(usualFor, "en")}: ${getCrop(usualFor).defaultFertilizer}`, `Kawaida kwa ${cropName(usualFor, "sw")}: ${getCrop(usualFor).defaultFertilizer}`)]
    : [];
  return [t(locale, "Select fertilizer:", "Chagua mbolea:"), ...usual, ...numbered(FERT_TYPES, (f) => f), t(locale, "0. Back", "0. Rudi")].join("\n");
}

function languageMenu(locale: Locale): string {
  return ["1. English", "2. Kiswahili", t(locale, "0. Back", "0. Rudi")].join("\n");
}

const farmSizePrompt = (locale: Locale) => t(locale, "Enter farm size in acres:", "Weka ukubwa wa shamba (ekari):");
const budgetPrompt = (locale: Locale) => t(locale, "Enter your budget in KSh:", "Weka bajeti yako kwa shilingi:");
const resultFooter = (locale: Locale) => t(locale, "0. Main menu  5. Exit", "0. Menyu kuu  5. Toka");
const invalid = (locale: Locale) => t(locale, "Invalid choice.\n", "Chaguo si sahihi.\n");
const goodbye = (locale: Locale) => t(locale, "Thank you for using Farm Expert.", "Asante kwa kutumia Farm Expert.");

export function startUssdSession(sessionId: string, locale: Locale = "en"): UssdStepResult {
  sessions.set(sessionId, { state: "MAIN", locale });
  return { text: mainMenu(locale), done: false };
}

export function stepUssdSession(sessionId: string, input: string): UssdStepResult {
  const session = sessions.get(sessionId) ?? { state: "MAIN" as UssdState, locale: "en" as Locale };
  sessions.set(sessionId, session);
  const choice = input.trim();
  const { locale } = session;

  const go = (state: UssdState, text: string): UssdStepResult => {
    session.state = state;
    return { text, done: false };
  };
  const result = (lines: string[]): UssdStepResult => go("RESULT", [...lines, resultFooter(locale)].join("\n"));

  switch (session.state) {
    case "MAIN": {
      if (choice === "1") return go("PRICE_CROP", cropMenu(locale));
      if (choice === "2") return go("FERT_TYPE", fertTypeMenu(locale));
      if (choice === "3") return go("BUDGET_CROP", cropMenu(locale));
      if (choice === "4") return go("LANGUAGE", languageMenu(locale));
      if (choice === "5") {
        session.state = "ENDED";
        return { text: goodbye(locale), done: true };
      }
      return { text: invalid(locale) + mainMenu(locale), done: false };
    }

    case "PRICE_CROP":
    case "BUDGET_CROP": {
      if (choice === "0") return go("MAIN", mainMenu(locale));
      const crop = pick(CROPS, choice);
      if (!crop) return { text: invalid(locale) + cropMenu(locale), done: false };
      session.crop = crop.id;
      return go(session.state === "PRICE_CROP" ? "PRICE_COUNTY" : "BUDGET_COUNTY", countyMenu(locale));
    }

    case "PRICE_COUNTY": {
      if (choice === "0") return go("PRICE_CROP", cropMenu(locale));
      const county = pick(COUNTIES, choice);
      if (!county) return { text: invalid(locale) + countyMenu(locale), done: false };
      const crop = session.crop!;
      const prices = getCropPrices({ crop, county: county.value });
      const lines = prices.length
        ? prices.map((p) => `${p.market}: ${formatUnitPrice(p, locale)}`)
        : [t(locale, "No prices for this crop here yet.", "Hakuna bei za zao hili hapa bado.")];
      return result([
        t(locale, `${cropName(crop, "en")} prices - ${county.label}`, `Bei za ${cropName(crop, "sw").toLowerCase()} - ${county.label}`),
        ...lines,
        t(locale, "(DEMO DATA)", "(TAARIFA YA MFANO)")
      ]);
    }

    case "FERT_TYPE": {
      if (choice === "0") return go("MAIN", mainMenu(locale));
      const type = pick(FERT_TYPES, choice);
      if (!type) return { text: invalid(locale) + fertTypeMenu(locale), done: false };
      session.fertilizerType = type;
      return go("FERT_COUNTY", countyMenu(locale));
    }

    case "FERT_COUNTY": {
      if (choice === "0") return go("FERT_TYPE", fertTypeMenu(locale));
      const county = pick(COUNTIES, choice);
      if (!county) return { text: invalid(locale) + countyMenu(locale), done: false };
      const listings = getFertilizerListings({ type: session.fertilizerType, county: county.value });
      const lines = listings.map((f) => `${f.supplier}: ${formatKsh(f.pricePerBag)} (${availabilityLabel(f.availability, locale)})`);
      return result([
        t(locale, `${session.fertilizerType} prices - ${county.label}`, `Bei ya ${session.fertilizerType} - ${county.label}`),
        ...(lines.length > 0 ? lines : [t(locale, "No listings found.", "Hakuna taarifa.")]),
        t(locale, "(DEMO DATA, fictional suppliers)", "(TAARIFA YA MFANO, wasambazaji wa mfano)")
      ]);
    }

    case "BUDGET_COUNTY": {
      if (choice === "0") return go("BUDGET_CROP", cropMenu(locale));
      const county = pick(COUNTIES, choice);
      if (!county) return { text: invalid(locale) + countyMenu(locale), done: false };
      session.county = county.value;
      return go("BUDGET_FARM_SIZE", farmSizePrompt(locale));
    }

    case "BUDGET_FARM_SIZE": {
      if (choice === "0") return go("BUDGET_COUNTY", countyMenu(locale));
      const size = parseFloat(choice);
      if (Number.isNaN(size) || size <= 0) {
        return { text: t(locale, "Enter a valid number of acres:", "Weka nambari sahihi ya ekari:"), done: false };
      }
      session.farmSizeAcres = size;
      return go("BUDGET_AMOUNT", budgetPrompt(locale));
    }

    case "BUDGET_AMOUNT": {
      if (choice === "0") return go("BUDGET_FARM_SIZE", farmSizePrompt(locale));
      const amount = parseFloat(choice.replace(/,/g, ""));
      if (Number.isNaN(amount) || amount < 0) {
        return { text: t(locale, "Enter a valid budget amount:", "Weka kiwango sahihi cha bajeti:"), done: false };
      }
      session.budgetKsh = amount;
      return go("BUDGET_FERT_TYPE", fertTypeMenu(locale, session.crop));
    }

    case "BUDGET_FERT_TYPE": {
      if (choice === "0") return go("BUDGET_AMOUNT", budgetPrompt(locale));
      const type = pick(FERT_TYPES, choice);
      if (!type) return { text: invalid(locale) + fertTypeMenu(locale, session.crop), done: false };
      try {
        const budget = calculateBudget(
          {
            county: session.county!,
            crop: session.crop!,
            farmSizeAcres: session.farmSizeAcres!,
            budgetKsh: session.budgetKsh!,
            fertilizerType: type
          },
          locale
        );
        return result([
          t(locale, `Budget Plan: ${cropName(session.crop!, "en")}`, `Mpango wa Bajeti: ${cropName(session.crop!, "sw")}`),
          ...budget.lineItems.map((li) => `${li.label}: ${formatKsh(li.amountKsh)}`),
          t(locale, `Total: ${formatKsh(budget.totalEstimatedCostKsh)}`, `Jumla: ${formatKsh(budget.totalEstimatedCostKsh)}`),
          budget.isShortfall
            ? t(locale, `Shortfall: ${formatKsh(Math.abs(budget.remainingBudgetKsh))}`, `Upungufu: ${formatKsh(Math.abs(budget.remainingBudgetKsh))}`)
            : t(locale, `Remaining: ${formatKsh(budget.remainingBudgetKsh)}`, `Kilichobaki: ${formatKsh(budget.remainingBudgetKsh)}`)
        ]);
      } catch (err) {
        if (err instanceof FertilizerUnavailableError) {
          return {
            text: t(locale, "That fertilizer is unavailable in this county.\n", "Mbolea hii haipatikani eneo hili.\n") + fertTypeMenu(locale, session.crop),
            done: false
          };
        }
        throw err;
      }
    }

    case "RESULT": {
      if (choice === "5") {
        session.state = "ENDED";
        return { text: goodbye(locale), done: true };
      }
      return go("MAIN", mainMenu(locale));
    }

    case "LANGUAGE": {
      if (choice === "1") session.locale = "en";
      if (choice === "2") session.locale = "sw";
      return go("MAIN", mainMenu(session.locale));
    }

    case "ENDED":
    default:
      return startUssdSession(sessionId, locale);
  }
}

export function clearUssdSessions(): void {
  sessions.clear();
}
