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
export function Switch({ label, checked, onCheckedChange, disabled = false, hint }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void; disabled?: boolean; hint?: string }) {
  const id = useId();
  return <div className="rhine-switch"><label><input type="checkbox" role="switch" checked={checked} aria-checked={checked} disabled={disabled} aria-describedby={hint ? id : undefined} onChange={event => onCheckedChange(event.target.checked)} /><span className="rhine-switch__track" aria-hidden="true"><span /></span><span>{label}</span></label>{hint && <p id={id} className="rhine-text rhine-text--caption rhine-text--muted">{hint}</p>}</div>;
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
  label: string; query: string; onQueryChange: (query: string) => void;
  value: string | null; onValueChange: (option: Choice) => void; options: Choice[];
  loading?: boolean; error?: string; disabled?: boolean;
  readOnly?: boolean; placeholder?: string; hint?: string; id?: string;
  selectedValues?: string[]; closeOnSelect?: boolean; onEmptyBackspace?: () => void; completionLabel?: string;
  open?: boolean; onOpenChange?: (open: boolean) => void;
}
export function Combobox({ label, query, onQueryChange, value, onValueChange, options, loading = false, error, disabled = false, readOnly = false, placeholder, hint, id: suppliedId, selectedValues, closeOnSelect = true, onEmptyBackspace, completionLabel, open: controlledOpen, onOpenChange }: ComboboxProps) {
  const generatedId = useId(), id = suppliedId || generatedId; const composing = useRef(false);
  const floatingRef = useFloatingScale(undefined, 'popover');
  const root = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<HTMLElement>();
  useLayoutEffect(() => { setContainer((root.current?.closest('.rhine-theme') as HTMLElement) || document.body); }, []);
  const [internalOpen, setInternalOpen] = useState(false), [active, setActive] = useState<string | null>(null), [draft, setDraft] = useState<string | null>(null);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (next: boolean) => { if (controlledOpen === undefined) setInternalOpen(next); onOpenChange?.(next); };
  useEffect(() => { if (disabled || readOnly) { setOpen(false); setActive(null); setDraft(null); composing.current = false; } }, [disabled, readOnly]);
  const available = loading || error ? [] : options.filter(option => !option.disabled);
  const activeIndex = options.findIndex(option => option.value === active && !option.disabled);
  const activeId = activeIndex >= 0 && !loading && !error ? `${id}-option-${activeIndex}` : undefined;
  useEffect(() => { if (!open || !activeId) return; document.getElementById(activeId)?.scrollIntoView?.({ block: 'nearest' }); }, [activeId, open]);
  const choose = (option: Choice) => { if (readOnly || disabled || loading || error) return; onValueChange(option); if (closeOnSelect) setOpen(false); setActive(null); };
  const visibleOpen = open && !disabled && !readOnly;
  const complete = () => { document.getElementById(id)?.focus(); setOpen(false); setActive(null); };
  return <div ref={root} className="rhine-combobox rhine-field" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget) && !document.getElementById(`${id}-popup`)?.contains(event.relatedTarget)) setOpen(false); }}><label htmlFor={id}>{label}</label>
    <PopoverBase.Root open={visibleOpen} onOpenChange={setOpen}><PopoverBase.Anchor asChild><div className="rhine-combobox__input"><input id={id} role="combobox" aria-autocomplete="list" aria-expanded={visibleOpen} aria-controls={visibleOpen ? `${id}-list` : undefined} aria-activedescendant={visibleOpen ? activeId : undefined} aria-invalid={!!error || undefined} aria-describedby={[`${id}-status`, hint && `${id}-hint`].filter(Boolean).join(' ')} value={draft ?? query} disabled={disabled} readOnly={readOnly} placeholder={placeholder}
      onClick={() => { if (!readOnly && !disabled) setOpen(true); }} onFocus={() => { if (!readOnly && !disabled) setOpen(true); }} onChange={event => { if (readOnly || disabled) return; if (composing.current) setDraft(event.target.value); else onQueryChange(event.target.value); setActive(null); setOpen(true); }}
      onCompositionStart={() => { if (!readOnly && !disabled) { composing.current = true; setDraft(query); } }} onCompositionEnd={event => { composing.current = false; setDraft(null); if (!readOnly && !disabled) onQueryChange(event.currentTarget.value); }}
      onKeyDown={event => {
        if (readOnly || disabled || composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
        if (event.key === 'Backspace' && !event.currentTarget.value && onEmptyBackspace) { event.preventDefault(); onEmptyBackspace(); }
        if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); setActive(null); }
        if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setOpen(true); const index = available.findIndex(option => option.value === active); const next = event.key === 'ArrowDown' ? (index + 1) % available.length : (index <= 0 ? available.length : index) - 1; setActive(available[next]?.value ?? null); }
        if (open && ['Home', 'End'].includes(event.key)) { event.preventDefault(); setActive((event.key === 'Home' ? available[0] : available.at(-1))?.value ?? null); }
        if (open && event.key === 'Enter') { event.preventDefault(); const option = available.find(item => item.value === active); if (option) choose(option); }
      }} /><span className="rhine-combobox__arrow"><Icon name="chevronDown" size={16} /></span></div></PopoverBase.Anchor>
    <PopoverBase.Portal container={container}><PopoverBase.Content asChild updatePositionStrategy="always" sideOffset={4} collisionPadding={12} onOpenAutoFocus={event => event.preventDefault()} onCloseAutoFocus={event => event.preventDefault()} onInteractOutside={event => { if (root.current?.contains(event.target as Node)) event.preventDefault(); }}>
      <div ref={floatingRef} className="rhine-combobox__list" id={`${id}-popup`} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); complete(); } }}>
        <div role="listbox" id={`${id}-list`} aria-label={label} aria-multiselectable={selectedValues ? true : undefined} aria-busy={loading}>{!loading && !error && options.map((option, index) => <div role="option" id={`${id}-option-${index}`} key={option.value} aria-selected={selectedValues ? selectedValues.includes(option.value) : option.value === value} aria-disabled={option.disabled || undefined} data-active={option.value === active} onMouseDown={event => event.preventDefault()} onMouseMove={() => { if (!option.disabled) setActive(option.value); }} onClick={() => { if (!option.disabled) choose(option); }}>{selectedValues && <span className="rhine-combobox__check" aria-hidden="true">{selectedValues.includes(option.value) ? '✓' : ''}</span>}{option.label}</div>)}{(loading || error || !options.length) && <div className="rhine-combobox__empty" role="presentation">{loading ? '正在读取…' : error ? '暂不可用' : '暂无匹配结果'}</div>}</div>
        {completionLabel && <div className="rhine-combobox__completion"><Button type="button" variant="quiet" onMouseDown={event => event.preventDefault()} onClick={complete}>{completionLabel}</Button></div>}
      </div>
    </PopoverBase.Content></PopoverBase.Portal></PopoverBase.Root>
    <span id={`${id}-status`} role="status" className={`rhine-text rhine-text--caption ${error ? 'rhine-text--error' : 'rhine-text--muted'}`}>{loading ? '正在读取候选项…' : error || (options.length ? `${options.length} 个候选项` : '暂无匹配结果')}</span>
    {hint && <span id={`${id}-hint`} className="rhine-field__hint">{hint}</span>}
  </div>;
}
