import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { useConfig } from './config';

// All overlays participate in Radix's layer/focus stack; no parallel document listeners.
export const dialogDismiss = new WeakMap<Element, () => void>();
export function useLayerScope() {
  const ref = useRef<HTMLSpanElement>(null);
  const [container, setContainer] = useState<HTMLElement>();
  const { density } = useConfig();
  useLayoutEffect(() => { setContainer(ref.current?.closest<HTMLElement>('.rhine-theme') ?? document.body); }, []);
  return { ref, container, density };
}

// Radix removes a focus scope asynchronously. A later, deliberate focus transfer
// must win over its old trigger restoration (including rapid keyboard input).
export function respectFocusHandoff(event: Event, anchor: RefObject<HTMLElement | null>) {
  if (event.defaultPrevented) return;
  const active = document.activeElement;
  const closing = event.target;
  if (active && active !== document.body && active !== document.documentElement
    && !active.hasAttribute('data-radix-focus-guard') && !anchor.current?.contains(active)
    && !(closing instanceof Node && closing.contains(active))) event.preventDefault();
}
