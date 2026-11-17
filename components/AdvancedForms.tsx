import { useEffect, useId, useLayoutEffect, useRef, useState, type SyntheticEvent } from 'react';
import { flushSync } from 'react-dom';
import { Button, TextField, type Choice } from './components';
import { Combobox, type ComboboxProps } from './Forms';
import {SelectionTags} from './SelectionTags';
import {useSelectionLifecycle,useNativeFieldDisabled,type SelectionChangeReason} from './selection-lifecycle';
import './compact-forms.css';

export interface DateFieldProps {
  label: string; value: string; onValueChange: (value: string) => void;
  min?: string; max?: string; disabled?: boolean; error?: string;
  readOnly?: boolean; required?: boolean; id?: string; name?: string; hint?: string;
  onValidationChange?: (error: string | null) => void;
}
function dateError(value: string, min?: string, max?: string): string | undefined {
  if (min && max && min > max) return '最早日期不能晚于最晚日期。';
  if (!value) return;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return '请输入有效日期。';
  if (min && value < min) return `日期不能早于 ${min}。`;
  if (max && value > max) return `日期不能晚于 ${max}。`;
}
function useDateValidation(error: string | undefined, onValidationChange?: (error: string | null) => void) {
  const callback = useRef(onValidationChange);
  useEffect(() => { callback.current = onValidationChange; }, [onValidationChange]);
  useEffect(() => { callback.current?.(error || null); }, [error]);
}
/** Date-only ISO strings: conversion to timestamps and time zones belongs to the host. */
export function DateField({ onValueChange, onValidationChange, error, ...props }: DateFieldProps) {
  const [editing, setEditing] = useState({ accepted: props.value, draft: props.value, badInput: false });
  const lastEvent = useRef<Event | null>(null);
  const nativeBadInput = useRef(false);
  let current = editing;
  if (editing.accepted !== props.value) {
    current = { accepted: props.value, draft: props.value, badInput: false };
    nativeBadInput.current = false;
    setEditing(current);
  }
  const invalid = error || (current.badInput ? '请填写完整有效的日期。' : dateError(current.draft, props.min, props.max));
  useDateValidation(invalid, onValidationChange);
  const change = (event: SyntheticEvent<HTMLInputElement>) => {
    if (props.disabled || props.readOnly || lastEvent.current === event.nativeEvent) return;
    lastEvent.current = event.nativeEvent;
    const { value, validity } = event.currentTarget;
    nativeBadInput.current = validity.badInput;
    // Native date fragments also expose an empty value; they are not a cleared boundary.
    // Only incomplete native fragments are local drafts. Valid values remain
    // controlled by the host, which may reject a proposed change.
    setEditing({ accepted: props.value, draft: validity.badInput ? value : props.value, badInput: validity.badInput });
    if (!validity.badInput) onValueChange(value);
  };
  // Chromium can change an empty calendar fragment without firing input/change.
  const checkFragments = (event: SyntheticEvent<HTMLInputElement>) => { if (event.currentTarget.validity.badInput !== nativeBadInput.current) change(event); };
  return <TextField {...props} className="rhine-date-field" value={current.draft} error={invalid} type="date" onInput={change} onChange={change} onKeyUp={checkFragments} onBlur={checkFragments} />;
}
export interface DateRange { start: string; end: string }
export interface DateRangePickerProps {
  label: string; value: DateRange; onValueChange: (value: DateRange) => void;
  min?: string; max?: string; disabled?: boolean; error?: string;
  presets?: { label: string; value: DateRange }[];
  readOnly?: boolean; required?: boolean; clearable?: boolean; hint?: string;
  compact?: boolean;
  startLabel?: string; endLabel?: string; startName?: string; endName?: string;
  onValidationChange?: (error: string | null) => void;
}
export function DateRangePicker({ label, value, onValueChange, min, max, disabled, error, presets = [], readOnly = false, required, clearable = true, compact = false, hint, startLabel = '开始日期', endLabel = '结束日期', startName, endName, onValidationChange }: DateRangePickerProps) {
  const id = useId();
  const [fieldErrors, setFieldErrors] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });
  const [resetRevision, setResetRevision] = useState(0);
  const group = useRef<HTMLFieldSetElement>(null);
  const rangeError = (range: DateRange) => dateError(range.start, min, max) || dateError(range.end, min, max) || (range.start && range.end && range.start > range.end ? '结束日期不能早于开始日期。' : undefined);
  const invalid = error || rangeError(value) || fieldErrors.start || fieldErrors.end || undefined;
  useDateValidation(invalid, onValidationChange);
  const fieldValidation = (field: 'start' | 'end', message: string | null) => setFieldErrors(current => current[field] === message ? current : { ...current, [field]: message });
  const replace = (next: DateRange) => {
    setFieldErrors({ start: null, end: null });
    setResetRevision(revision => revision + 1);
    onValueChange(next);
  };
  const clear = () => {
    // Move before disabling the trigger or remounting date fragments. The named
    // fieldset survives both; later host updates must not reclaim focus.
    const target = group.current;
    if (target?.contains(target.ownerDocument.activeElement)) target.focus();
    replace({ start: '', end: '' });
  };
  return <div className="rhine-date-range-container"><fieldset ref={group} tabIndex={-1} className={`rhine-date-range${compact ? ' rhine-date-range--compact' : ''}`} disabled={disabled} aria-describedby={[hint && `${id}-hint`, invalid && id].filter(Boolean).join(' ') || undefined}>
    <legend>{label}</legend><div className="rhine-date-range__fields">
      <DateField key={`start-${resetRevision}`} label={startLabel} name={startName} value={value.start} min={min} max={max} readOnly={readOnly} required={required} disabled={disabled} onValueChange={start => onValueChange({ ...value, start })} onValidationChange={message => fieldValidation('start', message)} />
      {compact && <span className="rhine-date-range__separator" aria-hidden="true">至</span>}
      <DateField key={`end-${resetRevision}`} label={endLabel} name={endName} value={value.end} min={value.start && (!min || value.start > min) ? value.start : min} max={max} readOnly={readOnly} required={required} disabled={disabled} onValueChange={end => onValueChange({ ...value, end })} onValidationChange={message => fieldValidation('end', message)} />
    </div>{(presets.length > 0 || clearable) && <div className="rhine-inline">
      {presets.map(preset => <Button key={preset.label} variant="secondary" disabled={disabled || readOnly || !!rangeError(preset.value) || !!(required && (!preset.value.start || !preset.value.end))} onClick={() => replace(preset.value)}>{preset.label}</Button>)}
      {clearable && <Button variant="quiet" disabled={disabled || readOnly || (!value.start && !value.end && !fieldErrors.start && !fieldErrors.end)} onClick={clear}>清空日期</Button>}
    </div>}{hint && <p id={`${id}-hint`} className="rhine-field__hint">{hint}</p>}{invalid && <p id={id} role="alert" className="rhine-field__error">{invalid}</p>}
  </fieldset></div>;
}

export interface NumberFieldProps {
  label: string; value: number | null; onValueChange: (value: number | null) => void;
  min?: number; max?: number; step?: number; precision?: number; disabled?: boolean; error?: string;
  readOnly?: boolean; required?: boolean; name?: string; id?: string; hint?: string;
  controls?: boolean;
}
export function NumberField({ label, value, onValueChange, min, max, step = 1, precision, disabled, error, readOnly = false, required, name, id, hint, controls = true }: NumberFieldProps) {
  const text = value === null ? '' : String(value);
  const [editing, setEditing] = useState({ accepted: value, draft: text });
  const [showError, setShowError] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const composing = useRef(false), root = useRef<HTMLDivElement>(null);
  let draft = editing.draft;
  if (!Object.is(editing.accepted, value)) {
    draft = text;
    setEditing({ accepted: value, draft });
    setShowError(false);
  }
  const setDraft = (next: string) => setEditing({ accepted: value, draft: next });
  const numericDraft = draft.trim() ? Number(draft) : null;
  const boundsError = (min !== undefined && max !== undefined && min > max) ? '最小值不能大于最大值。' : numericDraft !== null && Number.isFinite(numericDraft) && ((min !== undefined && numericDraft < min) || (max !== undefined && numericDraft > max)) ? `请输入 ${min ?? '−∞'} 至 ${max ?? '+∞'} 之间的数字。` : undefined;
  const draftError = (candidate: string) => {
    if (!candidate.trim()) return required ? '请填写数字。' : '';
    const n = Number(candidate);
    if (!Number.isFinite(n)) return '请输入有效数字。';
    if ((min !== undefined && max !== undefined && min > max)) return '最小值不能大于最大值。';
    if ((min !== undefined && n < min) || (max !== undefined && n > max)) return `请输入 ${min ?? '−∞'} 至 ${max ?? '+∞'} 之间的数字。`;
    return '';
  };
  const validation = (candidate: string) => disabled || readOnly ? '' : error || (composing.current ? '请先完成输入法组词。' : '') || (min !== undefined && max !== undefined && min > max ? '最小值不能大于最大值。' : draftError(candidate));
  const blocked = disabled || readOnly || (min !== undefined && max !== undefined && min > max);
  const normalize = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, Number(n.toFixed(Math.max(0, Math.min(15, precision ?? 12))))));
  const commit = () => {
    if (composing.current || blocked) return;
    if (draft.trim() && draftError(draft)) { setShowError(true); return; }
    const n = draft.trim() ? Number(draft) : null;
    const next = n === null || precision === undefined ? n : normalize(n);
    setDraft(next === null ? '' : String(next)); setShowError(!!draftError(draft));
    if (next !== value) onValueChange(next);
  };
  const restore = () => { setDraft(text); setShowError(false); };
  // Public native validity is current even before blur/Enter exposes a message.
  useLayoutEffect(() => {
    root.current?.querySelector('input')?.setCustomValidity(validation(draft));
  });
  const latest = useRef({ commit, restore, validation, draft, text, showError, blocked });
  useLayoutEffect(() => { latest.current = { commit, restore, validation, draft, text, showError, blocked }; });
  useLayoutEffect(() => {
    const input = root.current?.querySelector('input');
    if (!input) return;
    const doc = input.ownerDocument;
    const submit = (event: Event) => {
      if (event.target !== input.form || !input.form || input.matches(':disabled') || input.readOnly) return;
      if (!input.validity.valid) {
        // A later field must not relax this rejected draft and let the host
        // save its old value. End this attempt before any later listener.
        event.preventDefault(); event.stopImmediatePropagation();
        flushSync(() => setShowError(true));
        input.checkValidity();
        return;
      }
      // Keep this listener stable: another field's flushSync may rerender the
      // whole form while the same native submit event is still dispatching.
      flushSync(() => latest.current.commit());
    };
    const windowBlur = (event: Event) => {
      if (event.target !== event.currentTarget || !composing.current) return;
      composing.current = false; setIsComposing(false); input.setCustomValidity(latest.current.validation(input.value));
    };
    const escape = (event: globalThis.KeyboardEvent) => {
      const current = latest.current;
      if (event.target !== input || event.key !== 'Escape' || event.isComposing || event.keyCode === 229 || composing.current || current.blocked) return;
      if (current.draft !== current.text || current.showError) { event.preventDefault(); event.stopImmediatePropagation(); current.restore(); }
    };
    doc.addEventListener('submit', submit, true);
    doc.defaultView?.addEventListener('keydown', escape, true);
    doc.defaultView?.addEventListener('blur', windowBlur, true);
    return () => { doc.removeEventListener('submit', submit, true); doc.defaultView?.removeEventListener('keydown', escape, true); doc.defaultView?.removeEventListener('blur', windowBlur, true); };
  }, []);
  const move = (direction: number) => {
    if (blocked || composing.current) return;
    const parsed = draft.trim() ? Number(draft) : value ?? 0;
    const next = normalize((Number.isFinite(parsed) ? parsed : value ?? 0) + direction * (Number.isFinite(step) && step ? Math.abs(step) : 1));
    setDraft(String(next)); setShowError(false); if (next !== value) onValueChange(next);
  };
  return <div ref={root} className="rhine-number-field"><TextField label={label} id={id} name={name} hint={hint} required={required} readOnly={readOnly} inputMode="decimal" role="spinbutton" aria-valuenow={numericDraft !== null && Number.isFinite(numericDraft) ? numericDraft : undefined} aria-valuemin={min} aria-valuemax={max}
    value={draft} disabled={disabled} error={error || boundsError || (showError && !isComposing ? draftError(draft) : '') || undefined}
    onChange={event => { if (!blocked) { event.currentTarget.setCustomValidity(validation(event.target.value)); setDraft(event.target.value); setShowError(false); } }} onBlur={event => { if (composing.current) { composing.current = false; setIsComposing(false); event.currentTarget.setCustomValidity(validation(event.currentTarget.value)); } else commit(); }} onInvalid={() => setShowError(true)}
    onCompositionStart={event => { composing.current = true; setIsComposing(true); event.currentTarget.setCustomValidity(validation(draft)); }} onCompositionEnd={event => { composing.current = false; setIsComposing(false); event.currentTarget.setCustomValidity(validation(event.currentTarget.value)); }}
    onKeyDown={event => { if (event.nativeEvent.isComposing || event.keyCode === 229 || composing.current || blocked) return; if (event.key === 'Enter') { event.preventDefault(); commit(); } if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); move(event.key === 'ArrowUp' ? 1 : -1); } }} />
    {controls && <div className="rhine-inline"><Button variant="secondary" disabled={blocked || (numericDraft !== null && min !== undefined && numericDraft <= min)} onMouseDown={event => event.preventDefault()} onClick={() => move(-1)} aria-label={`减少${label}`}>−</Button><Button variant="secondary" disabled={blocked || (numericDraft !== null && max !== undefined && numericDraft >= max)} onMouseDown={event => event.preventDefault()} onClick={() => move(1)} aria-label={`增加${label}`}>+</Button></div>}
  </div>;
}

export interface RemoteMultiSelectProps {
  closeReason?:Exclude<SelectionChangeReason,'open'>;focusOnOpen?:boolean;id?:string;inputProps?:ComboboxProps['inputProps'];open?:boolean;onOpenChange?:ComboboxProps['onOpenChange'];onClose?:(reason:SelectionChangeReason)=>void;cancelLabel?:string;maxSelected?:number;
  labelAction?: ComboboxProps['labelAction'];
  validationError?: ComboboxProps['validationError'];
  statusDisplay?: ComboboxProps['statusDisplay'];
  hasMore?: boolean; onLoadMore?: () => void; loadingMore?: boolean; loadMoreError?: string; onRetry?: () => void;
  label: string; query: string; onQueryChange: (query: string) => void;
  value: Choice[]; onValueChange: (value: Choice[]) => void; options: Choice[];
  loading?: boolean; error?: string; disabled?: boolean;
  readOnly?: boolean; clearable?: boolean; closeOnSelect?: boolean; clearQueryOnSelect?: boolean;
  placeholder?: string; hint?: string; name?: string;
  maxVisibleTags?: number;
  /** Compact captions; 28px targets only for fine pointers without any coarse pointer. */
  tagDensity?: 'default' | 'compact';
  activeValue?: string;
  onActivateValue?: (option: Choice) => void;
}
export function RemoteMultiSelect({value,onValueChange,options,readOnly=false,clearable=true,closeOnSelect=false,clearQueryOnSelect=false,name,maxVisibleTags,tagDensity='default',activeValue,onActivateValue,id:suppliedId,open:controlledOpen,onOpenChange,onClose,closeReason,maxSelected,...props}:RemoteMultiSelectProps){
 const generated=useId(),inputId=suppliedId||generated,nativeDisabled=useNativeFieldDisabled(inputId);const{open,request}=useSelectionLifecycle(controlledOpen,onOpenChange,onClose,Boolean(props.disabled||readOnly||nativeDisabled),closeReason);
 const focusInput=(nextOpen=false)=>{document.getElementById(inputId)?.focus();request(nextOpen,{reason:nextOpen?'open':'selection'});};
 const remove=(key:string,nextOpen=false)=>{if(props.disabled||nativeDisabled||readOnly||value.find(item=>item.value===key)?.disabled)return;onValueChange(value.filter(item=>item.value!==key));focusInput(nextOpen);};
 const maximum=maxSelected!==undefined&&Number.isFinite(maxSelected)?Math.max(0,Math.floor(maxSelected)):undefined;
 return <div data-tag-density={tagDensity} className={'rhine-multi-select'+(maxVisibleTags!==undefined?' rhine-multi-select--compact':'')}>
 <Combobox {...props} id={inputId} open={open} onOpenChange={request} readOnly={readOnly} selectedValues={value.map(item=>item.value)} closeOnSelect={closeOnSelect} completionLabel={closeOnSelect?undefined:'完成选择'} onEmptyBackspace={()=>{const last=[...value].reverse().find(item=>!item.disabled);if(last)remove(last.value,open);}} options={options.map(option=>({...option,disabled:option.disabled||value.some(item=>item.value===option.value&&item.disabled)||(maximum!==undefined&&value.length>=maximum&&!value.some(item=>item.value===option.value))}))} value={null} onValueChange={option=>{
 const original=options.find(item=>item.value===option.value);if(!original||original.disabled||props.disabled||readOnly)return;const selected=value.find(item=>item.value===original.value);if(selected?.disabled||(!selected&&maximum!==undefined&&value.length>=maximum))return;onValueChange(selected?value.filter(item=>item.value!==original.value):[...value,original]);if(clearQueryOnSelect)props.onQueryChange('');
 }}/>
 {name&&value.map(item=><input key={item.value} type="hidden" name={name} value={item.value} form={props.inputProps?.form} disabled={props.disabled}/>)}
 <SelectionTags id={inputId} label={props.label} value={value} maxVisibleTags={maxVisibleTags} disabled={props.disabled||nativeDisabled} readOnly={readOnly} clearable={clearable} onRemove={key=>remove(key)} onClear={()=>{onValueChange(value.filter(item=>item.disabled));focusInput();}} activeValue={activeValue} onActivateValue={onActivateValue?item=>{request(false,{reason:'programmatic'});onActivateValue(item);}:undefined}/>
 </div>;
}

export type { TreeNode, TreeSelectProps } from './TreeView';


export {TreeSelect} from './TreeSelect';
