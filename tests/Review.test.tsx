import { describe, it, expect, vi } from 'vitest';
import { defineReview, parseReviewState, serializeReviewState } from '../review/state';
import { ReviewLifecycle } from '../review/lifecycle';
import { createMockFetch, MemoryStorage } from '../review/isolation';
import type { ReviewContext, ReviewScene, ReviewSession } from '../review/types';

const session = (): ReviewSession => ({ render: () => null, dispose: vi.fn() });
const scene: ReviewScene = { id: 'projects', title: '项目', setup: session, motionControls: ['full', 'paused'], dimensions: [
  { id: 'status', label: '状态', options: [{ id: 'normal', label: '正常' }, { id: 'error', label: '错误' }] },
  { id: 'role', label: '角色', options: [{ id: 'editor', label: '编辑' }, { id: 'reader', label: '只读' }] },
] };
const catalog = defineReview({ title: 'Review', scenes: [scene, { id: 'other', title: '其他', setup: session }] });
describe('review URL contract', () => {
  it('restores independent dimensions and all controls', () => {
    const hash = '#scene=projects&d.status=error&d.role=reader&theme=arknights&width=520&zoom=2&motion=paused';
    const state = parseReviewState(hash, catalog);
    expect(state).toEqual({ scene: 'projects', dimensions: { status: 'error', role: 'reader' }, theme: 'arknights', width: 520, zoom: 2, motion: 'paused' });
    expect(parseReviewState(serializeReviewState(state), catalog)).toEqual(state);
  });
  it('drops unknown values and arbitrary form drafts with deterministic fallback', () => {
    const state = parseReviewState('#scene=gone&theme=unknown&width=999&zoom=5&motion=bad&d.role=admin&draft=secret', catalog);
    expect(state).toEqual({ scene: 'projects', dimensions: { status: 'normal', role: 'editor' }, theme: 'rhine', width: 'fit', zoom: 1, motion: 'system' });
    expect(serializeReviewState(state)).not.toContain('secret');
  });
  it('does not leak dimensions to a scene which does not support them', () => {
    expect(parseReviewState('#scene=other&d.role=reader', catalog).dimensions).toEqual({});
  });
  it('rejects duplicate IDs, empty dimensions and invalid widths', () => {
    expect(() => defineReview({ title: '', scenes: [] })).toThrow();
    expect(() => defineReview({ title: '', scenes: [scene, scene] })).toThrow();
    expect(() => defineReview({ title: '', scenes: [{ ...scene, dimensions: [{ id: 'x', label: '', options: [] }] }] })).toThrow();
    expect(() => defineReview({ title: '', scenes: [scene], widths: [0] })).toThrow();
  });
});
const deferred = <T,>() => { let resolve!: (value: T) => void; const promise = new Promise<T>(yes => { resolve = yes; }); return { promise, resolve }; };
function harness() {
  const hooks = { clear: vi.fn(), ready: vi.fn(), error: vi.fn(), context: () => ({ mockHttp: vi.fn(), report: vi.fn() }) };
  return { hooks, lifecycle: new ReviewLifecycle(hooks) };
}
describe('review lifecycle', () => {
  it('aborts pending setup and cleans resources registered before it returns', async () => {
    const { lifecycle, hooks } = harness();
    const pending = deferred<ReviewSession>();
    const earlyCleanup = vi.fn();
    let context!: ReviewContext;
    const first = lifecycle.select({ ...scene, setup: ctx => { context = ctx; ctx.onDispose(earlyCleanup); return pending.promise; } }, {});
    await lifecycle.select(catalog.scenes[1], {});
    expect(context.signal.aborted).toBe(true);
    expect(earlyCleanup).toHaveBeenCalledOnce();
    const stale = session(); pending.resolve(stale); await first;
    expect(stale.dispose).toHaveBeenCalledOnce();
    expect(hooks.ready).toHaveBeenCalledTimes(1);
    await lifecycle.dispose();
  });
  it('waits for async disposal across rapid consecutive selections', async () => {
    const { lifecycle, hooks } = harness(); const disposal = deferred<void>();
    await lifecycle.select({ ...scene, setup: () => ({ ...session(), dispose: () => disposal.promise }) }, {});
    const discarded = vi.fn(session), accepted = vi.fn(session);
    const second = lifecycle.select({ ...scene, setup: discarded }, {});
    const third = lifecycle.select({ ...scene, setup: accepted }, {});
    await Promise.resolve(); expect(accepted).not.toHaveBeenCalled();
    disposal.resolve(); await Promise.all([second, third]);
    expect(discarded).not.toHaveBeenCalled(); expect(accepted).toHaveBeenCalledOnce();
    expect(hooks.error).not.toHaveBeenCalled(); await lifecycle.dispose();
  });
  it('resets then disposes and creates a fresh session', async () => {
    const { lifecycle } = harness(); const log: string[] = [];
    const definition = { ...scene, setup: (context: ReviewContext) => { log.push(`setup:${context.reason}`); return { render: () => null, reset: () => { log.push('reset'); }, dispose: () => { log.push('dispose'); } }; } };
    await lifecycle.select(definition, {}); await lifecycle.select(definition, {}, 'reset');
    expect(log).toEqual(['setup:select', 'reset', 'dispose', 'setup:reset']); await lifecycle.dispose();
  });
  it('runs cleanup on setup rejection and surfaces failure', async () => {
    const { lifecycle, hooks } = harness(); const cleanup = vi.fn();
    await lifecycle.select({ ...scene, setup: async context => { context.onDispose(cleanup); throw new Error('setup failed'); } }, {});
    expect(cleanup).toHaveBeenCalledOnce(); expect(hooks.error).toHaveBeenCalledWith(expect.objectContaining({ message: 'setup failed' }), 'projects');
  });
  it('attributes a disposal failure to the old scene while accepting the next scene', async () => {
    const { lifecycle, hooks } = harness();
    await lifecycle.select({ ...scene, setup: () => ({ ...session(), dispose() { throw new Error('cleanup failed'); } }) }, {});
    await lifecycle.select(catalog.scenes[1], {});
    expect(hooks.error).toHaveBeenCalledWith(expect.objectContaining({ message: 'cleanup failed' }), 'projects');
    expect(hooks.ready).toHaveBeenLastCalledWith(expect.anything(), catalog.scenes[1]);
    await lifecycle.dispose();
  });
});
describe('synthetic request boundary', () => {
  it('preserves Request method/body and omits credentials', async () => {
    const handler = vi.fn(async (request: Request) => {
      expect(request.method).toBe('POST'); expect(request.credentials).toBe('omit');
      return Response.json({ body: await request.text() });
    });
    const fetch = createMockFetch(() => handler, () => new AbortController().signal, vi.fn());
    const response = await fetch(new Request('https://synthetic.invalid/items', { method: 'POST', body: 'hello' }));
    expect(await response.json()).toEqual({ body: 'hello' });
  });
  it('rejects unmatched requests with visible failure instead of fallback network', async () => {
    const report = vi.fn(); const fetch = createMockFetch(() => undefined, () => new AbortController().signal, report);
    await expect(fetch(new URL('https://synthetic.invalid/missing'))).rejects.toThrow('未实现模拟请求');
    expect(report).toHaveBeenCalledWith('未实现模拟请求：GET /missing');
  });
  it('cancels a noncooperative handler when its scene is disposed', async () => {
    const abort = new AbortController(); const fetch = createMockFetch(() => () => new Promise(() => {}), () => abort.signal, vi.fn());
    const pending = fetch('https://synthetic.invalid/items'); abort.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('honors a Request abort signal and a pre-aborted request', async () => {
    const abort = new AbortController(); const handler = vi.fn(() => new Promise<Response>(() => {}));
    const fetch = createMockFetch(() => handler, () => new AbortController().signal, vi.fn());
    abort.abort(); await expect(fetch(new Request('https://synthetic.invalid', { signal: abort.signal }))).rejects.toMatchObject({ name: 'AbortError' });
    expect(handler).not.toHaveBeenCalled();
  });
  it('keeps storage in memory and resets all keys', () => {
    const storage = new MemoryStorage(); storage.setItem('name', 'synthetic');
    expect(storage.getItem('name')).toBe('synthetic'); expect(storage.length).toBe(1);
    storage.clear(); expect(storage.getItem('name')).toBeNull(); expect(storage.key(0)).toBeNull();
  });
});
