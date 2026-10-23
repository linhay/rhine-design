import { useId, useState } from 'react';
import { Text } from './Typography';

export type TimelineStatus = 'healthy' | 'recovered' | 'degraded' | 'failed' | 'unknown';
export interface TimelineSegment { id: string; label: string; status: TimelineStatus }
export const timelineLabels: Record<TimelineStatus, string> = { healthy: '有输出·未见异常', recovered: '重试已恢复', degraded: '异常·结果待确认', failed: '存在最终失败', unknown: '未知 / 无数据' };

/** Host supplies ordered, validated evidence; this component never computes a health score. */
export function StatusTimeline({ label, segments, startLabel, endLabel, compact = false }: { label: string; segments: TimelineSegment[]; startLabel: string; endLabel: string; compact?: boolean }) {
  const [index, setIndex] = useState<number>();
  const detailId = useId();
  const selected = Math.min(index ?? segments.length - 1, segments.length - 1);
  const segment = segments[selected];
  return <div className={`rhine-timeline${compact ? ' rhine-timeline--compact' : ''}`}>
    <div className="rhine-timeline__track">
      <div className="rhine-timeline__bars" aria-hidden="true">{segments.map((item, i) => <span key={item.id} data-status={item.status} data-selected={i === selected} />)}</div>
      <input type="range" min={0} max={Math.max(0, segments.length - 1)} value={Math.max(0, selected)} disabled={!segments.length}
        aria-label={label} aria-valuetext={segment ? `${segment.label} · ${timelineLabels[segment.status]}` : '暂无记录'} aria-describedby={detailId}
        onChange={event => setIndex(Number(event.target.value))}
        onPointerMove={event => { if (event.pointerType !== 'mouse' || !segments.length) return; const rect = event.currentTarget.getBoundingClientRect(); setIndex(Math.min(segments.length - 1, Math.max(0, Math.floor((event.clientX - rect.left) / rect.width * segments.length)))); }} />
    </div>
    <div className={compact ? 'rhine-sr-only' : 'rhine-timeline__range'}><Text variant="caption" tone="muted">{startLabel}</Text><Text variant="caption" tone="muted">{endLabel}</Text></div>
    <Text id={detailId} className="rhine-timeline__detail" variant="caption">{segment ? `${segment.label} · ${timelineLabels[segment.status]}` : '暂无记录'}</Text>
  </div>;
}

export function TimelineLegend() {
  return <ul className="rhine-timeline__legend" aria-label="健康记录图例">{Object.entries(timelineLabels).map(([status, label]) => <li key={status}><span data-status={status} aria-hidden="true"/>{label}</li>)}</ul>;
}
