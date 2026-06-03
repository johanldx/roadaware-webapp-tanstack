import { copyFileSync, existsSync, rmSync } from "node:fs";
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

/** Artefacts pipeline — Cloudflare Pages refuse les fichiers > 25 Mo */
const DEPLOY_EXCLUDE = [
	join(clientDir, "data", "roads-idf.geojson"),
	join(clientDir, "data", ".sinuosity-tiles"),
];

for (const path of DEPLOY_EXCLUDE) {
	if (existsSync(path)) {
		rmSync(path, { recursive: true, force: true });
		console.log(`post-static-build: retiré ${path.replace(clientDir, "")}`);
	}
}

// Accueil : TanStack écrit / dans index.html ou via le shell selon la config
if (!existsSync(indexPath) && existsSync(shellPath)) {
	copyFileSync(shellPath, indexPath);
	console.log("post-static-build: copié _shell.html → index.html");
}
