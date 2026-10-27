import type { Plugin } from 'vite';
export interface ReviewViteOptions {
  /** Catalog module relative to the dedicated Vite root. */
  catalog: string;
  /** Product router base, separate from static asset base. */
  routerBase?: string;
}
export function reviewPlugin(options: ReviewViteOptions): Plugin;
/** Forbidden paths are exact files/directories relative to the production Vite root. */
export function reviewProductionGuard(options?: { forbidden?: readonly string[] }): Plugin;
