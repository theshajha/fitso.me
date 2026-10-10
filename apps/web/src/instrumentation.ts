// Runs once at server start. Importing env logs which integrations are stubbed.
export async function register() {
  await import("./lib/env");
}
