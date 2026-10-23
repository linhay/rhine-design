import { useId, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import * as DialogBase from '@radix-ui/react-dialog';
import { Checkbox } from './Forms';
import './media-parity.css';

export interface MediaCardProps extends Omit<ComponentPropsWithRef<'article'>, 'title' | 'children'> {
  title: string; date?: string; kind: 'photo' | 'video' | 'RAW' | 'Live';
  preview?: ReactNode; state?: 'ready' | 'loading' | 'error' | 'empty'; aspectRatio?: string;
  onOpen: () => void; selected?: boolean; onSelectedChange?: (selected: boolean) => void;
  disabled?: boolean; actions?: ReactNode;
}
export function MediaCard({ title, date, kind, preview, state = preview != null && preview !== false ? 'ready' : 'empty', aspectRatio = '4 / 3', onOpen, selected = false, onSelectedChange, disabled, actions, className = '', ...props }: MediaCardProps) {
  const statusId = useId();
  return <article {...props} className={`rhine-media-card ${className}`} data-selected={selected}>
    <button type="button" className="rhine-media-card__open" onClick={event => { event.currentTarget.focus({ preventScroll: true }); onOpen(); }} disabled={disabled} aria-label={`打开${title}`} aria-describedby={statusId}>
      <span className="rhine-media-card__preview" style={{ aspectRatio }} aria-busy={state === 'loading'}>
        {(state === 'ready' || state === 'loading') && <span className="rhine-media-card__asset" hidden={state === 'loading'}>{preview}</span>}
        {state !== 'ready' && <span>{state === 'loading' ? '正在加载预览…' : state === 'error' ? '预览无法解码' : '暂无预览'}</span>}
        <span className="rhine-media-card__kind">{kind === 'photo' ? '照片' : kind === 'video' ? '视频' : kind}</span>
      </span><span className="rhine-media-card__caption"><strong>{title}</strong><span>{date || '日期未知'}</span></span>
    </button>
    <span id={statusId} role="status" className="rhine-sr-only">{state === 'loading' ? `${title}：预览加载中` : state === 'error' ? `${title}：预览失败` : state === 'empty' ? `${title}：缺少预览` : ''}</span>
    {onSelectedChange && <Checkbox label={`选择${title}`} checked={selected} disabled={disabled} onChange={event => onSelectedChange(event.target.checked)} />}
    {actions != null && <div className="rhine-media-card__actions">{actions}</div>}
  </article>;
}

export interface MediaViewerProps {
  trigger: ReactElement; title: string; description: string; children: ReactNode;
  open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
  onPrevious?: () => void; onNext?: () => void; actions?: ReactNode;
  previousDisabled?: boolean; nextDisabled?: boolean; keyboardNavigation?: boolean;
  metadata?: ReactNode; metadataOpen?: boolean; defaultMetadataOpen?: boolean; onMetadataOpenChange?: (open: boolean) => void;
  className?: string; style?: CSSProperties;
}
export function MediaViewer({ trigger, title, description, children, open, defaultOpen, onOpenChange, onPrevious, onNext, previousDisabled = false, nextDisabled = false, keyboardNavigation = true, actions, metadata, metadataOpen, defaultMetadataOpen = false, onMetadataOpenChange, className = '', style }: MediaViewerProps) {
  const root = useRef<HTMLSpanElement>(null), [container, setContainer] = useState<HTMLElement>();
  const opener = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null), previousRef = useRef<HTMLButtonElement>(null), nextRef = useRef<HTMLButtonElement>(null);
  const focusedNavigation = useRef<'previous' | 'next' | null>(null);
  const [localMetadataOpen, setLocalMetadataOpen] = useState(defaultMetadataOpen);
  const showMetadata = metadataOpen ?? localMetadataOpen, metadataId = useId();
  const hasMetadata = metadata != null && metadata !== false;
  const previousEnabled = !!onPrevious && !previousDisabled, nextEnabled = !!onNext && !nextDisabled;
  const changeMetadata = () => {
    if (metadataOpen === undefined) setLocalMetadataOpen(!showMetadata);
    onMetadataOpenChange?.(!showMetadata);
  };
  useLayoutEffect(() => {
    const focused = focusedNavigation.current;
    if ((focused === 'previous' && !previousEnabled) || (focused === 'next' && !nextEnabled)) {
      const button = focused === 'previous' ? previousRef.current : nextRef.current;
      // Browsers blur a focused button when it becomes disabled at the collection boundary.
      if (document.activeElement === button || document.activeElement === document.body) contentRef.current?.focus({ preventScroll: true });
    }
  }, [previousEnabled, nextEnabled]);
  useLayoutEffect(() => { setContainer(root.current?.closest<HTMLElement>('.rhine-theme') ?? document.body); }, []);
  return <span ref={root} className="rhine-overlay-anchor"><DialogBase.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
    <DialogBase.Trigger asChild>{trigger}</DialogBase.Trigger><DialogBase.Portal container={container}>
      <DialogBase.Overlay className="rhine-overlay" />
      <DialogBase.Content ref={contentRef} className={`rhine-media-viewer ${className}`} onOpenAutoFocus={() => { opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; }} onCloseAutoFocus={event => { if (opener.current?.isConnected && opener.current !== document.body) { event.preventDefault(); opener.current.focus(); } }} style={{ '--rhine-media-columns': hasMetadata && showMetadata ? 'minmax(0, 1fr) min(320px, 32%)' : 'minmax(0, 1fr)', ...style } as CSSProperties}
        onFocusCapture={event => { const target = event.target as HTMLElement; focusedNavigation.current = target === previousRef.current ? 'previous' : target === nextRef.current ? 'next' : null; }}
        onBlurCapture={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) focusedNavigation.current = null; }}
        onKeyDown={event => {
          if (!keyboardNavigation || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.nativeEvent.isComposing) return;
          const target = event.target;
          // Embedded editors, media controls and nested portals own their arrow keys.
          if (!(target instanceof HTMLElement) || !event.currentTarget.contains(target) || target.closest('input, textarea, select, video, audio, [contenteditable]:not([contenteditable="false"]), [role="slider"], [role="listbox"], [role="tree"], [role="tablist"], [role="menu"]')) return;
          if (event.key === 'ArrowLeft' && previousEnabled) { event.preventDefault(); onPrevious?.(); }
          if (event.key === 'ArrowRight' && nextEnabled) { event.preventDefault(); onNext?.(); }
        }}>
        <header className="rhine-media-viewer__header"><div><DialogBase.Title>{title}</DialogBase.Title><DialogBase.Description>{description}</DialogBase.Description></div>
          <div className="rhine-media-viewer__actions"><button ref={previousRef} type="button" disabled={!previousEnabled} aria-keyshortcuts={keyboardNavigation ? 'ArrowLeft' : undefined} onClick={onPrevious}>上一项</button><button ref={nextRef} type="button" disabled={!nextEnabled} aria-keyshortcuts={keyboardNavigation ? 'ArrowRight' : undefined} onClick={onNext}>下一项</button>
            {hasMetadata && <button type="button" aria-controls={metadataId} aria-expanded={showMetadata} onClick={changeMetadata}>{showMetadata ? '收起信息' : '显示信息'}</button>}
            {actions}<DialogBase.Close asChild><button type="button" aria-label="关闭媒体查看器">关闭</button></DialogBase.Close>
          </div>
        </header>
        <div className="rhine-media-viewer__body"><div className="rhine-media-viewer__canvas">{children}</div>{hasMetadata && <aside id={metadataId} hidden={!showMetadata} className="rhine-media-viewer__metadata" aria-label="媒体信息">{metadata}</aside>}</div>
      </DialogBase.Content>
    </DialogBase.Portal>
  </DialogBase.Root></span>;
}
