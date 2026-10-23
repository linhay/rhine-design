import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import * as DialogBase from '@radix-ui/react-dialog';
import { Checkbox } from './Forms';

export interface MediaCardProps {
  title: string; date?: string; kind: 'photo' | 'video' | 'RAW' | 'Live';
  preview?: ReactNode; state?: 'ready' | 'loading' | 'error' | 'empty'; aspectRatio?: string;
  onOpen: () => void; selected?: boolean; onSelectedChange?: (selected: boolean) => void;
  disabled?: boolean;
}
export function MediaCard({ title, date, kind, preview, state = preview ? 'ready' : 'empty', aspectRatio = '4 / 3', onOpen, selected = false, onSelectedChange, disabled }: MediaCardProps) {
  const statusId = useId();
  return <article className="rhine-media-card" data-selected={selected}>
    <button type="button" className="rhine-media-card__open" onClick={event => { event.currentTarget.focus({ preventScroll: true }); onOpen(); }} disabled={disabled} aria-label={`打开${title}`} aria-describedby={statusId}>
      <span className="rhine-media-card__preview" style={{ aspectRatio }} aria-busy={state === 'loading'}>
        {state === 'ready' ? preview : <span>{state === 'loading' ? '正在加载预览…' : state === 'error' ? '预览无法解码' : '暂无预览'}</span>}
        <span className="rhine-media-card__kind">{kind === 'photo' ? '照片' : kind === 'video' ? '视频' : kind}</span>
      </span><span className="rhine-media-card__caption"><strong>{title}</strong><span>{date || '日期未知'}</span></span>
    </button>
    <span id={statusId} role="status" className="rhine-sr-only">{state === 'loading' ? `${title}：预览加载中` : state === 'error' ? `${title}：预览失败` : state === 'empty' ? `${title}：缺少预览` : ''}</span>
    {onSelectedChange && <Checkbox label={`选择${title}`} checked={selected} disabled={disabled} onChange={event => onSelectedChange(event.target.checked)} />}
  </article>;
}

export interface MediaViewerProps {
  trigger: ReactElement; title: string; description: string; children: ReactNode;
  open?: boolean; onOpenChange?: (open: boolean) => void;
  onPrevious?: () => void; onNext?: () => void; actions?: ReactNode;
  metadata?: ReactNode; metadataOpen?: boolean; onMetadataOpenChange?: (open: boolean) => void;
}
export function MediaViewer({ trigger, title, description, children, open, onOpenChange, onPrevious, onNext, actions, metadata, metadataOpen = false, onMetadataOpenChange }: MediaViewerProps) {
  const root = useRef<HTMLSpanElement>(null), [container, setContainer] = useState<HTMLElement>();
  const opener = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => { setContainer(root.current?.closest<HTMLElement>('.rhine-theme') ?? document.body); }, []);
  return <span ref={root} className="rhine-overlay-anchor"><DialogBase.Root open={open} onOpenChange={onOpenChange}>
    <DialogBase.Trigger asChild>{trigger}</DialogBase.Trigger><DialogBase.Portal container={container}>
      <DialogBase.Overlay className="rhine-overlay" />
      <DialogBase.Content className="rhine-media-viewer" onOpenAutoFocus={() => { opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; }} onCloseAutoFocus={event => { if (opener.current?.isConnected && opener.current !== document.body) { event.preventDefault(); opener.current.focus(); } }} style={{ '--rhine-media-columns': metadata && metadataOpen ? 'minmax(0, 1fr) min(320px, 32%)' : 'minmax(0, 1fr)' } as CSSProperties}>
        <header className="rhine-media-viewer__header"><div><DialogBase.Title>{title}</DialogBase.Title><DialogBase.Description>{description}</DialogBase.Description></div>
          <div className="rhine-media-viewer__actions"><button type="button" disabled={!onPrevious} onClick={onPrevious}>上一项</button><button type="button" disabled={!onNext} onClick={onNext}>下一项</button>
            {metadata && onMetadataOpenChange && <button type="button" aria-expanded={metadataOpen} onClick={() => onMetadataOpenChange(!metadataOpen)}>{metadataOpen ? '收起信息' : '显示信息'}</button>}
            {actions}<DialogBase.Close asChild><button type="button" aria-label="关闭媒体查看器">关闭</button></DialogBase.Close>
          </div>
        </header>
        <div className="rhine-media-viewer__body"><div className="rhine-media-viewer__canvas">{children}</div>{metadata && <aside hidden={!metadataOpen} className="rhine-media-viewer__metadata" aria-label="媒体信息">{metadata}</aside>}</div>
      </DialogBase.Content>
    </DialogBase.Portal>
  </DialogBase.Root></span>;
}
