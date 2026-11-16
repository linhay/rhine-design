import { useId, useLayoutEffect, useMemo, useRef, useState, type Key, type ReactNode } from 'react';

export interface VirtualListProps<T> {
  label: string; items: readonly T[]; itemHeight?: number; height?: number;
  getItemKey?: (item: T, index: number) => Key;
  renderItem: (item: T, index: number) => ReactNode;
}

export function VirtualList<T>({ label, items, itemHeight = 44, height = 220, getItemKey, renderItem }: VirtualListProps<T>) {
  const root = useRef<HTMLDivElement>(null), id = useId();
  const identities = useRef(new WeakMap<object, number>()), sequence = useRef(0);
  const focus = useRef<{ key: string; node: HTMLElement; index: number } | null>(null);
  const [focusedKey, setFocusedKey] = useState<string | null>(null), [scroll, setScroll] = useState(0);
  const rowHeight = Number.isFinite(itemHeight) && itemHeight > 0 ? itemHeight : 44;
  const viewHeight = Number.isFinite(height) && height > 0 ? height : 220;
  const records = useMemo(() => {
    const occurrences = new Map<string, number>();
    return items.map((item, index) => {
      let identity: string;
      if (getItemKey) { const key = getItemKey(item, index); identity = `key:${typeof key}:${String(key)}`; }
      else if ((typeof item === 'object' && item !== null) || typeof item === 'function') {
        const candidate = item as { id?: unknown; key?: unknown };
        const key = candidate.id ?? candidate.key;
        if (typeof key === 'string' || typeof key === 'number' || typeof key === 'bigint') identity = `id:${typeof key}:${String(key)}`;
        else {
          const object = item as object;
          if (!identities.current.has(object)) identities.current.set(object, ++sequence.current);
          identity = `object:${identities.current.get(object)}`;
        }
      } else identity = `value:${typeof item}:${String(item)}`;
      // Equal primitive values have no separate identity; mutable duplicate rows
      // should supply getItemKey. Occurrences still avoid duplicate React keys.
      const occurrence = occurrences.get(identity) ?? 0;
      occurrences.set(identity, occurrence + 1);
      return { item, index, key: `${identity}:${occurrence}` };
    });
  }, [items, getItemKey]);
  const byKey = useMemo(() => new Map(records.map(record => [record.key, record])), [records]);
  const totalHeight = records.length * rowHeight;
  const viewport = root.current?.clientHeight || viewHeight;
  const boundedScroll = Math.max(0, Math.min(scroll, Math.max(0, totalHeight - viewport)));
  const start = Math.max(0, Math.floor(boundedScroll / rowHeight) - 2), count = Math.ceil(viewport / rowHeight) + 4;
  const shown = records.slice(start, start + count);
  const focused = focusedKey ? byKey.get(focusedKey) : undefined;
  if (focused && !shown.some(record => record.key === focused.key)) shown.push(focused);
  shown.sort((left, right) => left.index - right.index);

  useLayoutEffect(() => {
    if (!root.current) return;
    const element = root.current, action = focus.current;
    const viewport = element.clientHeight || viewHeight, maxScroll = Math.max(0, totalHeight - viewport);
    let nextScroll = Math.min(element.scrollTop, maxScroll);
    if (action) {
      const next = byKey.get(action.key), active = element.ownerDocument.activeElement;
      const ownsFocus = active === action.node || active === element.ownerDocument.body;
      if (!next) {
        focus.current = null; setFocusedKey(null);
        if (ownsFocus) element.focus({ preventScroll: true });
      } else {
        // Keep an edited row mounted through a reorder and reveal its new position.
        // Never override a deliberate focus handoff made by the host.
        if (ownsFocus && action.node.isConnected) {
          if (action.index !== next.index) {
            const top = next.index * rowHeight, bottom = top + rowHeight;
            if (top < nextScroll) nextScroll = top;
            else if (bottom > nextScroll + viewport) nextScroll = bottom - viewport;
          }
          if (active !== action.node) action.node.focus({ preventScroll: true });
        }
        action.index = next.index;
      }
    }
    nextScroll = Math.max(0, Math.min(nextScroll, maxScroll));
    if (element.scrollTop !== nextScroll) element.scrollTop = nextScroll;
    if (scroll !== nextScroll) setScroll(nextScroll);
  });

  return <div ref={root} className="rhine-virtual" role="list" aria-label={label} tabIndex={0} style={{ height: viewHeight }} onScroll={event => setScroll(event.currentTarget.scrollTop)} onFocusCapture={event => {
    const row = event.target.closest<HTMLElement>('[data-rhine-virtual-key]');
    const key = row?.dataset.rhineVirtualKey, record = key ? byKey.get(key) : undefined;
    if (!record) { focus.current = null; setFocusedKey(null); return; }
    focus.current = { key: record.key, node: event.target, index: record.index }; setFocusedKey(record.key);
  }} onBlurCapture={event => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    // A disappearing row may emit pre-detach blur; consume its fallback after
    // commit. Genuine Tab/click exits must cancel focus ownership immediately.
    if (event.relatedTarget || !focus.current || byKey.has(focus.current.key)) { focus.current = null; setFocusedKey(null); }
  }}><div style={{ height: totalHeight, position: 'relative' }}>{shown.map(record => <div role="listitem" key={record.key} id={`${id}-${encodeURIComponent(record.key)}`} data-rhine-virtual-key={record.key} aria-posinset={record.index + 1} aria-setsize={records.length} style={{ position: 'absolute', top: record.index * rowHeight, height: rowHeight, left: 0, right: 0 }}>{renderItem(record.item, record.index)}</div>)}</div></div>;
}
