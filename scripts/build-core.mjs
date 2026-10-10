// Builds packages/core after install. Skips when its dependencies are not
// installed, which happens on Vercel when only one workspace is installed
// (for example the closet app, which does not use @fitso/core).
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const core = path.join(root, "packages", "core");
const require = createRequire(path.join(core, "package.json"));
try {
  require.resolve("zod");
} catch {
  console.log("[build-core] zod not installed for packages/core, skipping build");
  process.exit(0);
}
execSync("npm run build -w packages/core", { cwd: root, stdio: "inherit" });
