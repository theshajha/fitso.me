import { z } from "zod";

/** Empty strings from .env files count as unset. */
const optional = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

const schema = z.object({
  NEXT_PUBLIC_SITE_URL: optional,
  NEXT_PUBLIC_POSTHOG_KEY: optional,
  NEXT_PUBLIC_POSTHOG_HOST: optional,
  SUPABASE_URL: optional,
  SUPABASE_SERVICE_ROLE_KEY: optional,
  ANTHROPIC_API_KEY: optional,
  TYPESAFE_API_KEY: optional,
  GEMINI_API_KEY: optional,
  AI_MODEL_GATE: optional,
  AI_MODEL_OBSERVE: optional,
  AI_MODEL_JUDGE: optional,
  AI_MODEL_WRITE: optional,
  AI_JUDGE_EFFORT: optional,
  AI_MODEL_VERDICT: optional,
  DODO_API_KEY: optional,
  DODO_WEBHOOK_SECRET: optional,
  DODO_PRODUCT_REPORT_INR: optional,
  DODO_PRODUCT_REPORT_USD: optional,
  DODO_PRODUCT_PRO_INR: optional,
  DODO_PRODUCT_PRO_USD: optional,
  INR_PER_USD: optional,
  OWNER_COOKIE_SECRET: optional,
  ACCESS_CODE: optional,
  MAX_READS_PER_DAY: optional,
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid environment: ${z.prettifyError(parsed.error)}`);
}
const raw = parsed.data;

const inrPerUsd = Number(raw.INR_PER_USD ?? "84");
if (!Number.isFinite(inrPerUsd) || inrPerUsd <= 0) {
  throw new Error("Invalid environment: INR_PER_USD must be a positive number");
}

export const env = {
  siteUrl: raw.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  posthogKey: raw.NEXT_PUBLIC_POSTHOG_KEY,
  posthogHost: raw.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
  supabaseUrl: raw.SUPABASE_URL,
  supabaseServiceRoleKey: raw.SUPABASE_SERVICE_ROLE_KEY,
  anthropicKey: raw.ANTHROPIC_API_KEY,
  typesafeKey: raw.TYPESAFE_API_KEY,
  geminiKey: raw.GEMINI_API_KEY,
  aiModelGate: raw.AI_MODEL_GATE ?? "claude-haiku-5-5",
  aiModelObserve: raw.AI_MODEL_OBSERVE ?? "claude-opus-5-5",
  aiModelJudge: raw.AI_MODEL_JUDGE ?? "claude-opus-5-5",
  aiModelWrite: raw.AI_MODEL_WRITE ?? "claude-sonnet-5-5",
  aiJudgeEffort: (["low", "medium", "high", "xhigh", "max"].includes(raw.AI_JUDGE_EFFORT ?? "") ? raw.AI_JUDGE_EFFORT : "high") as "low" | "medium" | "high" | "xhigh" | "max",
  aiModelVerdict: raw.AI_MODEL_VERDICT ?? "claude-sonnet-5-5",
  dodoApiKey: raw.DODO_API_KEY,
  dodoWebhookSecret: raw.DODO_WEBHOOK_SECRET,
  dodoProducts: {
    report: { INR: raw.DODO_PRODUCT_REPORT_INR, USD: raw.DODO_PRODUCT_REPORT_USD },
    pro: { INR: raw.DODO_PRODUCT_PRO_INR, USD: raw.DODO_PRODUCT_PRO_USD },
  },
  inrPerUsd,
  ownerCookieSecret: raw.OWNER_COOKIE_SECRET,
  accessCode: raw.ACCESS_CODE,
  maxReadsPerDay: Math.max(1, Number(raw.MAX_READS_PER_DAY ?? "200") || 200),
  isProd: process.env.NODE_ENV === "production",
} as const;

/** True when the integration has no credentials and runs on local fakes. */
export const isStub = {
  ai: !raw.ANTHROPIC_API_KEY,
  verify: !raw.TYPESAFE_API_KEY,
  dodo: !raw.DODO_API_KEY,
  supabase: !(raw.SUPABASE_URL && raw.SUPABASE_SERVICE_ROLE_KEY),
  posthog: !raw.NEXT_PUBLIC_POSTHOG_KEY,
} as const;

const g = globalThis as { __fitsoEnvLogged?: boolean };
if (typeof window === "undefined" && !g.__fitsoEnvLogged) {
  g.__fitsoEnvLogged = true;
  const stubbed = (Object.keys(isStub) as (keyof typeof isStub)[]).filter((k) => isStub[k]);
  console.log(
    stubbed.length
      ? `[fitso] stub mode: ${stubbed.join(", ")}`
      : "[fitso] all integrations configured",
  );
}
