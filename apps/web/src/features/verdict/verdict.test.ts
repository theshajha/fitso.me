import { describe, expect, it } from "vitest";
import { canSpendCredit, creditsAfterSpend } from "./credits";
import { parseVerdictForm } from "./schema";

describe("credits", () => {
  it("allows a spend only when credits remain", () => {
    expect(canSpendCredit(1)).toBe(true);
    expect(canSpendCredit(0)).toBe(false);
    expect(canSpendCredit(-1)).toBe(false);
    expect(creditsAfterSpend(1)).toBe(0);
    expect(() => creditsAfterSpend(0)).toThrow();
  });
});

describe("parseVerdictForm", () => {
  const png = () => new File([new Uint8Array([1])], "a.png", { type: "image/png" });
  it("takes a screenshot", () => {
    const fd = new FormData();
    fd.set("token", "abc");
    fd.set("screenshot", png());
    const r = parseVerdictForm(fd);
    expect(r.ok && r.data.kind).toBe("screenshot");
  });
  it("takes an https link and rejects other schemes", () => {
    const ok = new FormData();
    ok.set("token", "abc");
    ok.set("link", "https://example.com/shirt");
    expect(parseVerdictForm(ok).ok).toBe(true);
    const bad = new FormData();
    bad.set("token", "abc");
    bad.set("link", "javascript:alert(1)");
    expect(parseVerdictForm(bad).ok).toBe(false);
  });
  it("needs one input", () => {
    const fd = new FormData();
    fd.set("token", "abc");
    const r = parseVerdictForm(fd);
    expect(!r.ok && r.error.code).toBe("missing_input");
  });
});
