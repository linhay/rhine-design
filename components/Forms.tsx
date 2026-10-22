import { useEffect, useId, useLayoutEffect, useRef, useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import * as PopoverBase from '@radix-ui/react-popover';
import { Button, type Choice } from './components';
import { Icon, IconButton } from './Actions';

export function Checkbox({ label, hint, indeterminate = false, id: suppliedId, className = '', ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: string; hint?: string; indeterminate?: boolean }) {
  const generatedId = useId(), id = suppliedId || generatedId;
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate; }, [indeterminate]);
  return <div className={`tod-check ${className}`}><label htmlFor={id}><input {...props} ref={ref} id={id} type="checkbox" aria-checked={indeterminate ? 'mixed' : undefined} aria-describedby={[props['aria-describedby'], hint && `${id}-hint`].filter(Boolean).join(' ') || undefined} /><span>{label}</span></label>{hint && <p id={`${id}-hint`} className="tod-text tod-text--caption tod-text--muted">{hint}</p>}</div>;
}
export function RadioGroup({ label, items, value, onValueChange, disabled = false, name }: { label: string; items: Choice[]; value: string; onValueChange: (value: string) => void; disabled?: boolean; name?: string }) {
  const id = useId();
  return <fieldset className="tod-radio-group" disabled={disabled}><legend>{label}</legend>{items.map(item => <label key={item.value}><input type="radio" name={name || id} value={item.value} checked={value === item.value} disabled={item.disabled} onChange={() => onValueChange(item.value)} /><span>{item.label}</span></label>)}</fieldset>;
}
export function Switch({ label, checked, onCheckedChange, disabled = false, hint }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void; disabled?: boolean; hint?: string }) {
  const id = useId();
  return <div className="tod-switch"><label><input type="checkbox" role="switch" checked={checked} aria-checked={checked} disabled={disabled} aria-describedby={hint ? id : undefined} onChange={event => onCheckedChange(event.target.checked)} /><span className="tod-switch__track" aria-hidden="true"><span /></span><span>{label}</span></label>{hint && <p id={id} className="tod-text tod-text--caption tod-text--muted">{hint}</p>}</div>;
}
export function Textarea({ label, hint, error, id: suppliedId, className = '', rows = 3, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; error?: string }) {
  const generatedId = useId(), id = suppliedId || generatedId;
  return <div className={`tod-field ${className}`}><label htmlFor={id}>{label}</label><textarea {...props} id={id} rows={rows} aria-invalid={error ? true : props['aria-invalid']} aria-describedby={[props['aria-describedby'], hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined} />{hint && <span id={`${id}-hint`} className="tod-field__hint">{hint}</span>}{error && <span id={`${id}-error`} className="tod-field__error" role="alert">{error}</span>}</div>;
}
export function SearchField({ label, value, onValueChange, onSearch, disabled = false, loading = false }: { label: string; value: string; onValueChange: (value: string) => void; onSearch: (query: string) => void; disabled?: boolean; loading?: boolean }) {
  const id = useId(); const composing = useRef(false);
  return <div className="tod-search tod-field" role="search" aria-label={label}><label htmlFor={id}>{label}</label><div className="tod-inline">
    <input id={id} type="search" value={value} disabled={disabled} onChange={event => onValueChange(event.target.value)} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }} onKeyDown={event => { if (event.key === 'Enter') { if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return; event.preventDefault(); if (!loading && !disabled) onSearch(value); } }} />
    {value && <IconButton icon="close" label="清空搜索" disabled={disabled || loading} onClick={() => { onValueChange(''); onSearch(''); document.getElementById(id)?.focus(); }} />}
    <Button variant="secondary" disabled={disabled} busy={loading} busyLabel="正在搜索" onClick={() => { if (!composing.current) onSearch(value); }}>搜索</Button>
  </div></div>;
}
export interface ComboboxProps {
  label: string; query: string; onQueryChange: (query: string) => void;
  value: string | null; onValueChange: (option: Choice) => void; options: Choice[];
  loading?: boolean; error?: string; disabled?: boolean;
}
export function Combobox({ label, query, onQueryChange, value, onValueChange, options, loading = false, error, disabled = false }: ComboboxProps) {
  const id = useId(); const composing = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<HTMLElement>();
  useLayoutEffect(() => { setContainer((root.current?.closest('.tod-theme') as HTMLElement) || document.body); }, []);
  const [open, setOpen] = useState(false), [active, setActive] = useState<string | null>(null), [draft, setDraft] = useState<string | null>(null);
  const available = loading || error ? [] : options.filter(option => !option.disabled);
  const activeIndex = options.findIndex(option => option.value === active && !option.disabled);
  const activeId = activeIndex >= 0 && !loading && !error ? `${id}-option-${activeIndex}` : undefined;
  useEffect(() => { if (!open || !activeId) return; document.getElementById(activeId)?.scrollIntoView?.({ block: 'nearest' }); }, [activeId, open]);
  const choose = (option: Choice) => { onValueChange(option); setOpen(false); setActive(null); };
  return <div ref={root} className="tod-combobox tod-field" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}><label htmlFor={id}>{label}</label>
    <PopoverBase.Root open={open && !disabled} onOpenChange={setOpen}><PopoverBase.Anchor asChild><div className="tod-combobox__input"><input id={id} role="combobox" aria-autocomplete="list" aria-expanded={open && !disabled} aria-controls={open && !disabled ? `${id}-list` : undefined} aria-activedescendant={open ? activeId : undefined} aria-invalid={!!error || undefined} aria-describedby={`${id}-status`} value={draft ?? query} disabled={disabled}
      onClick={() => setOpen(true)} onFocus={() => setOpen(true)} onChange={event => { if (composing.current) setDraft(event.target.value); else onQueryChange(event.target.value); setActive(null); setOpen(true); }}
      onCompositionStart={() => { composing.current = true; setDraft(query); }} onCompositionEnd={event => { composing.current = false; setDraft(null); onQueryChange(event.currentTarget.value); }}
      onKeyDown={event => {
        if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
        if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); setActive(null); }
        if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setOpen(true); const index = available.findIndex(option => option.value === active); const next = event.key === 'ArrowDown' ? (index + 1) % available.length : (index <= 0 ? available.length : index) - 1; setActive(available[next]?.value ?? null); }
        if (open && ['Home', 'End'].includes(event.key)) { event.preventDefault(); setActive((event.key === 'Home' ? available[0] : available.at(-1))?.value ?? null); }
        if (open && event.key === 'Enter') { event.preventDefault(); const option = available.find(item => item.value === active); if (option) choose(option); }
      }} /><span className="tod-combobox__arrow"><Icon name="chevronDown" size={16} /></span></div></PopoverBase.Anchor>
    <PopoverBase.Portal container={container}><PopoverBase.Content asChild sideOffset={4} collisionPadding={12} onOpenAutoFocus={event => event.preventDefault()} onCloseAutoFocus={event => event.preventDefault()} onInteractOutside={event => { if (root.current?.contains(event.target as Node)) event.preventDefault(); }}>
      <div className="tod-combobox__list" role="listbox" id={`${id}-list`} aria-label={label} aria-busy={loading}>{!loading && !error && options.map((option, index) => <div role="option" id={`${id}-option-${index}`} key={option.value} aria-selected={option.value === value} aria-disabled={option.disabled || undefined} data-active={option.value === active} onMouseDown={event => event.preventDefault()} onMouseMove={() => { if (!option.disabled) setActive(option.value); }} onClick={() => { if (!option.disabled) choose(option); }}>{option.label}</div>)}{(loading || error || !options.length) && <div className="tod-combobox__empty" role="presentation">{loading ? '正在读取…' : error ? '暂不可用' : '暂无匹配结果'}</div>}</div>
    </PopoverBase.Content></PopoverBase.Portal></PopoverBase.Root>
    <span id={`${id}-status`} role="status" className={`tod-text tod-text--caption ${error ? 'tod-text--error' : 'tod-text--muted'}`}>{loading ? '正在读取候选项…' : error || (options.length ? `${options.length} 个候选项` : '暂无匹配结果')}</span>
  </div>;
}
