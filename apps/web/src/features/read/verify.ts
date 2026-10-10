import type { Observation } from "@fitso/core";
import { env, isStub } from "@/lib/env";

/**
 * Claim check with TypeSafe Jev (System One). For each line the free read will
 * show, one Choice question over the observation: does the observation support
 * the claim, contradict it, or say nothing about it. Runs only when
 * TYPESAFE_API_KEY is set; otherwise every note is "skipped".
 */

export type Relation = "supports" | "contradicts" | "says_nothing" | "skipped";
export type ClaimCheck = { claim: string; relation: Relation; confidence: number };

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";
/** Below this the line goes back to the judge even when the top answer is "supports". */
export const ACCEPT = 0.6;

type Answer = { type: "choice"; choice: Relation; probabilities: Record<string, number>; confidence: number };

export async function verifyClaims(claims: string[], obs: Observation[]): Promise<ClaimCheck[]> {
  if (isStub.verify || claims.length === 0) {
    return claims.map((claim) => ({ claim, relation: "skipped", confidence: 0 }));
  }
  const questions: Record<string, unknown> = {};
  claims.forEach((claim, i) => {
    questions[`c${i}`] = {
      type: "choice",
      instructions: {
        task: "How do the observer's notes relate to the stylist's claim? The notes describe what is visible in one or more photos of the same person. The claim is a line the stylist wrote about that person.",
        claim,
      },
      criteria: {
        supports: "The notes record the specific thing the claim rests on, or directly imply it",
        contradicts: "The notes record something that makes the claim false",
        says_nothing: "The notes do not cover what the claim asserts, either way",
      },
    };
  });

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { authorization: `Bearer ${env.typesafeKey}`, "content-type": "application/json" },
    body: JSON.stringify({ model: "jev-latest", state: { observations: obs }, questions }),
  });
  if (!res.ok) throw new Error(`typesafe ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { answers: Record<string, Answer> };
  return claims.map((claim, i) => {
    const a = json.answers[`c${i}`];
    if (!a) return { claim, relation: "skipped" as const, confidence: 0 };
    return { claim, relation: a.choice, confidence: a.confidence };
  });
}

/** Lines that must go back to the judge: the checker's top answer was contradicts or says_nothing. A supported line stays even at low confidence. */
export function failing(checks: ClaimCheck[]): string[] {
  return checks
    .filter((c) => c.relation === "contradicts" || c.relation === "says_nothing")
    .map((c) => `${c.claim} (${c.relation}, ${c.confidence.toFixed(2)})`);
}
