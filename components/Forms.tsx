import { useEffect, useId, useLayoutEffect, useRef, useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import * as PopoverBase from '@radix-ui/react-popover';
import { Button, type Choice } from './components';
import { Icon, IconButton } from './Actions';
import { useFloatingScale } from './useFloatingScale';
import './checkbox-row.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  hint?: string;
  indeterminate?: boolean;
  layout?: 'form' | 'row';
}
export function Checkbox({ label, hint, indeterminate = false, layout = 'form', id: suppliedId, className = '', ...props }: CheckboxProps) {
  const generatedId = useId(), id = suppliedId || generatedId;
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate; }, [indeterminate]);
  if (layout === 'row') return <div className={`rhine-check rhine-check--row ${className}`}><label htmlFor={id}>
    <input {...props} ref={ref} id={id} type="checkbox" aria-checked={indeterminate ? 'mixed' : undefined}
      aria-labelledby={props['aria-labelledby'] || (!props['aria-label'] ? `${id}-label` : undefined)}
      aria-describedby={[props['aria-describedby'], hint && `${id}-hint`].filter(Boolean).join(' ') || undefined} />
    <span className="rhine-check__text"><span id={`${id}-label`} className="rhine-check__name">{label}</span>{hint && <span id={`${id}-hint`} className="rhine-check__hint">{hint}</span>}</span>
  </label></div>;
  return <div className={`rhine-check ${className}`}><label htmlFor={id}><input {...props} ref={ref} id={id} type="checkbox" aria-checked={indeterminate ? 'mixed' : undefined} aria-describedby={[props['aria-describedby'], hint && `${id}-hint`].filter(Boolean).join(' ') || undefined} /><span>{label}</span></label>{hint && <p id={`${id}-hint`} className="rhine-text rhine-text--caption rhine-text--muted">{hint}</p>}</div>;
}
export function RadioGroup({ label, items, value, onValueChange, disabled = false, name }: { label: string; items: Choice[]; value: string; onValueChange: (value: string) => void; disabled?: boolean; name?: string }) {
  const id = useId();
  return <fieldset className="rhine-radio-group" disabled={disabled}><legend>{label}</legend>{items.map(item => <label key={item.value}><input type="radio" name={name || id} value={item.value} checked={value === item.value} disabled={item.disabled} onChange={() => onValueChange(item.value)} /><span>{item.label}</span></label>)}</fieldset>;
}
export interface SwitchProps {
  label: string; checked: boolean; onCheckedChange: (checked: boolean) => void;
  disabled?: boolean; readOnly?: boolean; hint?: string;
  /** Row fills the available width: label at logical start, fixed-size toggle at logical end. */
  layout?: 'inline' | 'row';
  /** Hide only the visual label when an adjacent title already identifies the setting. */
  labelVisibility?: 'visible' | 'hidden';
}
export function Switch({ label, checked, onCheckedChange, disabled = false, readOnly = false, hint, layout = 'inline', labelVisibility = 'visible' }: SwitchProps) {
  const id = useId();
  return <div className={`rhine-switch${layout === 'row' ? ' rhine-switch--row' : ''}${labelVisibility === 'hidden' ? ' rhine-switch--hidden-label' : ''}`}><label><input type="checkbox" role="switch" checked={checked} aria-checked={checked} disabled={disabled} aria-readonly={readOnly || undefined} aria-describedby={hint ? id : undefined} readOnly={readOnly} onChange={event => { if (!readOnly) onCheckedChange(event.target.checked); }} /><span className="rhine-switch__track" aria-hidden="true"><span /></span><span className={labelVisibility === 'hidden' ? 'rhine-sr-only' : 'rhine-switch__label'}>{label}</span></label>{hint && <p id={id} className="rhine-text rhine-text--caption rhine-text--muted">{hint}</p>}</div>;
}
export function Textarea({ label, hint, error, id: suppliedId, className = '', rows = 3, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; error?: string }) {
  const generatedId = useId(), id = suppliedId || generatedId;
  return <div className={`rhine-field ${className}`}><label htmlFor={id}>{label}</label><textarea {...props} id={id} rows={rows} aria-invalid={error ? true : props['aria-invalid']} aria-describedby={[props['aria-describedby'], hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined} />{hint && <span id={`${id}-hint`} className="rhine-field__hint">{hint}</span>}{error && <span id={`${id}-error`} className="rhine-field__error" role="alert">{error}</span>}</div>;
}
export function SearchField({ label, value, onValueChange, onSearch, disabled = false, loading = false }: { label: string; value: string; onValueChange: (value: string) => void; onSearch: (query: string) => void; disabled?: boolean; loading?: boolean }) {
  const id = useId(); const composing = useRef(false);
  return <div className="rhine-search rhine-field" role="search" aria-label={label}><label htmlFor={id}>{label}</label><div className="rhine-inline">
    <input id={id} type="search" value={value} disabled={disabled} onChange={event => onValueChange(event.target.value)} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }} onKeyDown={event => { if (event.key === 'Enter') { if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return; event.preventDefault(); if (!loading && !disabled) onSearch(value); } }} />
    {value && <IconButton icon="close" label="清空搜索" disabled={disabled || loading} onClick={() => { onValueChange(''); onSearch(''); document.getElementById(id)?.focus(); }} />}
    <Button variant="secondary" disabled={disabled} busy={loading} busyLabel="正在搜索" onClick={() => { if (!composing.current) onSearch(value); }}>搜索</Button>
  </div></div>;
}
export interface ComboboxProps {
  hasMore?: boolean; onLoadMore?: () => void; loadingMore?: boolean; loadMoreError?: string; onRetry?: () => void;
  label: string; query: string; onQueryChange: (query: string) => void;
  value: string | null; onValueChange: (option: Choice) => void; options: Choice[];
  loading?: boolean; error?: string; disabled?: boolean;
  readOnly?: boolean; placeholder?: string; hint?: string; id?: string;
  selectedValues?: string[]; closeOnSelect?: boolean; onEmptyBackspace?: () => void; completionLabel?: string;
  open?: boolean; onOpenChange?: (open: boolean) => void;
}
export function Combobox({ label, query, onQueryChange, value, onValueChange, options, loading = false, error, disabled = false, readOnly = false, placeholder, hint, id: suppliedId, selectedValues, closeOnSelect = true, onEmptyBackspace, completionLabel, hasMore = false, onLoadMore, loadingMore = false, loadMoreError, onRetry, open: controlledOpen, onOpenChange }: ComboboxProps) {
  const generatedId = useId(), id = suppliedId || generatedId; const composing = useRef(false);
  const floatingRef = useFloatingScale(undefined, 'popover', 240);
  const exitingWithTab = useRef(false);
  const restoreInputOnClose = useRef(false);
  const openRevision = useRef(0), restoreRevision = useRef(0);
  const releaseTabGuard = useRef<(() => void) | undefined>(undefined);
  useEffect(() => () => releaseTabGuard.current?.(), []);
  const root = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<HTMLElement>();
  useLayoutEffect(() => { setContainer((root.current?.closest('.rhine-theme') as HTMLElement) || document.body); }, []);
  const [internalOpen, setInternalOpen] = useState(false), [active, setActive] = useState<string | null>(null), [draft, setDraft] = useState<string | null>(null);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (next: boolean) => { if (next) openRevision.current++; if (controlledOpen === undefined) setInternalOpen(next); onOpenChange?.(next); };
  useEffect(() => { if (disabled || readOnly) { setOpen(false); setActive(null); setDraft(null); composing.current = false; } }, [disabled, readOnly]);
  const available = loading || error ? [] : options.filter(option => !option.disabled);
  const activeIndex = options.findIndex(option => option.value === active && !option.disabled);
  const activeId = activeIndex >= 0 && !loading && !error ? `${id}-option-${activeIndex}` : undefined;
  useEffect(() => { if (!open || !activeId) return; document.getElementById(activeId)?.scrollIntoView?.({ block: 'nearest' }); }, [activeId, open]);
  const choose = (option: Choice) => { if (readOnly || disabled || loading || error) return; onValueChange(option); if (closeOnSelect) setOpen(false); setActive(null); };
  const visibleOpen = open && !disabled && !readOnly;
  const actionFocused = useRef(false);
  const retryAction = Boolean((error || loadMoreError) && onRetry);
  const pageAction = retryAction || Boolean((hasMore || loadingMore) && onLoadMore);
  useLayoutEffect(() => {
    // The last page removes its action; never strand keyboard focus on body.
    if (!pageAction && actionFocused.current && visibleOpen) document.getElementById(id)?.focus();
    if (!pageAction) actionFocused.current = false;
  }, [pageAction, visibleOpen, id]);
  // Keep a multiselect action in place until its click finishes. Closing on
  // pointerdown/blur can shift a zoomed page before pointerup reaches the button.
  const containsInteractionTarget = (target: EventTarget | null) => target instanceof Node && (root.current?.closest('.rhine-multi-select') ?? root.current)?.contains(target);
  const beginTabExit = () => {
    exitingWithTab.current = true;
    releaseTabGuard.current?.();
    const dialog = root.current?.closest<HTMLElement>('.rhine-dialog[data-state="open"]');
    if (!dialog) return;
    const doc = dialog.ownerDocument;
    let lastInside = doc.activeElement instanceof HTMLElement && dialog.contains(doc.activeElement) ? doc.activeElement : document.getElementById(id);
    // The nested Radix scope resumes its parent asynchronously on unmount.
    // Keep that short interval contained even for repeated keyboard events.
    const guard = (event: FocusEvent) => {
      if (!dialog.isConnected || dialog.dataset.state !== 'open') return;
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (dialog.contains(target)) lastInside = target;
      else if (!document.getElementById(`${id}-popup`)?.contains(target) && lastInside?.isConnected) {
        lastInside.focus({ preventScroll: true });
        if (lastInside.id === id) { setOpen(false); setActive(null); }
      }
    };
    doc.addEventListener('focusin', guard);
    releaseTabGuard.current = () => { doc.removeEventListener('focusin', guard); releaseTabGuard.current = undefined; };
  };
  const complete = () => { document.getElementById(id)?.focus(); restoreInputOnClose.current = true; restoreRevision.current = openRevision.current; setOpen(false); setActive(null); };
  return <div ref={root} className="rhine-combobox rhine-field" onBlur={event => { if (!containsInteractionTarget(event.relatedTarget) && !document.getElementById(`${id}-popup`)?.contains(event.relatedTarget)) setOpen(false); }}><label htmlFor={id}>{label}</label>
    <PopoverBase.Root open={visibleOpen} onOpenChange={setOpen}><PopoverBase.Anchor asChild><div className="rhine-combobox__input"><input id={id} role="combobox" aria-autocomplete="list" aria-expanded={visibleOpen} aria-controls={visibleOpen ? `${id}-list` : undefined} aria-activedescendant={visibleOpen ? activeId : undefined} aria-invalid={!!error || undefined} aria-describedby={[`${id}-status`, hint && `${id}-hint`].filter(Boolean).join(' ')} value={draft ?? query} disabled={disabled} readOnly={readOnly} placeholder={placeholder}
      onClick={() => { if (!readOnly && !disabled) setOpen(true); }} onFocus={() => { if (!readOnly && !disabled) setOpen(true); }} onChange={event => { if (readOnly || disabled) return; if (composing.current) setDraft(event.target.value); else onQueryChange(event.target.value); setActive(null); setOpen(true); }}
      onCompositionStart={() => { if (!readOnly && !disabled) { composing.current = true; setDraft(query); } }} onCompositionEnd={event => { composing.current = false; setDraft(null); if (!readOnly && !disabled) onQueryChange(event.currentTarget.value); }}
      onKeyDown={event => {
        if (readOnly || disabled || composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
        if (event.key === 'Tab' && open) {
          if (!event.shiftKey && (pageAction || completionLabel)) {
            const next = document.getElementById(pageAction && !loading && !loadingMore ? `${id}-page-action` : `${id}-complete`);
            if (next) { event.preventDefault(); event.stopPropagation(); next.focus(); return; }
          }
          beginTabExit();
        }
        if (event.key === 'Backspace' && !event.currentTarget.value && onEmptyBackspace) { event.preventDefault(); onEmptyBackspace(); }
        if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); setActive(null); }
        if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setOpen(true); const index = available.findIndex(option => option.value === active); const next = event.key === 'ArrowDown' ? (index + 1) % available.length : (index <= 0 ? available.length : index) - 1; setActive(available[next]?.value ?? null); }
        if (open && ['Home', 'End'].includes(event.key)) { event.preventDefault(); setActive((event.key === 'Home' ? available[0] : available.at(-1))?.value ?? null); }
        if (open && event.key === 'Enter') { event.preventDefault(); const option = available.find(item => item.value === active); if (option) choose(option); }
      }} /><span className="rhine-combobox__arrow"><Icon name="chevronDown" size={16} /></span></div></PopoverBase.Anchor>
    <PopoverBase.Portal container={container}><PopoverBase.Content asChild updatePositionStrategy="always" sideOffset={4} collisionPadding={12} onEscapeKeyDown={event => { event.preventDefault(); event.stopPropagation(); complete(); }} onOpenAutoFocus={event => event.preventDefault()} onCloseAutoFocus={event => {
      event.preventDefault();
      releaseTabGuard.current?.();
      // A parent Dialog can re-focus the disappearing popup before its scope unmounts.
      // Restore explicit completion/Escape focus after that scope has been removed.
      if (restoreInputOnClose.current && !exitingWithTab.current) {
        const revision = restoreRevision.current;
        queueMicrotask(() => {
          // A fresh click/query can reopen before the old scope finishes closing.
          if (!root.current?.isConnected || revision !== openRevision.current) return;
          const dialog = root.current.closest('.rhine-dialog');
          if (dialog && dialog.getAttribute('data-state') !== 'open') return;
          const input = document.getElementById(id), active = document.activeElement;
          // Closing a nested scope may finish after the user/host has moved on.
          // Restore only its own focus or a genuinely lost/guard focus.
          const closingPopup = event.target;
          if (active && active !== input && active !== document.body && active !== document.documentElement
            && !active.hasAttribute('data-radix-focus-guard')
            && !(closingPopup instanceof Node && closingPopup.contains(active))) return;
          input?.focus({ preventScroll: true }); setOpen(false); setActive(null);
        });
      }
      restoreInputOnClose.current = false;
      if (!exitingWithTab.current) return;
      exitingWithTab.current = false;
      // Radix resumes the parent scope after this callback. Rapid Tab can
      // reach a guard or the background during that interval; restore focus
      // only for a keyboard exit from a still-open Rhine modal.
      const dialog = root.current?.closest('.rhine-dialog[data-state="open"]');
      const active = document.activeElement;
      if (active?.hasAttribute('data-radix-focus-guard') || (dialog && !dialog.contains(active))) {
        complete();
        // This close callback is already consuming the focus restoration.
        restoreInputOnClose.current = false;
      }
    }} onInteractOutside={event => { if (containsInteractionTarget(event.target)) event.preventDefault(); }}>
      <div ref={floatingRef} className="rhine-combobox__list" id={`${id}-popup`} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); complete(); } }}>
        <div role="listbox" id={`${id}-list`} aria-label={label} aria-multiselectable={selectedValues ? true : undefined} aria-busy={loading || loadingMore}>{!loading && !error && options.map((option, index) => <div role="option" id={`${id}-option-${index}`} key={option.value} aria-selected={selectedValues ? selectedValues.includes(option.value) : option.value === value} aria-disabled={option.disabled || undefined} data-active={option.value === active} onMouseDown={event => event.preventDefault()} onMouseMove={() => { if (!option.disabled) setActive(option.value); }} onClick={() => { if (!option.disabled) choose(option); }}>{selectedValues && <span className="rhine-combobox__check" aria-hidden="true">{selectedValues.includes(option.value) ? '✓' : ''}</span>}{option.label}</div>)}{(loading || error || !options.length) && <div className="rhine-combobox__empty" role="presentation">{loading ? '正在读取…' : error ? '暂不可用' : '暂无匹配结果'}</div>}</div>
        {loadMoreError && <p className="rhine-field__error" role="alert">{loadMoreError}</p>}
        {(completionLabel || pageAction) && <div className="rhine-combobox__completion">
          {pageAction && <Button id={`${id}-page-action`} type="button" variant="quiet" busy={loading || loadingMore} busyLabel="正在加载…"
            onFocus={() => { actionFocused.current = true; }} onBlur={() => { actionFocused.current = false; }}
            onMouseDown={event => event.preventDefault()} onClick={() => { if (!loading && !loadingMore) (retryAction ? onRetry : onLoadMore)?.(); }}
            onKeyDown={event => { if (event.key !== 'Tab') return; event.stopPropagation();
              if (event.shiftKey) { event.preventDefault(); document.getElementById(id)?.focus(); }
              else if (completionLabel) { event.preventDefault(); document.getElementById(`${id}-complete`)?.focus(); }
              else { beginTabExit(); complete(); }
            }}>{retryAction ? '重试' : '加载更多'}</Button>}
          {completionLabel && <Button id={`${id}-complete`} type="button" variant="quiet" onMouseDown={event => event.preventDefault()} onClick={complete} onKeyDown={event => {
            if (event.key !== 'Tab') return; event.stopPropagation();
            if (event.shiftKey) { event.preventDefault(); document.getElementById(pageAction && !loading && !loadingMore ? `${id}-page-action` : id)?.focus(); }
            // Restore the input as the origin of the browser's normal forward Tab.
            else { beginTabExit(); complete(); }
          }}>{completionLabel}</Button>}
        </div>}
      </div>
    </PopoverBase.Content></PopoverBase.Portal></PopoverBase.Root>
    <span id={`${id}-status`} role="status" className={`rhine-text rhine-text--caption ${error ? 'rhine-text--error' : 'rhine-text--muted'}`}>{loading ? '正在读取候选项…' : error || (options.length ? `${options.length} 个候选项` : '暂无匹配结果')}</span>
    {hint && <span id={`${id}-hint`} className="rhine-field__hint">{hint}</span>}
  </div>;
}
