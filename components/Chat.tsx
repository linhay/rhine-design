import { createContext, useContext, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Badge, Button, Disclosure, Surface, type Tone } from './components';

export type ChatStatus = 'pending' | 'accepted' | 'declined' | 'blocked' | 'running' | 'partial' | 'succeeded' | 'failed' | 'cancelled' | 'expired' | 'unknown';
const statuses: Record<ChatStatus, [string, Tone]> = {
  pending: ['待回应', 'neutral'], accepted: ['已接受', 'neutral'], declined: ['已拒绝', 'neutral'],
  blocked: ['等待依赖', 'warning'], running: ['运行中', 'neutral'], partial: ['部分结果', 'warning'],
  succeeded: ['已完成', 'success'], failed: ['失败', 'error'], cancelled: ['已取消', 'neutral'],
  expired: ['已过期', 'warning'], unknown: ['状态未知', 'warning'],
};
const ReadOnlyContext = createContext(false);
export interface ChatCardProps {
  title: string;
  status: ChatStatus;
  /** Keep error/recovery or unknown-state context here, outside the disclosure. */
  summary: ReactNode;
  children?: ReactNode;
  /** Short visible label for the optional detail disclosure; the card title remains in its accessible name. */
  detailLabel?: string;
  actions?: ReactNode;
  readOnly?: boolean;
}
/** Structured content only. Business transitions and permissions belong to the host. */
export function ChatCard({ title, status, summary, children, detailLabel = '详情', actions, readOnly = false }: ChatCardProps) {
  const observing = useContext(ReadOnlyContext) || readOnly;
  const [label, tone] = Object.hasOwn(statuses, status) ? statuses[status] : statuses.unknown;
  return <Surface className="rhine-chat-card" padding="none">
    <div className="rhine-chat-card__heading"><strong>{title}</strong><Badge tone={tone}>{label}</Badge></div>
    <div className="rhine-chat-card__summary">{summary}</div>
    {children && <Disclosure title={detailLabel} ariaLabel={`${title} · ${detailLabel}`}>{children}</Disclosure>}
    {!observing && actions && <div className="rhine-chat-actions">{actions}</div>}
  </Surface>;
}
export interface ChatMember { id: string; name: string; avatar?: ReactNode }
interface ChatEntryBase { id: string; /** Host-localized day label, also a grouping boundary. */ day: string; content: ReactNode }
export interface ChatMessage extends ChatEntryBase {
  kind: 'message'; member: ChatMember;
  /** ISO 8601 timestamp with explicit offset. */ dateTime: string;
  /** Host-localized display time. */ time: string;
  actions?: ReactNode;
}
export interface ChatEvent extends ChatEntryBase { kind: 'event' }
export type ChatEntry = ChatMessage | ChatEvent;
export interface ChatMemberAppearance {
  /** Logical side, independent of human/agent/observer roles. Unmapped members use start. */
  align?: 'start' | 'end';
  tone?: 'subtle' | 'strong';
}
export interface ChatThreadProps {
  /** fill requires a bounded host height; standalone keeps the original 32rem viewport. */
  layout?: 'standalone' | 'fill';
  appearance?: 'plain' | 'bubble';
  /** Stable member ids own their presentation; used only by bubble appearance. */
  memberAppearance?: Readonly<Record<string, ChatMemberAppearance>>;
  controls?: 'full' | 'compact';
  className?: string;
  style?: CSSProperties;
  label: string;
  /** Stable unique ids in chronological order; prepend older entries without replacing existing ids. */
  entries: readonly ChatEntry[];
  readOnly?: boolean;
  hasEarlier?: boolean;
  loadingEarlier?: boolean;
  historyError?: string;
  onLoadEarlier?: () => void;
  /** A coarse host-owned announcement. Do not pass every streamed token. */
  announcement?: string;
}
function isContinuation(previous: ChatEntry | undefined, entry: ChatMessage) {
  if (previous?.kind !== 'message' || previous.member.id !== entry.member.id || previous.day !== entry.day) return false;
  const gap = Date.parse(entry.dateTime) - Date.parse(previous.dateTime);
  return gap >= 0 && gap <= 5 * 60_000;
}
type Anchor = { id: string; offset: number };

/** A non-virtualized, chronological reading viewport. No network, model or read receipts. */
export function ChatThread({ label, entries, readOnly = false, hasEarlier = false, loadingEarlier = false, historyError, onLoadEarlier, announcement = '', layout = 'standalone', appearance = 'plain', memberAppearance, controls = 'full', className = '', style }: ChatThreadProps) {
  const id = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLOListElement>(null);
  const follow = useRef(true);
  const anchor = useRef<Anchor | null>(null);
  const previousFirst = useRef<string | undefined>(undefined);
  const initialized = useRef(false);
  const previousIds = useRef(new Set<string>());
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [following, setFollowing] = useState(true);
  const rows = () => Array.from(content.current?.querySelectorAll<HTMLElement>('[data-chat-entry]') ?? []);
  function remember() {
    const el = viewport.current;
    if (!el) return;
    const row = rows().find(row => row.offsetTop + row.offsetHeight > el.scrollTop);
    anchor.current = row ? { id: row.dataset.chatEntry!, offset: row.offsetTop - el.scrollTop } : null;
  }
  function pause() { follow.current = false; setFollowing(false); remember(); }
  function restore() {
    const el = viewport.current;
    if (!el) return;
    if (follow.current) el.scrollTop = el.scrollHeight;
    else if (anchor.current) {
      const row = rows().find(row => row.dataset.chatEntry === anchor.current!.id);
      if (row) el.scrollTop = row.offsetTop - anchor.current.offset;
    }
    remember();
  }
  // Commit before paint: a prepend preserves the same visible row, even if streaming also appends.
  useLayoutEffect(() => {
    const first = entries[0]?.id;
    const prepended = initialized.current && first !== previousFirst.current && entries.some(entry => entry.id === previousFirst.current);
    if (prepended) { follow.current = false; setFollowing(false); }
    const firstExisting = entries.findIndex(entry => previousIds.current.has(entry.id));
    if (initialized.current && !follow.current && firstExisting >= 0 && entries.slice(firstExisting).some(entry => !previousIds.current.has(entry.id))) setHasNewMessages(true);
    previousIds.current = new Set(entries.map(entry => entry.id));
    restore();
    previousFirst.current = first;
    initialized.current = true;
  });
  useLayoutEffect(() => {
    if (!content.current || !viewport.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(restore);
    observer.observe(content.current);
    observer.observe(viewport.current);
    return () => observer.disconnect();
    // The observer reads mutable viewport/anchor/follow refs, not entry props.
  }, []);
  return <ReadOnlyContext.Provider value={readOnly}><div className={`rhine-chat ${className}`} style={style} data-layout={layout} data-appearance={appearance} data-controls={controls}>
    <div className="rhine-chat-toolbar">
      <Button variant="quiet" aria-disabled={!hasEarlier || loadingEarlier || !onLoadEarlier} busy={loadingEarlier} busyLabel="正在加载更早消息"
        onClick={() => { if (!hasEarlier || loadingEarlier || !onLoadEarlier) return; pause(); onLoadEarlier(); }}>
        {loadingEarlier ? '正在加载更早消息' : hasEarlier ? '加载更早消息' : '已到最早消息'}
      </Button>
      {readOnly && <Badge>只读观察</Badge>}
    </div>
    {historyError && <p className="rhine-chat-history-error" role="alert">{historyError}</p>}
    <div ref={viewport} id={id} className="rhine-chat-viewport" role="region" aria-label={label} tabIndex={0}
      onScroll={() => {
        const el = viewport.current!;
        // Reaching the bottom does not silently cancel a disclosure/history pause.
        if (el.scrollHeight - el.clientHeight - el.scrollTop > 8 && follow.current) { follow.current = false; setFollowing(false); }
        remember();
      }}
      onClickCapture={event => {
        const target = event.target as HTMLElement;
        if (target.closest('summary, [aria-expanded]:not([aria-haspopup])')) pause();
      }}
      onFocusCapture={event => { if (event.target !== event.currentTarget) pause(); }}
      onWheel={event => { if (event.deltaY < 0) pause(); }}
      onKeyDown={event => { if (['ArrowUp', 'PageUp', 'Home'].includes(event.key)) pause(); }}>
      <ol ref={content} className="rhine-chat-list">
        {entries.map((entry, index) => {
          const previous = entries[index - 1];
          const presentation = entry.kind === 'message' && appearance === 'bubble' && memberAppearance && Object.hasOwn(memberAppearance, entry.member.id) ? memberAppearance[entry.member.id] : undefined;
          const continuation = entry.kind === 'message' && isContinuation(previous, entry);
          return <li key={entry.id} data-chat-entry={entry.id} className="rhine-chat-entry" data-continuation={continuation}>
            {previous?.day !== entry.day && <div className="rhine-chat-day">{entry.day}</div>}
            {entry.kind === 'event' ? <div className="rhine-chat-event">{entry.content}</div> : <article data-align={presentation?.align ?? 'start'} data-tone={presentation?.tone ?? 'subtle'} aria-label={`${entry.member.name} · ${entry.time}`}>
              <header className={continuation ? 'rhine-sr-only' : 'rhine-chat-meta'}>
                {entry.member.avatar && <span aria-hidden="true" className="rhine-chat-avatar">{entry.member.avatar}</span>}
                <strong>{entry.member.name}</strong><time dateTime={entry.dateTime}>{entry.time}</time>
              </header>
              <div className="rhine-chat-body">{entry.content}</div>
              {!readOnly && entry.actions && <div className="rhine-chat-actions">{entry.actions}</div>}
            </article>}
          </li>;
        })}
      </ol>
      {!entries.length && <p className="rhine-chat-empty">暂无消息</p>}
    </div>
    <div className="rhine-chat-footer">
      <span role="status" aria-live="polite">{[announcement, following ? (controls === 'compact' ? '跟随中' : '正在跟随最新消息') : `${hasNewMessages ? '有新消息 · ' : ''}${controls === 'compact' ? '已暂停跟随' : '已暂停跟随，可继续阅读历史'}`].filter(Boolean).join(' · ')}</span>
      <Button variant="quiet" aria-controls={id} aria-pressed={following} onClick={() => {
        follow.current = true; setFollowing(true); setHasNewMessages(false); restore();
      }}>回到最新并跟随</Button>
    </div>
  </div></ReadOnlyContext.Provider>;
}
