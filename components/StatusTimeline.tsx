import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import * as PopoverBase from '@radix-ui/react-popover';
import { useFloatingScale } from './useFloatingScale';
import { Text } from './Typography';
import { KeyValue } from './Data';
import { Button } from './components';

export type TimelineStatus = 'healthy' | 'recovered' | 'degraded' | 'failed' | 'unknown';
export interface TimelineDetail {
  start: string; end: string; reason?: string;
  counts?: { id: string; label: string; value: number | null; unit?: string }[];
  methodology?: string;
}
export interface TimelineSegment { id: string; label: string; status: TimelineStatus; detail?: TimelineDetail }
export type TimelineStatusLabels = Partial<Record<TimelineStatus, string>>;
export type TimelineOutcome = 'direct' | 'retried' | 'failed' | 'unknown';
export interface TimelineComposition {
  /** Deduplicated requests, including requests whose result is unknown. */
  total: number;
  counts: Record<TimelineOutcome, number>;
  coverage: 'complete' | 'partial' | 'missing';
  reason?: string;
}
export interface TimelineCompositionSegment { id: string; label: string; composition: TimelineComposition; detail?: TimelineDetail }
export type TimelineDataProps =
  | { mode?: 'status'; segments: TimelineSegment[]; statusLabels?: TimelineStatusLabels }
  | { mode: 'composition'; segments: TimelineCompositionSegment[]; statusLabels?: never };
export type StatusTimelineProps = TimelineDataProps & {
  label: string; startLabel: string; endLabel: string; compact?: boolean; disabled?: boolean;
  activeId?: string; defaultActiveId?: string; onActiveChange?: (id: string) => void;
  open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
}
export const timelineLabels: Record<TimelineStatus, string> = { healthy: '有输出·未见异常', recovered: '重试已恢复', degraded: '异常·结果待确认', failed: '存在最终失败', unknown: '未知 / 无数据' };

const outcomeLabels: Record<TimelineOutcome, string> = { direct: '直接成功', retried: '重试后成功', failed: '最终失败', unknown: '结果未知' };
const outcomes = Object.keys(outcomeLabels) as TimelineOutcome[];
const outcomeStatuses: Record<TimelineOutcome, TimelineStatus> = { direct: 'healthy', retried: 'recovered', failed: 'failed', unknown: 'unknown' };
const statusLabel = (status: TimelineStatus, labels?: TimelineStatusLabels) => labels?.[status]?.trim() || timelineLabels[status];
const percentageText = (value: number) => value > 0 && value < 0.01 ? '<0.01%' : value < 100 && value > 99.99 ? '>99.99%' : `${Number(value.toFixed(2))}%`;

function compositionView(data: TimelineComposition) {
  const validCount = (n: number) => Number.isSafeInteger(n) && n >= 0;
  const valid = validCount(data.total) && outcomes.every(key => validCount(data.counts[key])) && outcomes.reduce((sum, key) => sum + data.counts[key], 0) === data.total;
  const unavailable = data.coverage === 'missing' ? '缺失采集' : data.coverage === 'partial' ? '采集不完整' : data.coverage !== 'complete' || !valid ? '数据无效：计数须为非负安全整数，四类之和须等于总数' : data.total === 0 ? '无请求，占比不适用' : undefined;
  const usable = !unavailable;
  const reason = [unavailable, data.reason].filter(Boolean).join('；');
  const rows = outcomes.map(key => {
    const count = usable || (valid && data.coverage === 'complete') ? data.counts[key] : null;
    const percent = usable ? data.counts[key] / data.total * 100 : null;
    return { key, label: outcomeLabels[key], count, percent, text: `${count === null ? '数量未知' : `${count} 次`}（${percent === null ? '占比不适用' : percentageText(percent)}）` };
  });
  const total = valid && data.coverage === 'complete' ? `${data.total} 次` : '未知';
  return { rows, usable, reason, total, summary: `请求总数 ${total} · ${rows.map(row => `${row.label} ${row.text}`).join(' · ')}${reason ? ` · ${reason}` : ''}` };
}

function useTimelineHoverExit(trigger: RefObject<HTMLElement | null>, popup: RefObject<HTMLDivElement | null>, close: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cancel = () => { clearTimeout(timer.current); timer.current = undefined; };
  const leave = () => { cancel(); timer.current = setTimeout(() => {
    const keyboardFocus = document.activeElement === trigger.current && trigger.current?.matches(':focus-visible');
    if (!keyboardFocus && !popup.current?.contains(document.activeElement)) close();
  }, 150); };
  useEffect(() => cancel, []);
  return { cancel, leave };
}

/** Host supplies ordered, validated evidence; this component never computes a health score. */
export function StatusTimeline(props: StatusTimelineProps) {
  const { label, segments, startLabel, endLabel, compact = false, disabled = false, activeId, defaultActiveId, onActiveChange, open: controlledOpen, defaultOpen = false, onOpenChange } = props;
  const [localId, setLocalId] = useState(defaultActiveId);
  const [localOpen, setLocalOpen] = useState(defaultOpen), [container, setContainer] = useState<HTMLElement>();
  const open = controlledOpen ?? localOpen;
  const setOpen = (next: boolean) => { if (disabled && next) return; if (controlledOpen === undefined) setLocalOpen(next); if (next !== open) onOpenChange?.(next); };
  const root = useRef<HTMLDivElement>(null), slider = useRef<HTMLInputElement>(null), popup = useRef<HTMLDivElement>(null), returning = useRef(false), focusDetail = useRef(false);
  const detailHadFocus = useRef(false);
  useLayoutEffect(() => { setContainer(root.current?.closest<HTMLElement>('.rhine-theme') ?? document.body); }, []);
  const detailId = useId();
  const matched = segments.findIndex(item => item.id === (activeId ?? localId));
  const selected = matched < 0 ? segments.length - 1 : matched;
  const select = (index: number) => { const next = segments[index]?.id; if (!next || disabled) return; if (activeId === undefined) setLocalId(next); if (next !== segments[selected]?.id) onActiveChange?.(next); };
  const segment = segments[selected];
  const composition = props.mode === 'composition' && props.segments[selected] ? compositionView(props.segments[selected].composition) : undefined;
  const summary = segment ? `${segment.label} · ${composition?.summary ?? statusLabel((segment as TimelineSegment).status, props.statusLabels)}` : '暂无记录';
  const hasPopup = !disabled && !!segment && (compact || !!segment.detail || !!composition);
  const attachPopup = useFloatingScale(popup);
  const hover = useTimelineHoverExit(slider, popup, () => setOpen(false));
  return <div ref={root} className={`rhine-timeline${compact ? ' rhine-timeline--compact' : ''}${props.mode === 'composition' ? ' rhine-timeline--composition' : ''}`}
    onPointerEnter={hover.cancel}
    onPointerLeave={event => { if (event.pointerType === 'mouse' && !(event.relatedTarget instanceof Node && popup.current?.contains(event.relatedTarget))) hover.leave(); }}>
    <PopoverBase.Root open={open && hasPopup} onOpenChange={setOpen}><PopoverBase.Anchor asChild><div className="rhine-timeline__track">
      <div className="rhine-timeline__bars" aria-hidden="true">{segments.map((item, i) => props.mode === 'composition' ? <span className="rhine-timeline__bucket" key={item.id} data-selected={i === selected}>{(() => {
        const view = compositionView(props.segments[i].composition);
        return view.usable ? view.rows.map(row => <span key={row.key} data-outcome={row.key} style={{ height: `${row.percent}%` }} />) : <span data-outcome="unknown" style={{ height: '100%' }} />;
      })()}</span> : <span key={item.id} data-status={(item as TimelineSegment).status} data-selected={i === selected} />)}</div>
      <input ref={slider} type="range" min={0} max={Math.max(0, segments.length - 1)} value={Math.max(0, selected)} disabled={disabled || !segments.length}
        aria-label={label} aria-valuetext={summary} aria-describedby={detailId}
        aria-details={open && hasPopup ? `${detailId}-popup` : undefined} aria-controls={open && hasPopup ? `${detailId}-popup` : undefined} aria-haspopup={hasPopup ? 'dialog' : undefined}
        onFocus={() => { if (!returning.current) setOpen(true); returning.current = false; }}
        onKeyDown={event => {
          if (event.key === 'Escape' && open && hasPopup) { event.preventDefault(); event.stopPropagation(); setOpen(false); }
          if ((event.key === 'Enter' || event.key === ' ') && hasPopup) { event.preventDefault(); if (open) popup.current?.querySelector<HTMLButtonElement>('button')?.focus(); else { focusDetail.current = true; setOpen(true); } }
        }}
        onChange={event => { select(Number(event.target.value)); setOpen(true); }}
        onPointerDown={() => setOpen(true)}
        onPointerMove={event => { if (disabled || event.pointerType !== 'mouse' || !segments.length) return; const rect = event.currentTarget.getBoundingClientRect(); if (rect.width) select(Math.min(segments.length - 1, Math.max(0, Math.floor((event.clientX - rect.left) / rect.width * segments.length)))); setOpen(true); }} />
    </div></PopoverBase.Anchor><PopoverBase.Portal container={container}><PopoverBase.Content ref={attachPopup} id={`${detailId}-popup`} className="rhine-timeline-popover" side="top" sideOffset={8} collisionPadding={12} aria-label={`${label}时段详情`}
      onPointerEnter={hover.cancel}
      onPointerLeave={event => { if (event.pointerType === 'mouse' && !(event.relatedTarget instanceof Node && root.current?.contains(event.relatedTarget))) hover.leave(); }}
      onFocusCapture={() => { detailHadFocus.current = true; }}
      onBlurCapture={event => { if (event.relatedTarget && event.relatedTarget !== document.body && !event.currentTarget.contains(event.relatedTarget)) detailHadFocus.current = false; }}
      onOpenAutoFocus={event => { event.preventDefault(); if (focusDetail.current) { focusDetail.current = false; popup.current?.querySelector<HTMLButtonElement>('button')?.focus(); } }} onCloseAutoFocus={event => { event.preventDefault(); focusDetail.current = false; if (detailHadFocus.current && (document.activeElement === document.body || popup.current?.contains(document.activeElement))) { returning.current = true; slider.current?.focus(); } detailHadFocus.current = false; }}
      onInteractOutside={event => { if (root.current?.contains(event.target as Node)) event.preventDefault(); }}>
      <div className="rhine-dialog__head"><strong>{composition ? `${segment?.label} · 请求结果构成` : summary}</strong><PopoverBase.Close asChild><Button variant="quiet" aria-label="关闭时段详情">关闭</Button></PopoverBase.Close></div>
      {composition && <><KeyValue items={[
        { key: 'total', label: '请求总数', value: composition.total },
        ...composition.rows.map(row => ({ key: row.key, label: row.label, value: row.text })),
      ]} />{composition.reason && <Text>{composition.reason}</Text>}</>}
      {segment?.detail && <><KeyValue items={[
        { key: 'start', label: '开始时间', value: segment.detail.start }, { key: 'end', label: '结束时间', value: segment.detail.end },
        { key: 'reason', label: '状态原因', value: segment.detail.reason || '未提供' },
        ...(composition ? [] : segment.detail.counts ?? []).map(item => ({ key: `count-${item.id}`, label: item.label, value: item.value === null || !Number.isFinite(item.value) ? '未知' : `${item.value}${item.unit ? ` ${item.unit}` : ''}` })),
      ]} /><p className="rhine-text rhine-text--caption">统计口径：{segment.detail.methodology || '未提供，需向数据来源确认。'}</p></>}
    </PopoverBase.Content></PopoverBase.Portal></PopoverBase.Root>
    <div className={compact ? 'rhine-sr-only' : 'rhine-timeline__range'}><Text variant="caption" tone="muted">{startLabel}</Text><Text variant="caption" tone="muted">{endLabel}</Text></div>
    <Text id={detailId} className={compact && segment ? 'rhine-sr-only' : 'rhine-timeline__summary'} variant="caption">{summary}</Text>
  </div>;
}

export interface TimelineLegendItem { status: TimelineStatus; label: string; description?: string }
export interface TimelineLegendProps { label?: string; compact?: boolean; density?: 'default' | 'compact'; items?: TimelineLegendItem[]; statusLabels?: TimelineStatusLabels; mode?: 'status' | 'composition' }
const defaultLegendItems: TimelineLegendItem[] = Object.entries(timelineLabels).map(([status, label]) => ({ status: status as TimelineStatus, label }));

/** Short labels describe evidence; hosts provide the precise rules rather than relying on color. */
export function TimelineLegend({ label, compact = false, density = 'default', items: suppliedItems, statusLabels, mode = 'status' }: TimelineLegendProps) {
  const items = mode === 'composition' ? outcomes.map(key => ({ status: outcomeStatuses[key], label: outcomeLabels[key], description: suppliedItems?.find(item => item.status === outcomeStatuses[key])?.description })) : (suppliedItems ?? defaultLegendItems).map(item => ({ ...item, label: statusLabels?.[item.status]?.trim() || item.label }));
  const root = useRef<HTMLUListElement>(null);
  const [container, setContainer] = useState<HTMLElement>();
  const [active, setActive] = useState<TimelineStatus | null>(null);
  const protectedFocus = useRef(false);
  useLayoutEffect(() => { setContainer(root.current?.closest<HTMLElement>('.rhine-theme') ?? document.body); }, []);
  useEffect(() => { if (active && !items.some(item => item.status === active && item.description)) setActive(null); }, [active, items]);
  const ownsFocusedInteraction = () => {
    const legend = root.current, document = legend?.ownerDocument, focused = document?.activeElement;
    if (focused && legend?.contains(focused) && focused.matches(':focus-visible')) return true;
    const popupId = legend?.querySelector('[aria-expanded="true"]')?.getAttribute('aria-controls');
    return !!(focused && popupId && document?.getElementById(popupId)?.contains(focused));
  };
  useEffect(() => {
    const document = root.current?.ownerDocument;
    if (!document) return;
    const remember = () => {
      // Radix removes the focused popup before restoring its trigger. Body focus
      // in that gap is not a user decision to leave keyboard inspection.
      if (document.activeElement !== document.body) protectedFocus.current = ownsFocusedInteraction();
    };
    const release = () => { protectedFocus.current = false; };
    document.addEventListener('focusin', remember);
    document.addEventListener('pointerdown', release, true);
    document.defaultView?.addEventListener('blur', release);
    return () => {
      document.removeEventListener('focusin', remember);
      document.removeEventListener('pointerdown', release, true);
      document.defaultView?.removeEventListener('blur', release);
    };
  }, []);
  const openFromHover = (status: TimelineStatus) => {
    // Focus scrolling can move a different item under a stationary pointer.
    if (protectedFocus.current || ownsFocusedInteraction()) return;
    setActive(status);
  };
  return <ul ref={root} className={`rhine-timeline__legend${mode === 'composition' ? ' rhine-timeline__legend--composition' : ''}${compact ? ' rhine-timeline__legend--compact' : ''}${compact && density === 'compact' ? ' rhine-timeline__legend--dense' : ''}`} aria-label={label ?? (mode === 'composition' ? '请求结果图例' : '健康记录图例')}>
    {items.map(item => <LegendItem key={item.status} item={item} container={container} open={active === item.status}
      onHover={() => openFromHover(item.status)}
      onOpenChange={next => setActive(current => next ? item.status : current === item.status ? null : current)} />)}
  </ul>;
}

function LegendItem({ item, container, open, onOpenChange, onHover }: { item: TimelineLegendItem; container?: HTMLElement; open: boolean; onOpenChange: (open: boolean) => void; onHover: () => void }) {
  const id = useId(), trigger = useRef<HTMLButtonElement>(null), popup = useRef<HTMLDivElement>(null), returning = useRef(false);
  const detailHadFocus = useRef(false);
  const hover = useTimelineHoverExit(trigger, popup, () => onOpenChange(false));
  const attachPopup = useFloatingScale(popup);
  const marker = <span data-status={item.status} aria-hidden="true" />;
  if (!item.description) return <li>{marker}{item.label}</li>;
  return <li><PopoverBase.Root open={open} onOpenChange={onOpenChange}><PopoverBase.Anchor asChild>
    <button ref={trigger} type="button" className="rhine-timeline__legend-trigger" aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined}
      onFocus={event => {
        if (event.currentTarget.closest('.rhine-timeline__legend--compact')) event.currentTarget.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
        if (!returning.current) onOpenChange(true); returning.current = false;
      }}
      onClick={() => onOpenChange(true)}
      onPointerEnter={event => { if (event.pointerType === 'mouse') { hover.cancel(); onHover(); } }}
      onPointerLeave={event => { if (event.pointerType === 'mouse' && !(event.relatedTarget instanceof Node && popup.current?.contains(event.relatedTarget))) hover.leave(); }}
      onKeyDown={event => {
        if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); onOpenChange(false); }
        if ((event.key === 'Enter' || event.key === ' ') && open) { event.preventDefault(); popup.current?.querySelector<HTMLButtonElement>('button')?.focus(); }
      }}>
      {marker}{item.label}
    </button>
  </PopoverBase.Anchor><PopoverBase.Portal container={container}><PopoverBase.Content ref={attachPopup} id={id} className="rhine-timeline-popover" aria-label={`${item.label}规则`} side="top" sideOffset={8} collisionPadding={12}
    onFocusCapture={() => { detailHadFocus.current = true; }}
    onBlurCapture={event => { if (event.relatedTarget && event.relatedTarget !== document.body && !event.currentTarget.contains(event.relatedTarget)) detailHadFocus.current = false; }}
    onOpenAutoFocus={event => event.preventDefault()}
    onCloseAutoFocus={event => { event.preventDefault(); if (detailHadFocus.current && (popup.current?.contains(document.activeElement) || document.activeElement === document.body)) { returning.current = true; trigger.current?.focus(); } detailHadFocus.current = false; }}
    onInteractOutside={event => { if (event.target === trigger.current || trigger.current?.contains(event.target as Node)) event.preventDefault(); }}
    onPointerEnter={hover.cancel}
    onPointerLeave={event => { if (event.pointerType === 'mouse' && !(event.relatedTarget instanceof Node && trigger.current?.contains(event.relatedTarget))) hover.leave(); }}>
    <div className="rhine-dialog__head"><strong>{item.label}</strong><PopoverBase.Close asChild><Button variant="quiet" aria-label={`关闭${item.label}规则`}>关闭</Button></PopoverBase.Close></div>
    <Text>{item.description}</Text>
  </PopoverBase.Content></PopoverBase.Portal></PopoverBase.Root></li>;
}
