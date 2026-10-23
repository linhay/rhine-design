import { useId, useLayoutEffect, useRef, useState } from 'react';
import * as PopoverBase from '@radix-ui/react-popover';
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
export const timelineLabels: Record<TimelineStatus, string> = { healthy: '有输出·未见异常', recovered: '重试已恢复', degraded: '异常·结果待确认', failed: '存在最终失败', unknown: '未知 / 无数据' };

/** Host supplies ordered, validated evidence; this component never computes a health score. */
export function StatusTimeline({ label, segments, startLabel, endLabel, compact = false }: { label: string; segments: TimelineSegment[]; startLabel: string; endLabel: string; compact?: boolean }) {
  const [index, setIndex] = useState<number>();
  const [open, setOpen] = useState(false), [container, setContainer] = useState<HTMLElement>();
  const root = useRef<HTMLDivElement>(null), slider = useRef<HTMLInputElement>(null), popup = useRef<HTMLDivElement>(null), returning = useRef(false);
  useLayoutEffect(() => { setContainer(root.current?.closest<HTMLElement>('.rhine-theme') ?? document.body); }, []);
  const detailId = useId();
  const selected = Math.min(index ?? segments.length - 1, segments.length - 1);
  const segment = segments[selected];
  const summary = segment ? `${segment.label} · ${timelineLabels[segment.status]}` : '暂无记录';
  const hasPopup = !!segment && (compact || !!segment.detail);
  return <div ref={root} className={`rhine-timeline${compact ? ' rhine-timeline--compact' : ''}`}>
    <PopoverBase.Root open={open && hasPopup} onOpenChange={setOpen}><PopoverBase.Anchor asChild><div className="rhine-timeline__track">
      <div className="rhine-timeline__bars" aria-hidden="true">{segments.map((item, i) => <span key={item.id} data-status={item.status} data-selected={i === selected} />)}</div>
      <input ref={slider} type="range" min={0} max={Math.max(0, segments.length - 1)} value={Math.max(0, selected)} disabled={!segments.length}
        aria-label={label} aria-valuetext={segment ? `${segment.label} · ${timelineLabels[segment.status]}` : '暂无记录'} aria-describedby={detailId}
        aria-details={open && hasPopup ? `${detailId}-popup` : undefined}
        onFocus={() => { if (!returning.current) setOpen(true); returning.current = false; }}
        onKeyDown={event => { if (event.key === 'Escape' && open && hasPopup) { event.preventDefault(); event.stopPropagation(); setOpen(false); } }}
        onChange={event => { setIndex(Number(event.target.value)); setOpen(true); }}
        onPointerDown={() => setOpen(true)}
        onPointerMove={event => { if (event.pointerType !== 'mouse' || !segments.length) return; const rect = event.currentTarget.getBoundingClientRect(); setIndex(Math.min(segments.length - 1, Math.max(0, Math.floor((event.clientX - rect.left) / rect.width * segments.length)))); setOpen(true); }} />
    </div></PopoverBase.Anchor><PopoverBase.Portal container={container}><PopoverBase.Content ref={popup} id={`${detailId}-popup`} className="rhine-timeline-popover" side="top" sideOffset={8} collisionPadding={12} aria-label={`${label}时段详情`}
      onOpenAutoFocus={event => event.preventDefault()} onCloseAutoFocus={event => { event.preventDefault(); if (document.activeElement === document.body || popup.current?.contains(document.activeElement)) { returning.current = true; slider.current?.focus(); } }}
      onInteractOutside={event => { if (root.current?.contains(event.target as Node)) event.preventDefault(); }}>
      <div className="rhine-dialog__head"><strong>{summary}</strong><PopoverBase.Close asChild><Button variant="quiet" aria-label="关闭时段详情">关闭</Button></PopoverBase.Close></div>
      {segment?.detail && <><KeyValue items={[
        { key: 'start', label: '开始时间', value: segment.detail.start }, { key: 'end', label: '结束时间', value: segment.detail.end },
        { key: 'reason', label: '状态原因', value: segment.detail.reason || '未提供' },
        ...(segment.detail.counts ?? []).map(item => ({ key: `count-${item.id}`, label: item.label, value: item.value === null || !Number.isFinite(item.value) ? '未知' : `${item.value}${item.unit ? ` ${item.unit}` : ''}` })),
      ]} /><p className="rhine-text rhine-text--caption">统计口径：{segment.detail.methodology || '未提供，需向数据来源确认。'}</p></>}
    </PopoverBase.Content></PopoverBase.Portal></PopoverBase.Root>
    <div className={compact ? 'rhine-sr-only' : 'rhine-timeline__range'}><Text variant="caption" tone="muted">{startLabel}</Text><Text variant="caption" tone="muted">{endLabel}</Text></div>
    <Text id={detailId} className={compact && segment ? 'rhine-sr-only' : 'rhine-timeline__summary'} variant="caption">{summary}</Text>
  </div>;
}

export function TimelineLegend() {
  return <ul className="rhine-timeline__legend" aria-label="健康记录图例">{Object.entries(timelineLabels).map(([status, label]) => <li key={status}><span data-status={status} aria-hidden="true"/>{label}</li>)}</ul>;
}
