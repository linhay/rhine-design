import { useEffect, useRef, useState, type HTMLAttributes } from 'react';
import { Button } from './components';
import type { NeutronRenderer, NeutronState } from './neutronRenderer';

export interface NeutronStarBackdropProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a static preference; false never overrides the system or an ancestor. */
  reducedMotion?: boolean;
  /** Theme follows the host palette; original preserves the initial deep-space artwork. */
  appearance?: 'theme' | 'original';
}

export function NeutronStarBackdrop({ reducedMotion = false, appearance = 'theme', children, className = '', ...props }: NeutronStarBackdropProps) {
  const art = useRef<HTMLDivElement>(null);
  const renderer = useRef<NeutronRenderer | null>(null);
  const options = useRef({ paused: false, reducedMotion, appearance });
  const [paused, setPaused] = useState(false);
  const [state, setState] = useState<NeutronState>('loading');
  options.current = { paused, reducedMotion, appearance };

  useEffect(() => {
    let disposed = false;
    if (!window.WebGL2RenderingContext) { setState('unavailable'); return; }
    // The heavy renderer is loaded only for a mounted, WebGL-capable artwork.
    import('./neutronRenderer').then(({ mountNeutron }) => {
      if (disposed) return;
      renderer.current = mountNeutron(art.current!, setState, options.current);
    }).catch(() => { if (!disposed) setState('unavailable'); });
    return () => { disposed = true; renderer.current?.dispose(); renderer.current = null; };
  }, []);
  useEffect(() => { renderer.current?.setPaused(paused); }, [paused]);
  useEffect(() => { renderer.current?.setReducedMotion(reducedMotion); }, [reducedMotion]);
  useEffect(() => { renderer.current?.setAppearance(appearance); }, [appearance]);

  const canControl = state === 'playing' || state === 'paused';
  const label = state === 'reduced' ? '已减少动态' : canControl ? paused ? '继续动效' : '暂停动效' : '静态画面';
  return <div {...props} className={`rhine-neutron ${className}`} data-rhine-neutron-state={state} data-rhine-neutron-appearance={appearance}>
    <div ref={art} className="rhine-neutron-art" aria-hidden="true">
      <span className="rhine-neutron-fallback"><i /><b /></span>
    </div>
    <div className="rhine-neutron-content">{children}</div>
    <div className="rhine-neutron-controls"><Button variant="secondary" disabled={!canControl} onClick={() => setPaused(value => !value)}>{label}</Button></div>
  </div>;
}
