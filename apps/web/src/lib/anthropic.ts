import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { env } from "./env";

/** Server-only Anthropic client. Reads ANTHROPIC_API_KEY. Never import from a client component. */
let client: Anthropic | null = null;
export function anthropic(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: env.anthropicKey, maxRetries: 2, timeout: 180_000 });
  return client;
}

export type ImagePart = { bytes: Uint8Array; mimeType: "image/jpeg" | "image/png" | "image/webp" };

export type StructuredCall<S extends z.ZodType> = {
  model: string;
  system: string;
  user: string;
  image?: ImagePart;
  schema: S;
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
  maxTokens?: number;
};

/**
 * One structured call: system prompt, one user turn (text plus an optional image),
 * parsed and validated against a zod schema. Throws on a refusal, a truncated
 * answer, or a parse failure. The caller decides whether to retry.
 */
export async function structured<S extends z.ZodType>(call: StructuredCall<S>): Promise<z.infer<S>> {
  const content: Anthropic.ContentBlockParam[] = [];
  if (call.image) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: call.image.mimeType, data: Buffer.from(call.image.bytes).toString("base64") },
    });
  }
  content.push({ type: "text", text: call.user });

  const res = await anthropic().messages.parse({
    model: call.model,
    max_tokens: call.maxTokens ?? 16000,
    system: [{ type: "text", text: call.system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content }],
    output_config: { format: zodOutputFormat(call.schema), ...(call.effort ? { effort: call.effort } : {}) },
  });

  if (res.stop_reason === "refusal") {
    throw new Error(`model refused (${res.stop_details?.category ?? "unknown"})`);
  }
  if (res.stop_reason === "max_tokens") throw new Error("model output was cut off at max_tokens");
  if (!res.parsed_output) throw new Error("model output did not match the schema");
  return res.parsed_output as z.infer<S>;
}
