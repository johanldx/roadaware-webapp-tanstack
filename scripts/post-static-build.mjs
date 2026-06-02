import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const clientDir = join(
	dirname(fileURLToPath(import.meta.url)),
	"..",
	"dist",
	"client",
);
const indexPath = join(clientDir, "index.html");
const shellPath = join(clientDir, "_shell.html");

// Accueil : TanStack écrit / dans index.html ou via le shell selon la config
if (!existsSync(indexPath) && existsSync(shellPath)) {
	copyFileSync(shellPath, indexPath);
	console.log("post-static-build: copié _shell.html → index.html");
}
