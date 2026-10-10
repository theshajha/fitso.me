import { describe, expect, it } from "vitest";
import {
  FOUNDING_CAP_USD_CENTS,
  currencyFor,
  finishTodayEndedLine,
  priceFor,
  toUsdCents,
} from "./pricing";

const now = new Date("2026-10-10T12:00:00Z");
const open = { finish_today_expires_at: "2026-10-11T12:00:00Z" };
const expired = { finish_today_expires_at: "2026-10-09T12:00:00Z" };
const below = { founding_usd_cents: 61_200 };
const atCap = { founding_usd_cents: FOUNDING_CAP_USD_CENTS };

describe("priceFor: founding", () => {
  it("charges the founding price while the counter is under the cap", () => {
    expect(priceFor("report", "INR", open, below, now)).toEqual({
      tier: "founding",
      amount_minor: 49_900,
      list_amount_minor: 149_900,
      expires_at: null,
    });
    expect(priceFor("report", "USD", open, below, now).amount_minor).toBe(1_000);
  });
  it("applies to pro and ignores the finish-today window", () => {
    const r = priceFor("pro", "USD", expired, below, now);
    expect(r.tier).toBe("founding");
    expect(r.amount_minor).toBe(3_900);
    expect(r.list_amount_minor).toBe(7_900);
  });
});

describe("priceFor: finish today", () => {
  it("applies to the report after the cap, before expiry", () => {
    const r = priceFor("report", "INR", open, atCap, now);
    expect(r.tier).toBe("finish_today");
    expect(r.amount_minor).toBe(99_900);
    expect(r.expires_at).toBe("2026-10-11T12:00:00.000Z");
  });
  it("uses USD 15", () => {
    expect(priceFor("report", "USD", open, atCap, now).amount_minor).toBe(1_500);
  });
  it("never applies to pro", () => {
    expect(priceFor("pro", "INR", open, atCap, now).tier).toBe("list");
  });
});

describe("priceFor: expired and list", () => {
  it("falls back to list after expiry", () => {
    const r = priceFor("report", "INR", expired, atCap, now);
    expect(r).toEqual({
      tier: "list",
      amount_minor: 149_900,
      list_amount_minor: 149_900,
      expires_at: null,
    });
  });
  it("is expired exactly at the expiry instant", () => {
    const edge = { finish_today_expires_at: now.toISOString() };
    expect(priceFor("report", "USD", edge, atCap, now).tier).toBe("list");
  });
  it("uses list with no quick win", () => {
    expect(priceFor("report", "USD", null, atCap, now).amount_minor).toBe(2_400);
  });
  it("words the ended line", () => {
    expect(finishTodayEndedLine("2026-10-09T12:00:00Z")).toBe(
      "Your finish-today price ended on 9 Oct 2026",
    );
  });
});

describe("currency selection", () => {
  it("IN gets INR, others USD", () => {
    expect(currencyFor({ country: "IN" })).toBe("INR");
    expect(currencyFor({ country: "AE" })).toBe("USD");
  });
  it("the country header wins over Accept-Language", () => {
    expect(currencyFor({ country: "AE", acceptLanguage: "en-IN" })).toBe("USD");
  });
  it("falls back to the Accept-Language region", () => {
    expect(currencyFor({ acceptLanguage: "en-IN,en;q=0.9" })).toBe("INR");
    expect(currencyFor({ acceptLanguage: "en-US,en;q=0.9" })).toBe("USD");
    expect(currencyFor({})).toBe("USD");
  });
});

describe("toUsdCents", () => {
  it("converts INR paise at the fixed rate", () => {
    expect(toUsdCents(84_000, "INR", 84)).toBe(1_000);
    expect(toUsdCents(1_000, "USD", 84)).toBe(1_000);
  });
});
