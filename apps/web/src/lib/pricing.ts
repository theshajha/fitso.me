import type { Currency, PriceTier, Product } from "@fitso/core";

/** Pricing engine (spec section 8). Pure functions: no I/O, no clock reads unless `now` is defaulted. */

/** Whole currency units (rupees, dollars). */
export const LIST = {
  report: { INR: 2499, USD: 29 },
  pro: { INR: 4999, USD: 79 },
} as const;

export const FINISH_TODAY = {
  report: { INR: 849, USD: 10 },
} as const;

export const FOUNDING = {
  report: { INR: 849, USD: 10 },
  pro: { INR: 1999, USD: 39 },
} as const;

export const FOUNDING_CAP_USD_CENTS = 100_000;
export const DEFAULT_INR_PER_USD = 84;

export type QuickWinPricingInput = {
  finish_today_expires_at: string | Date;
};

export type CounterInput = {
  founding_usd_cents: number;
};

export type PriceResult = {
  tier: PriceTier;
  /** Paise or cents. */
  amount_minor: number;
  list_amount_minor: number;
  /** ISO string; set only for the finish_today tier. */
  expires_at: string | null;
};

const toMinor = (units: number) => units * 100;

export function foundingActive(counter: CounterInput): boolean {
  return counter.founding_usd_cents < FOUNDING_CAP_USD_CENTS;
}

export function priceFor(
  product: Product,
  currency: Currency,
  quickWin: QuickWinPricingInput | null,
  counter: CounterInput,
  now: Date = new Date(),
): PriceResult {
  const list = toMinor(LIST[product][currency]);

  if (foundingActive(counter)) {
    return {
      tier: "founding",
      amount_minor: toMinor(FOUNDING[product][currency]),
      list_amount_minor: list,
      expires_at: null,
    };
  }

  if (product === "report" && quickWin) {
    const expires = new Date(quickWin.finish_today_expires_at);
    if (now.getTime() < expires.getTime()) {
      return {
        tier: "finish_today",
        amount_minor: toMinor(FINISH_TODAY.report[currency]),
        list_amount_minor: list,
        expires_at: expires.toISOString(),
      };
    }
  }

  return { tier: "list", amount_minor: list, list_amount_minor: list, expires_at: null };
}

/** True once the finish-today window has passed (used for the "ended on" line). */
export function finishTodayExpired(quickWin: QuickWinPricingInput, now: Date = new Date()): boolean {
  return now.getTime() >= new Date(quickWin.finish_today_expires_at).getTime();
}

export function finishTodayEndedLine(expiresAt: string | Date): string {
  const date = new Date(expiresAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return `Your finish-today price ended on ${date}`;
}

/** Convert an order amount to USD cents at a fixed rate. */
export function toUsdCents(
  amountMinor: number,
  currency: Currency,
  inrPerUsd: number = DEFAULT_INR_PER_USD,
): number {
  if (currency === "USD") return amountMinor;
  return Math.round(amountMinor / inrPerUsd);
}

/**
 * Currency default. The country header wins (x-vercel-ip-country or cf-ipcountry).
 * Without it, an Accept-Language region of IN gives INR. Everything else is USD.
 */
export function currencyFor(input: {
  country?: string | null;
  acceptLanguage?: string | null;
}): Currency {
  const country = input.country?.trim().toUpperCase();
  if (country && country !== "XX" && country !== "T1") return country === "IN" ? "INR" : "USD";
  const tags = (input.acceptLanguage ?? "").split(",").map((t) => t.split(";")[0].trim());
  return tags.some((t) => /^[a-z]{2,3}-IN$/i.test(t)) ? "INR" : "USD";
}

export function currencyFromHeaders(headers: { get(name: string): string | null }): Currency {
  // The site shows USD only. `currencyFor` stays for tests and a later return of INR.
  void headers;
  return "USD";
}

export function formatMoney(amountMinor: number, currency: Currency): string {
  const units = amountMinor / 100;
  return currency === "INR"
    ? `INR ${units.toLocaleString("en-IN")}`
    : `USD ${units.toLocaleString("en-US")}`;
}
