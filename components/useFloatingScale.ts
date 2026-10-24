import { useCallback, useLayoutEffect, useState, type RefObject } from 'react';

type Side = 'top' | 'right' | 'bottom' | 'left';

// Fall back before pointerdown opens a menu, so its first item cannot appear
// beneath the still-pressed trigger and accidentally receive the pointerup.
export function useFloatingSide(anchor: RefObject<HTMLSpanElement | null>, side: Side | undefined, width: number) {
  const [vertical, setVertical] = useState(false);
  useLayoutEffect(() => {
    if (side !== 'left' && side !== 'right') return;
    const root = anchor.current?.closest('.rhine-theme') ?? document.body;
    const ancestors: Element[] = [];
    for (let element: Element | null = root; element; element = element.parentElement) ancestors.push(element);
    const measure = () => {
      const trigger = anchor.current?.querySelector<HTMLElement>('[aria-haspopup], button, a');
      if (!trigger) return;
      const scale = ancestors.reduce((total, element) => total * (parseFloat(getComputedStyle(element).zoom) || 1), 1);
      const rect = trigger.getBoundingClientRect();
      setVertical(Math.max(rect.left, window.innerWidth - rect.right) < Math.min(width * scale, window.innerWidth - 24) + 20);
    };
    measure();
    const observer = new MutationObserver(measure);
    ancestors.forEach(element => observer.observe(element, { attributes: true, attributeFilter: ['style', 'class', 'data-rhine-theme'] }));
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
  }, [anchor, side, width]);
  return vertical && (side === 'left' || side === 'right') ? 'bottom' : side;
}

/** Keep Radix's viewport coordinates unscaled while preserving the user's content zoom. */
export function useFloatingScale(ref?: RefObject<HTMLDivElement | null>, kind = 'popover') {
  const [content, setContent] = useState<HTMLDivElement | null>(null);
  const attach = useCallback((element: HTMLDivElement | null) => {
    if (ref) ref.current = element;
    setContent(element);
  }, [ref]);
  useLayoutEffect(() => {
    const wrapper = content?.parentElement;
    if (!content || !wrapper?.hasAttribute('data-radix-popper-content-wrapper')) return;
    const ancestors: HTMLElement[] = [];
    for (let element = wrapper.parentElement; element; element = element.parentElement) ancestors.push(element);
    const original = { wrapperZoom: wrapper.style.zoom, translate: wrapper.style.translate, contentZoom: content.style.zoom, maxWidth: content.style.maxWidth, maxHeight: content.style.maxHeight, minWidth: content.style.minWidth };
    let offsetX = 0, offsetY = 0;
    const constrain = () => {
      const rect = wrapper.getBoundingClientRect();
      const x = rect.x - offsetX, y = rect.y - offsetY;
      // Radix shifts along the alignment axis only. A side-facing panel may need
      // to overlap its trigger when neither horizontal side has enough room.
      offsetX = Math.max(12, Math.min(x, window.innerWidth - rect.width - 12)) - x;
      offsetY = Math.max(12, Math.min(y, window.innerHeight - rect.height - 12)) - y;
      const translate = `${offsetX}px ${offsetY}px`;
      if (wrapper.style.translate !== translate) wrapper.style.translate = translate;
    };
    const measure = () => {
      const scale = ancestors.reduce((value, element) => {
        const raw = getComputedStyle(element).zoom;
        const zoom = raw.endsWith('%') ? parseFloat(raw) / 100 : parseFloat(raw);
        return value * (Number.isFinite(zoom) && zoom > 0 ? zoom : 1);
      }, 1);
      wrapper.style.zoom = String(1 / scale);
      content.style.zoom = String(scale);
      const width = `calc((100vw - 24px) / ${scale})`;
      content.style.maxWidth = kind === 'tooltip' ? `min(280px, ${width})` : width;
      content.style.maxHeight = `calc(var(--radix-${kind}-content-available-height) / ${scale})`;
      if (kind === 'dropdown-menu') content.style.minWidth = `min(180px, ${width})`;
      constrain();
    };
    measure();
    const observer = new MutationObserver(measure);
    ancestors.forEach(element => observer.observe(element, { attributes: true, attributeFilter: ['style', 'class', 'data-rhine-theme'] }));
    let lastTransform = wrapper.style.transform;
    const placement = new MutationObserver(() => {
      if (lastTransform === wrapper.style.transform) return;
      lastTransform = wrapper.style.transform;
      constrain();
    });
    placement.observe(wrapper, { attributes: true, attributeFilter: ['style'] });
    const size = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(constrain);
    size?.observe(wrapper);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      placement.disconnect();
      size?.disconnect();
      window.removeEventListener('resize', measure);
      wrapper.style.zoom = original.wrapperZoom;
      wrapper.style.translate = original.translate;
      content.style.zoom = original.contentZoom;
      content.style.maxWidth = original.maxWidth;
      content.style.maxHeight = original.maxHeight;
      content.style.minWidth = original.minWidth;
    };
  }, [content, kind]);
  return attach;
}
