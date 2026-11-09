import type { ReactNode } from 'react';
import type { ThemeName } from '../components/themeMetadata';

export type ReviewMotion = 'system' | 'full' | 'reduced' | 'paused';
export interface ReviewEnvironment {
  theme: ThemeName;
  motion: ReviewMotion;
  reducedMotion: boolean;
  paused: boolean;
}
export interface ReviewSelection {
  scene: string;
  dimensions: Record<string, string>;
  theme: ThemeName;
  width: number | 'fit';
  zoom: 1 | 2;
  motion: ReviewMotion;
}
export interface ReviewOption { id: string; label: string }
export interface ReviewDimension { id: string; label: string; options: readonly ReviewOption[] }
export interface ReviewSceneInfo {
  id: string;
  title: string;
  group?: string;
  description?: string;
  source?: string;
  issue?: string;
  validation?: string;
  /** Host apps with an existing ThemeProvider own their single theme root. */
  themeRoot?: 'runtime' | 'host';
  /** Opt in only if every scene animation handles the corresponding environment flag. */
  motionControls?: readonly ('full' | 'paused')[];
  dimensions?: readonly ReviewDimension[];
}
export interface ReviewContext {
  dimensions: Readonly<Record<string, string>>;
  signal: AbortSignal;
  reason: 'select' | 'reset';
  /** Register immediately, including resources acquired before async setup finishes. */
  onDispose(cleanup: () => void | Promise<void>): void;
  /** Only synthetic requests are dispatched here. Returning undefined explicitly fails. */
  mockHttp(handler: (request: Request) => Response | undefined | Promise<Response | undefined>): void;
  report(message: string, kind?: 'info' | 'error'): void;
}
export interface ReviewSession {
  render(environment: ReviewEnvironment): ReactNode;
  /** Explicit reset notification; a fresh setup always follows disposal. */
  reset?(): void | Promise<void>;
  dispose(): void | Promise<void>;
}
export interface ReviewScene extends ReviewSceneInfo {
  setup(context: ReviewContext): ReviewSession | Promise<ReviewSession>;
}
export interface ReviewCatalog {
  title: string;
  widths?: readonly number[];
  scenes: readonly ReviewScene[];
}
export type ReviewCatalogInfo = Omit<ReviewCatalog, 'scenes'> & { scenes: readonly ReviewSceneInfo[] };
