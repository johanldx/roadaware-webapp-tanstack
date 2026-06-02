import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const PRERENDER_PATHS = [
	"/",
	"/app",
	"/share",
	"/meteo-pour-motard",
	"/carte-radars-paris",
	"/virage-moto-idf",
	"/balade-moto-idf",
	"/sortie-moto-weekend-idf",
	"/securite-moto-pluie",
	"/legal",
] as const;

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [
		devtools(),
		tailwindcss(),
		tanstackStart({
			prerender: {
				enabled: true,
				crawlLinks: true,
				concurrency: 4,
				failOnError: true,
			},
			pages: PRERENDER_PATHS.map((path) => ({ path })),
		}),
		viteReact(),
	],
});

export default config;
