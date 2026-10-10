/** Verdict credits. One credit in month 1. */
export function canSpendCredit(credits: number): boolean {
  return Number.isInteger(credits) && credits > 0;
}

export function creditsAfterSpend(credits: number): number {
  if (!canSpendCredit(credits)) throw new Error("no verdict credit left");
  return credits - 1;
}
