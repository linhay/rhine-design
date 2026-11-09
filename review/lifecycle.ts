import type { ReviewContext, ReviewScene, ReviewSession } from './types';

export class ReviewLifecycle {
  private generation = 0;
  private active?: { scene: string; abort: AbortController; cleanups: (() => void | Promise<void>)[]; session?: ReviewSession; disposed: boolean; disposal?: Promise<void> };
  constructor(private readonly hooks: {
    clear(): void;
    ready(session: ReviewSession, scene: ReviewScene): void;
    error(error: unknown, scene?: string): void;
    failed?(scene: string): void;
    context(signal: AbortSignal, scene: ReviewScene): Pick<ReviewContext, 'mockHttp' | 'report'>;
  }) {}
  private cleanup(run: NonNullable<ReviewLifecycle['active']>, reset: boolean): Promise<void> {
    if (run.disposal) return run.disposal;
    run.disposed = true;
    run.abort.abort();
    const operations = [...run.cleanups.reverse()];
    if (run.session) {
      if (reset && run.session.reset) operations.unshift(() => run.session!.reset!());
      operations.push(() => run.session!.dispose());
    }
    run.disposal = (async () => {
      for (const operation of operations) {
        try { await operation(); } catch (error) { this.hooks.error(error, run.scene); }
      }
    })();
    return run.disposal;
  }
  async select(scene: ReviewScene, dimensions: Record<string, string>, reason: 'select' | 'reset' = 'select') {
    const generation = ++this.generation;
    const previous = this.active;
    try { this.hooks.clear(); } catch (error) { this.hooks.error(error, previous?.scene); }
    if (previous) await this.cleanup(previous, reason === 'reset');
    if (generation !== this.generation) return;
    const run = { scene: scene.id, abort: new AbortController(), cleanups: [] as (() => void | Promise<void>)[], session: undefined as ReviewSession | undefined, disposed: false };
    this.active = run;
    const context: ReviewContext = {
      ...this.hooks.context(run.abort.signal, scene), dimensions: Object.freeze({ ...dimensions }), signal: run.abort.signal, reason,
      onDispose: cleanup => {
        if (run.disposed) void Promise.resolve().then(cleanup).catch(error => this.hooks.error(error, scene.id));
        else run.cleanups.push(cleanup);
      },
    };
    try {
      const session = await scene.setup(context);
      if (generation !== this.generation || run.disposed) { await session.dispose(); return; }
      run.session = session;
      this.hooks.ready(session, scene);
    } catch (error) {
      if (!run.abort.signal.aborted) { this.hooks.error(error, scene.id); this.hooks.failed?.(scene.id); }
      await this.cleanup(run, false);
    }
  }
  async dispose() {
    ++this.generation;
    try { this.hooks.clear(); } catch (error) { this.hooks.error(error, this.active?.scene); }
    if (this.active) await this.cleanup(this.active, false);
  }
}
