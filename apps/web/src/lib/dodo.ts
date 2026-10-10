import DodoPayments from "dodopayments";
import { env, isStub } from "./env";

/**
 * Thin wrapper over the `dodopayments` SDK (2.54.2). Server-only.
 *
 * SDK calls used:
 *   client.checkoutSessions.create({ product_cart: [{ product_id, quantity: 1, amount }], customer: { email },
 *     billing_currency, metadata, return_url, cancel_url })  ->  { session_id, checkout_url }
 *   client.webhooks.unwrap(rawBody, { headers })  (Standard Webhooks signature check, key from webhookKey)
 *
 * Per-checkout amounts: the SDK supports `amount` on a cart item ONLY for products configured as
 * pay-what-you-want. For any other product the API ignores `amount`. So each of the four Dodo products
 * (report and pro, INR and USD) must be created as pay-what-you-want, with the minimum set to the lowest tier
 * price. The price tier (founding, finish_today, list) is then chosen by priceFor() and sent as `amount`.
 * The webhook rejects a payment that is below the order amount (see isUnderpaid).
 */

export type CreateCheckoutInput = {
  productId: string;
  email: string;
  currency: "INR" | "USD";
  /** Paise or cents. */
  amountMinor: number;
  /** Must carry order_id. Dodo accepts string, number and boolean values only. */
  metadata: Record<string, string>;
};

export type CreateCheckoutResult = { url: string; providerOrderId: string };

let client: DodoPayments | null = null;

function getClient(): DodoPayments {
  if (!client) {
    client = new DodoPayments({
      bearerToken: env.dodoApiKey!,
      webhookKey: env.dodoWebhookSecret ?? null,
      environment: process.env.DODO_ENVIRONMENT === "test_mode" ? "test_mode" : "live_mode",
    });
  }
  return client;
}

export async function createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
  const orderId = input.metadata.order_id;
  if (!orderId) throw new Error("createCheckout: metadata.order_id is required");

  if (isStub.dodo) {
    return { url: `/checkout/success?order=${encodeURIComponent(orderId)}&stub=1`, providerOrderId: `stub_${orderId}` };
  }

  const session = await getClient().checkoutSessions.create({
    product_cart: [{ product_id: input.productId, quantity: 1, amount: input.amountMinor }],
    customer: { email: input.email },
    billing_currency: input.currency,
    metadata: input.metadata,
    return_url: `${env.siteUrl}/checkout/success?order=${encodeURIComponent(orderId)}`,
    cancel_url: `${env.siteUrl}/checkout/cancel${input.metadata.token ? `?token=${encodeURIComponent(input.metadata.token)}` : ""}`,
  });
  if (!session.checkout_url) throw new Error("Dodo returned no checkout_url");
  return { url: session.checkout_url, providerOrderId: session.session_id };
}

export class WebhookSignatureError extends Error {}

/** Verify the signature and parse the body. Throws WebhookSignatureError on a bad signature. */
export function verifyWebhook(rawBody: string, headers: Headers): unknown {
  if (isStub.dodo) {
    if (headers.get("x-stub-signature") !== "ok") throw new WebhookSignatureError("bad stub signature");
    try {
      return JSON.parse(rawBody);
    } catch {
      throw new WebhookSignatureError("invalid JSON");
    }
  }
  if (!env.dodoWebhookSecret) throw new WebhookSignatureError("DODO_WEBHOOK_SECRET is not set");
  const flat: Record<string, string> = {};
  headers.forEach((value, key) => {
    flat[key] = value;
  });
  try {
    return getClient().webhooks.unwrap(rawBody, { headers: flat });
  } catch (err) {
    throw new WebhookSignatureError(err instanceof Error ? err.message : "bad signature");
  }
}
