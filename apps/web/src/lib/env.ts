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
  AI_GATEWAY_API_KEY: optional,
  VERCEL_OIDC_TOKEN: optional,
  AI_MODEL_QUICK_WIN: optional,
  AI_MODEL_VERDICT: optional,
  AI_MODEL_REPORT: optional,
  DODO_API_KEY: optional,
  DODO_WEBHOOK_SECRET: optional,
  DODO_PRODUCT_REPORT_INR: optional,
  DODO_PRODUCT_REPORT_USD: optional,
  DODO_PRODUCT_PRO_INR: optional,
  DODO_PRODUCT_PRO_USD: optional,
  INR_PER_USD: optional,
  OWNER_COOKIE_SECRET: optional,
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
  aiGatewayKey: raw.AI_GATEWAY_API_KEY,
  aiModelQuickWin: raw.AI_MODEL_QUICK_WIN ?? "anthropic/claude-sonnet-5-5",
  aiModelVerdict: raw.AI_MODEL_VERDICT ?? "anthropic/claude-sonnet-5-5",
  aiModelReport: raw.AI_MODEL_REPORT ?? "anthropic/claude-opus-5-5",
  dodoApiKey: raw.DODO_API_KEY,
  dodoWebhookSecret: raw.DODO_WEBHOOK_SECRET,
  dodoProducts: {
    report: { INR: raw.DODO_PRODUCT_REPORT_INR, USD: raw.DODO_PRODUCT_REPORT_USD },
    pro: { INR: raw.DODO_PRODUCT_PRO_INR, USD: raw.DODO_PRODUCT_PRO_USD },
  },
  inrPerUsd,
  ownerCookieSecret: raw.OWNER_COOKIE_SECRET,
  isProd: process.env.NODE_ENV === "production",
} as const;

/** True when the integration has no credentials and runs on local fakes. */
export const isStub = {
  ai: !raw.AI_GATEWAY_API_KEY && !raw.VERCEL_OIDC_TOKEN,
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
