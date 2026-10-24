import { useEffect, useRef, useState, type HTMLAttributes } from 'react';
import { Button } from './components';
import { mountOrbit, type OrbitRenderer, type OrbitState } from './orbitRenderer';

export interface OrbitBackdropProps extends HTMLAttributes<HTMLDivElement> {
  /** Follows the host theme by default; original preserves the initial dark artwork. */
  appearance?: 'theme' | 'original';
  /** Adds a static preference; false never overrides the system or an ancestor. */
  reducedMotion?: boolean;
  /** Omits the local pause control without changing motion preferences. */
  controls?: boolean;
  /** Reserves the upper content area by moving the artwork into the lower right. */
  composition?: 'full' | 'corner';
  /** Removes panel decoration when used as a page background. */
  framed?: boolean;
}

export function OrbitBackdrop({ appearance = 'theme', reducedMotion = false, controls = true, composition = 'full', framed = true, children, className = '', ...props }: OrbitBackdropProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<OrbitRenderer | null>(null);
  const [paused, setPaused] = useState(false);
  const [state, setState] = useState<OrbitState>('empty');

  useEffect(() => {
    const scene = mountOrbit(canvas.current!, setState);
    renderer.current = scene;
    return () => { scene.dispose(); renderer.current = null; };
  }, []);
  useEffect(() => { renderer.current?.setPaused(paused); }, [paused]);
  useEffect(() => { renderer.current?.setReducedMotion(reducedMotion); }, [reducedMotion]);

  const canControl = state === 'playing' || state === 'paused';
  const label = state === 'reduced' ? '已减少动态' : state === 'compact' ? '窄屏静态画面'
    : canControl ? paused ? '继续动效' : '暂停动效' : '静态画面';

  return <div {...props} className={`rhine-orbit ${className}`} data-rhine-orbit-appearance={appearance} data-rhine-orbit-state={state} data-rhine-orbit-controls={controls} data-rhine-orbit-composition={composition} data-rhine-orbit-framed={framed}>
    <canvas ref={canvas} className="rhine-orbit-canvas" aria-hidden="true" />
    <div className="rhine-orbit-content">{children}</div>
    {controls && <div className="rhine-orbit-controls"><Button variant="secondary" disabled={!canControl} onClick={() => setPaused(value => !value)}>{label}</Button></div>}
  </div>;
}
