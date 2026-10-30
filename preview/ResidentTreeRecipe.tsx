import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button, CopyButton, Dialog, EmptyState, Notice, Select, Tabs, Text } from '../components';
import './resident-tree.css';

// Recipe types, not a new component export. The host owns the DTO and selection.
export interface BrowseNode {
  id: string;
  parent: string | null;
  label: string;
  bounds: { x: number; y: number; width: number; height: number };
}
interface TreeProps {
  nodes: BrowseNode[];
  selected: string | null;
  hovered: string | null;
  expanded: Set<string>;
  updated: string | null;
  updateRevision?: number;
  onExpanded: (expanded: Set<string>) => void;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}
function visibleNodes(nodes: BrowseNode[], expanded: Set<string>) {
  const rows: { node: BrowseNode; level: number; position: number; size: number }[] = [];
  const walk = (parent: string | null, level: number) => {
    const siblings = nodes.filter(node => node.parent === parent);
    siblings.forEach((node, index) => {
      rows.push({ node, level, position: index + 1, size: siblings.length });
      if (expanded.has(node.id)) walk(node.id, level + 1);
    });
  };
  walk(null, 1);
  return rows;
}
function focusTreeRow(element: HTMLElement | null | undefined) {
  element?.focus({ preventScroll: true });
  (element?.querySelector<HTMLElement>(':scope > .rhine-browse-row') ?? element)?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
}
export function ResidentTree({ nodes, selected, hovered, expanded, updated, updateRevision = 0, onExpanded, onSelect, onHover }: TreeProps) {
  const prefix = useId();
  const root = useRef<HTMLDivElement>(null), ownsFocus = useRef(false), previous = useRef(nodes);
  const rows = visibleNodes(nodes, expanded);
  const [focused, setFocused] = useState(nodes[0]?.id ?? '');
  let active = focused;
  if (!rows.some(row => row.node.id === active)) {
    let ancestor = previous.current.find(node => node.id === active)?.parent;
    while (ancestor && !rows.some(row => row.node.id === ancestor)) ancestor = previous.current.find(node => node.id === ancestor)?.parent;
    active = ancestor ?? rows[0]?.node.id ?? '';
  }
  const releaseFocus = useRef(() => {});
  releaseFocus.current = () => {
    ownsFocus.current = false;
    setFocused(selected && rows.some(row => row.node.id === selected) ? selected : rows[0]?.node.id ?? '');
  };
  useEffect(() => {
    const pointer = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) releaseFocus.current(); };
    const blur = () => releaseFocus.current();
    document.addEventListener('pointerdown', pointer, true);
    window.addEventListener('blur', blur);
    return () => { document.removeEventListener('pointerdown', pointer, true); window.removeEventListener('blur', blur); };
  }, []);
  useLayoutEffect(() => {
    previous.current = nodes;
    if (focused === active) return;
    setFocused(active);
    if (ownsFocus.current) {
      const next = root.current?.querySelector<HTMLElement>('[tabindex="0"]') ?? root.current;
      focusTreeRow(next);
    }
  }, [nodes, active, focused]);
  useLayoutEffect(() => {
    if (!ownsFocus.current && selected && rows.some(row => row.node.id === selected)) setFocused(selected);
  }, [selected, nodes, expanded]);
  const focus = (id: string) => {
    setFocused(id);
    focusTreeRow(Array.from(root.current?.querySelectorAll<HTMLElement>('[data-node-id]') ?? []).find(element => element.dataset.nodeId === id));
  };
  const toggle = (id: string) => { const next = new Set(expanded); if (next.has(id)) next.delete(id); else next.add(id); onExpanded(next); };
  const renderRow = ({ node, level, position, size }: typeof rows[number]): ReactNode => {
      const branch = nodes.some(child => child.parent === node.id);
      return <div key={node.id} id={`${prefix}-${node.id}`} data-node-id={node.id} role="treeitem"
        aria-label={`${node.label} · ${node.id}`} aria-level={level} aria-posinset={position} aria-setsize={size}
        aria-expanded={branch ? expanded.has(node.id) : undefined} aria-selected={selected === node.id}
        tabIndex={active === node.id ? 0 : -1} data-hovered={hovered === node.id || undefined} data-updated={updated === node.id || undefined} data-update-cycle={updated === node.id ? updateRevision % 2 : undefined}
        className="rhine-browse-item"
        onFocus={event => { if (event.target === event.currentTarget) { setFocused(node.id); event.currentTarget.querySelector<HTMLElement>(':scope > .rhine-browse-row')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' }); } }}
        onClick={event => { event.stopPropagation(); focus(node.id); if ((event.target as Element).closest('[data-disclosure]')) toggle(node.id); else onSelect(node.id); }}
        onKeyDown={event => {
          const index = rows.findIndex(row => row.node.id === node.id);
          const handled = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' '].includes(event.key);
          if (!handled) return;
          event.preventDefault(); event.stopPropagation();
          if (event.key === 'ArrowDown') focus(rows[Math.min(index + 1, rows.length - 1)].node.id);
          if (event.key === 'ArrowUp') focus(rows[Math.max(index - 1, 0)].node.id);
          if (event.key === 'Home') focus(rows[0].node.id);
          if (event.key === 'End') focus(rows[rows.length - 1].node.id);
          if (event.key === 'ArrowRight' && branch) { if (!expanded.has(node.id)) toggle(node.id); else focus(rows[index + 1].node.id); }
          if (event.key === 'ArrowLeft') { if (branch && expanded.has(node.id)) toggle(node.id); else if (node.parent) focus(node.parent); }
          if (event.key === 'Enter' || event.key === ' ') onSelect(node.id);
        }}>
        <div className="rhine-browse-row" style={{ '--rhine-browse-depth': Math.min(level - 1, 3) } as CSSProperties} onPointerEnter={() => onHover(node.id)} onPointerLeave={() => onHover(null)}><span data-disclosure aria-hidden="true" className="rhine-browse-disclosure">{branch ? expanded.has(node.id) ? '−' : '+' : '·'}</span>
        <span className="rhine-browse-label">{level > 4 && <small>第 {level} 层 · </small>}{node.label}<small className="rhine-browse-id">{node.id}</small>{updated === node.id && <span className="rhine-browse-update">已更新</span>}</span>
        </div>
        {branch && expanded.has(node.id) && <div role="group">{rows.filter(row => row.node.parent === node.id).map(renderRow)}</div>}
      </div>;
  };
  return <div ref={root} role="tree" aria-label="常驻层级浏览" className="rhine-browse-tree"
    tabIndex={rows.length ? undefined : 0} onFocusCapture={() => { ownsFocus.current = true; }}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) releaseFocus.current(); }}>
    {rows.filter(row => row.node.parent === null).map(renderRow)}
  </div>;
}

export function syntheticNodes(target: string, hierarchyDepth = 7): BrowseNode[] {
  return [
    { id: `${target}-root`, parent: null, label: '合成工作空间', bounds: { x: 0, y: 0, width: 320, height: 240 } },
    ...Array.from({ length: hierarchyDepth }, (_, i) => ({ id: `${target}-depth-${i}`, parent: i ? `${target}-depth-${i - 1}` : `${target}-root`, label: `第${i + 2}层 · 完整节点身份与很长的多语言标签 Synthetic hierarchy identity-${i + 1}`, bounds: { x: 12 + Math.min(i, 6) * 8, y: 12 + Math.min(i, 6) * 8, width: 280 - Math.min(i, 6) * 16, height: 200 - Math.min(i, 6) * 16 } })),
    ...Array.from({ length: 14 }, (_, i) => ({ id: `${target}-item-${i}`, parent: `${target}-root`, label: i === 13 ? '末项 · 最后一个完整可达节点 Last accessible object' : `合成对象 ${i + 1}`, bounds: { x: (i % 4) * 70 + 15, y: Math.floor(i / 4) * 45 + 25, width: 52, height: 32 } })),
  ];
}

export function ResidentTreeWorkspace({ copy = async text => navigator.clipboard.writeText(text), hierarchyDepth = 7 }: { copy?: (text: string) => Promise<void>; hierarchyDepth?: number }) {
  const [canvasTarget, setCanvasTarget] = useState('alpha'), [fixed, setFixed] = useState<string | null>(null);
  const target = fixed ?? canvasTarget;
  const [nodes, setNodes] = useState(() => syntheticNodes(target, hierarchyDepth));
  const [expanded, setExpanded] = useState(() => new Set(syntheticNodes(target, hierarchyDepth).map(node => node.id)));
  const [selected, setSelected] = useState<string | null>('alpha-root'), [hovered, setHovered] = useState<string | null>(null);
  const [updated, setUpdated] = useState<string | null>(null), [revision, setRevision] = useState(0);
  const [status, setStatus] = useState<'ready' | 'loading' | 'error'>('ready');
  const [fail, setFail] = useState(false), [copyFails, setCopyFails] = useState(false), [tab, setTab] = useState('identity');
  const [ratio, setRatio] = useState(48), [canvasFocus, setCanvasFocus] = useState('alpha-root');
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null), epoch = useRef(0);
  const pending = useRef(false), split = useRef<HTMLDivElement>(null), drag = useRef<number | null>(null);
  const cancel = () => { epoch.current++; pending.current = false; if (refreshTimer.current) clearTimeout(refreshTimer.current); refreshTimer.current = null; };
  useEffect(() => () => cancel(), []);
  useLayoutEffect(() => {
    cancel(); const next = syntheticNodes(target, hierarchyDepth); setNodes(next); setExpanded(new Set(next.map(node => node.id)));
    setSelected(next[0].id); setHovered(null); setCanvasFocus(next[0].id); setUpdated(null); setStatus('ready');
  }, [target, hierarchyDepth]);
  useEffect(() => {
    if (!updated) return;
    const timer = setTimeout(() => setUpdated(null), 1000);
    return () => clearTimeout(timer);
  }, [updated, revision]);
  const refresh = () => {
    if (pending.current) return;
    pending.current = true; const request = ++epoch.current; setStatus('loading');
    refreshTimer.current = setTimeout(() => {
      if (epoch.current !== request) return;
      pending.current = false; refreshTimer.current = null;
      if (fail) { setStatus('error'); return; }
      setStatus('ready'); const id = selected ?? nodes[0]?.id ?? `${target}-root`;
      setNodes(current => (current.length ? current : syntheticNodes(target, hierarchyDepth)).map(node => node.id === id ? { ...node, label: node.label.replace(/ · 快照 \d+$/, '') + ` · 快照 ${revision + 1}` } : node));
      setRevision(value => value + 1); setUpdated(id ?? null);
    }, 500);
  };
  const select = (id: string) => {
    setSelected(id); const next = new Set(expanded); let parent = nodes.find(node => node.id === id)?.parent;
    while (parent) { next.add(parent); parent = nodes.find(node => node.id === parent)?.parent; }
    setExpanded(next);
  };
  const hit = (clientX: number, clientY: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect(); const x = (clientX - rect.left) / rect.width * 320, y = (clientY - rect.top) / rect.height * 240;
    return [...nodes].reverse().find(node => x >= node.bounds.x && x <= node.bounds.x + node.bounds.width && y >= node.bounds.y && y <= node.bounds.y + node.bounds.height)?.id ?? null;
  };
  const effectiveCanvasFocus = nodes.some(node => node.id === canvasFocus) ? canvasFocus : nodes[0]?.id ?? '无节点';
  const current = nodes.find(node => node.id === selected);
  const removeSelected = () => {
    if (!selected) return;
    const removed = new Set([selected]); nodes.forEach(node => { if (node.parent && removed.has(node.parent)) removed.add(node.id); });
    const parent = nodes.find(node => node.id === selected)?.parent ?? null;
    setNodes(nodes.filter(node => !removed.has(node.id))); setSelected(parent); setHovered(null); setUpdated(null);
  };
  return <section className="rhine-browse-workspace" aria-label="常驻树只读工作台" data-target={target} data-revision={revision}>
    <div className="rhine-browse-controls">
      <Select label="画布目标" value={canvasTarget} onChange={event => setCanvasTarget(event.target.value)}><option value="alpha">合成目标 A</option><option value="beta">合成目标 B</option></Select>
      <Button variant="secondary" onClick={() => setFixed(fixed ? null : target)}>{fixed ? '恢复跟随' : '固定当前目标'}</Button>
      <Button variant="secondary" busy={status === 'loading'} busyLabel="正在刷新" onClick={refresh}>刷新快照</Button>
      <Button variant="quiet" onClick={() => setFail(value => !value)} aria-pressed={fail}>刷新失败示例</Button>
      <Button variant="quiet" onClick={removeSelected} disabled={!selected}>移除选中子树</Button>
      <Button variant="quiet" onClick={() => { cancel(); setNodes([]); setSelected(null); setUpdated(null); setStatus('ready'); }}>空快照</Button>
    </div>
    <Text role="status" aria-label="快照状态">{fixed ? '固定' : '跟随'}目标 {target === 'alpha' ? 'A' : 'B'} · 来源：{target === 'alpha' ? '单源布局树' : '单源可访问树'} · {status === 'loading' ? nodes.length ? '刷新中，保留旧快照' : '首次读取中' : status === 'error' ? nodes.length ? '刷新失败，保留旧快照' : '读取失败，暂无快照' : nodes.length ? `只读快照 ${revision}` : '暂无节点'}</Text>
    {status === 'error' && <Notice tone="error" title="读取失败">{nodes.length ? '旧快照仍可浏览；关闭失败示例后重试。' : '当前没有快照；关闭失败示例后重试。'}</Notice>}
    <div className="rhine-browse-split" ref={split} style={{ '--rhine-browse-ratio': `${ratio}%` } as CSSProperties}>
      <div className="rhine-browse-pane"><Text as="h3" variant="heading">层级浏览</Text><Text variant="caption">方向键移动焦点，Enter / 空格选择；展开不改变选择。</Text>
        <ResidentTree nodes={nodes} selected={selected} hovered={hovered} expanded={expanded} updated={updated} updateRevision={revision} onExpanded={setExpanded} onSelect={select} onHover={setHovered} />
        {!nodes.length && <EmptyState title={status === 'loading' ? '正在读取节点' : status === 'error' ? '尚未取得快照' : '暂无节点'} description={status === 'loading' ? '等待合成读取结果。' : status === 'error' ? '读取失败，可关闭失败示例后重试。' : '当前快照没有节点，刷新可重新读取合成数据。'} action={<Button variant="secondary" onClick={() => { cancel(); setStatus('ready'); setNodes(syntheticNodes(target, hierarchyDepth)); setExpanded(new Set(syntheticNodes(target, hierarchyDepth).map(node => node.id))); setSelected(`${target}-root`); }}>恢复合成快照</Button>} />}
      </div>
      <div role="separator" tabIndex={0} aria-label="树与画布分隔条" aria-orientation="vertical" aria-valuemin={30} aria-valuemax={70} aria-valuenow={Math.round(ratio)} className="rhine-browse-separator"
        onKeyDown={event => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); setRatio(value => event.key === 'Home' ? 30 : event.key === 'End' ? 70 : Math.max(30, Math.min(70, value + (event.key === 'ArrowRight' ? 2 : -2)))); }}
        onPointerDown={event => { drag.current = event.clientX; event.currentTarget.setPointerCapture(event.pointerId); }}
        onPointerMove={event => { if (drag.current === null) return; const delta = event.clientX - drag.current; drag.current = event.clientX; const width = split.current?.getBoundingClientRect().width ?? 1; setRatio(value => Math.max(30, Math.min(70, value + delta / width * 100))); }}
        onPointerUp={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} />
      <div className="rhine-browse-pane"><Text as="h3" variant="heading">几何画布</Text>
        {canvasTarget !== target ? <Notice title="画布目标已切换">树保持固定目标；恢复跟随后再联动。</Notice> : <div role="button" tabIndex={0} aria-label={`合成几何画布 · 键盘焦点 ${effectiveCanvasFocus}`} className="rhine-browse-canvas"
          onPointerMove={event => setHovered(hit(event.clientX, event.clientY, event.currentTarget))} onPointerLeave={() => setHovered(null)}
          onClick={event => { const id = hit(event.clientX, event.clientY, event.currentTarget); if (id) { select(id); setCanvasFocus(id); } }}
          onKeyDown={event => { if (!['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(event.key)) return; event.preventDefault(); const i = Math.max(0, nodes.findIndex(node => node.id === effectiveCanvasFocus)); const next = nodes[event.key === 'Home' ? 0 : event.key === 'End' ? nodes.length - 1 : event.key === 'ArrowDown' ? Math.min(i + 1, nodes.length - 1) : event.key === 'ArrowUp' ? Math.max(0, i - 1) : i]; if (next) { setCanvasFocus(next.id); if (event.key === 'Enter' || event.key === ' ') select(next.id); } }}>
          <svg viewBox="0 0 320 240" preserveAspectRatio="none" aria-hidden="true">{nodes.map(node => <rect key={node.id} data-canvas-id={node.id} {...node.bounds} data-selected={node.id === selected || undefined} data-hovered={node.id === hovered || undefined} />)}</svg>
        </div>}
        <Text variant="caption">画布方向上下 / Home / End 移动，Enter / 空格选择。坐标只来自合成 DTO。</Text>
        <Text aria-label="选中身份">{current ? `${current.label} · ${current.id}` : '未选择节点'}</Text>
        <Dialog title="只读节点详情" description="合成 DTO；复制只生成草稿，不执行命令。" trigger={<Button variant="secondary" disabled={!current}>查看节点详情</Button>}>
          <Tabs label="节点详情" value={tab} onValueChange={setTab} items={[
            { value: 'identity', label: '身份', content: <div className="rhine-browse-detail"><Text>{current?.label ?? '原节点已移除'}</Text><Text variant="code">{current?.id ?? '无当前节点'}</Text><Text>来源：{target === 'alpha' ? '单源布局树' : '单源可访问树'}</Text></div> },
            { value: 'draft', label: '草稿', content: <div className="rhine-browse-detail"><Text variant="code">{JSON.stringify(current ?? null, null, 2)}</Text><Button variant="quiet" aria-pressed={copyFails} onClick={() => setCopyFails(value => !value)}>复制失败示例</Button><CopyButton value={JSON.stringify(current ?? null)} label="复制合成草稿" copy={async text => { if (copyFails) throw new Error('Synthetic copy failure'); await copy(text); }} /></div> },
          ]} />
        </Dialog>
      </div>
    </div>
  </section>;
}
