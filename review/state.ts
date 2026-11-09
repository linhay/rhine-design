import { themes } from '../components/themeMetadata';
import type { ReviewCatalog, ReviewCatalogInfo, ReviewSelection } from './types';

export const defaultWidths = [400, 520, 880, 1280] as const;
const validId = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;
export function defineReview(catalog: ReviewCatalog): ReviewCatalog {
  if (!catalog.scenes.length) throw new Error('Review needs at least one scene.');
  const unique = (ids: string[]) => ids.every(id => validId.test(id)) && new Set(ids).size === ids.length;
  if (!unique(catalog.scenes.map(scene => scene.id))) throw new Error('Scene IDs must be unique stable identifiers.');
  for (const scene of catalog.scenes) {
    if (!unique((scene.dimensions ?? []).map(d => d.id))) throw new Error(`Invalid dimensions: ${scene.id}`);
    for (const dimension of scene.dimensions ?? []) {
      if (!dimension.options.length || !unique(dimension.options.map(o => o.id))) throw new Error(`Invalid options: ${dimension.id}`);
    }
  }
  if (catalog.widths && (!catalog.widths.length || catalog.widths.some(w => !Number.isInteger(w) || w < 240 || w > 3840))) throw new Error('Widths must be integers between 240 and 3840.');
  return catalog;
}
export function catalogInfo(catalog: ReviewCatalog): ReviewCatalogInfo {
  return { title: catalog.title, widths: catalog.widths, scenes: catalog.scenes.map(({ setup: _setup, ...info }) => info) };
}
export function parseReviewState(hash: string, catalog: ReviewCatalogInfo): ReviewSelection {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const scene = catalog.scenes.find(s => s.id === params.get('scene')) ?? catalog.scenes[0];
  if (!scene) throw new Error('Empty review catalog.');
  const width = Number(params.get('width'));
  const motion = params.get('motion');
  return {
    scene: scene.id,
    dimensions: Object.fromEntries((scene.dimensions ?? []).map(d => [d.id, d.options.find(o => o.id === params.get(`d.${d.id}`))?.id ?? d.options[0].id])),
    theme: themes.find(t => t.name === params.get('theme'))?.name ?? 'rhine',
    width: (catalog.widths ?? defaultWidths).includes(width) ? width : 'fit',
    zoom: params.get('zoom') === '2' ? 2 : 1,
    motion: motion === 'reduced' ? motion : (motion === 'full' || motion === 'paused') && scene.motionControls?.includes(motion) ? motion : 'system',
  };
}
export function serializeReviewState(state: ReviewSelection): string {
  const params = new URLSearchParams({ scene: state.scene, theme: state.theme, width: String(state.width), zoom: String(state.zoom), motion: state.motion });
  for (const key of Object.keys(state.dimensions).sort()) params.set(`d.${key}`, state.dimensions[key]);
  return `#${params}`;
}
