import { useEffect, useState, type ReactNode } from 'react';
import { Text } from './Typography';
import { StatusTimeline, type StatusTimelineProps, type TimelineDataProps } from './StatusTimeline';

export interface StatusTimelineItem {
  id: string;
  title: string;
  summary?: ReactNode;
  note?: string;
  timeline: (TimelineDataProps & Pick<StatusTimelineProps, 'startLabel' | 'endLabel' | 'disabled'>) | null;
  unavailableLabel?: string;
}
export interface StatusTimelineListProps {
  label: string;
  items: StatusTimelineItem[];
  emptyLabel?: string;
  /** Compact list/legend recipe: pair the space-1 tail with Stack gap={1} to preserve 44px targets. */
  density?: 'default' | 'compact';
}

/** Hosts supply ordering, summaries and evidence; the list only coordinates presentation. */
export function StatusTimelineList({ label, items, emptyLabel = '暂无历史记录', density = 'default' }: StatusTimelineListProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  useEffect(() => {
    const item = items.find(item => item.id === openId);
    if (openId !== null && (!item?.timeline || item.timeline.disabled || !item.timeline.segments.length)) setOpenId(null);
  }, [items, openId]);
  if (!items.length) return <Text variant="caption">{emptyLabel}</Text>;
  return <ul className={`rhine-timeline-list${density === 'compact' ? ' rhine-timeline-list--dense' : ''}`} aria-label={label}>
    {items.map(item => <li className="rhine-timeline-list__item" key={item.id}>
      <div className="rhine-timeline-list__heading"><Text as="h4" variant="body">{item.title}</Text>
        {item.summary != null && <Text variant="caption" tone="muted">{item.summary}</Text>}
      </div>
      {item.note && <Text variant="caption" tone="muted">{item.note}</Text>}
      {item.timeline ? <StatusTimeline {...item.timeline} compact label={`${item.title} 历史时段`}
        open={openId === item.id} onOpenChange={next => setOpenId(current => next ? item.id : current === item.id ? null : current)} />
        : <Text variant="caption" tone="muted">{item.unavailableLabel ?? '历史记录暂不可用 · 未知'}</Text>}
    </li>)}
  </ul>;
}
