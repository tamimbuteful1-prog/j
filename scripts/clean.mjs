/* The Vite build writes into the repository root with emptyOutDir disabled
   (so it can never delete the sources next to it). That means previously
   hashed assets would pile up, so remove the assets directory first. */
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
rmSync(join(root, "assets"), { recursive: true, force: true });
