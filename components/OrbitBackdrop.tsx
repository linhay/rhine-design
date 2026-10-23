import { useEffect, useRef, useState, type HTMLAttributes } from 'react';
import { Button } from './components';
import { mountOrbit, type OrbitRenderer, type OrbitState } from './orbitRenderer';

export interface OrbitBackdropProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a static preference; false never overrides the system or an ancestor. */
  reducedMotion?: boolean;
}

export function OrbitBackdrop({ reducedMotion = false, children, className = '', ...props }: OrbitBackdropProps) {
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

  return <div {...props} className={`rhine-orbit ${className}`} data-rhine-orbit-state={state}>
    <canvas ref={canvas} className="rhine-orbit-canvas" aria-hidden="true" />
    <div className="rhine-orbit-content">{children}</div>
    <div className="rhine-orbit-controls"><Button variant="secondary" disabled={!canControl} aria-pressed={paused} onClick={() => setPaused(value => !value)}>{label}</Button></div>
  </div>;
}
