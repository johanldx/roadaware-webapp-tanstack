import { IDF_BOUNDS, IDF_WORK_BOUNDS } from "#/config/idf-boundary";

export { IDF_BOUNDS, IDF_WORK_BOUNDS };

/** Centre approximatif (Paris) */
export const IDF_CENTER: [number, number] = [2.3522, 48.8566];
export const IDF_DEFAULT_ZOOM = 9;

/** Points météo réels (appels API) */
export const IDF_SAMPLE_GRID = { cols: 3, rows: 3 } as const;

/** Grille dense interpolée — rendu heatmap fluide */
export const IDF_DISPLAY_GRID = { cols: 22, rows: 16 } as const;
