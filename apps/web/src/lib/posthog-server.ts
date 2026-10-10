import { PostHog } from "posthog-node";
import { env, isStub } from "./env";
import { hashEmail } from "./identity";

export { hashEmail };

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (isStub.posthog) return null;
  if (!client) {
    client = new PostHog(env.posthogKey!, {
      host: env.posthogHost,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}

/**
 * Server-side event. `distinctId` should be an email hash (see hashEmail) or a
 * token, never a raw email. Flushes before returning so serverless exits are safe.
 */
export async function trackServer(
  distinctId: string,
  event: string,
  props?: Record<string, unknown>,
): Promise<void> {
  const ph = getClient();
  if (!ph) return;
  try {
    ph.capture({ distinctId, event, properties: props });
    await ph.flush();
  } catch (err) {
    console.error("[fitso] trackServer failed", err);
  }
}
