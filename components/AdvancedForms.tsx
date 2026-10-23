import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Button, TextField, type Choice } from './components';
import { Combobox } from './Forms';

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
  const invalid = error || dateError(props.value, props.min, props.max);
  useDateValidation(invalid, onValidationChange);
  return <TextField {...props} error={invalid} type="date" onChange={event => { if (!props.disabled && !props.readOnly) onValueChange(event.target.value); }} />;
}
export interface DateRange { start: string; end: string }
export interface DateRangePickerProps {
  label: string; value: DateRange; onValueChange: (value: DateRange) => void;
  min?: string; max?: string; disabled?: boolean; error?: string;
  presets?: { label: string; value: DateRange }[];
  readOnly?: boolean; required?: boolean; clearable?: boolean; hint?: string;
  startLabel?: string; endLabel?: string; startName?: string; endName?: string;
  onValidationChange?: (error: string | null) => void;
}
export function DateRangePicker({ label, value, onValueChange, min, max, disabled, error, presets = [], readOnly = false, required, clearable = true, hint, startLabel = '开始日期', endLabel = '结束日期', startName, endName, onValidationChange }: DateRangePickerProps) {
  const id = useId();
  const rangeError = (range: DateRange) => dateError(range.start, min, max) || dateError(range.end, min, max) || (range.start && range.end && range.start > range.end ? '结束日期不能早于开始日期。' : undefined);
  const invalid = error || rangeError(value);
  useDateValidation(invalid, onValidationChange);
  return <fieldset className="rhine-date-range" disabled={disabled} aria-describedby={[hint && `${id}-hint`, invalid && id].filter(Boolean).join(' ') || undefined}>
    <legend>{label}</legend><div className="rhine-date-range__fields">
      <DateField label={startLabel} name={startName} value={value.start} min={min} max={max} readOnly={readOnly} required={required} disabled={disabled} onValueChange={start => onValueChange({ ...value, start })} error={invalid ? '请检查日期范围' : undefined} />
      <DateField label={endLabel} name={endName} value={value.end} min={value.start && (!min || value.start > min) ? value.start : min} max={max} readOnly={readOnly} required={required} disabled={disabled} onValueChange={end => onValueChange({ ...value, end })} />
    </div><div className="rhine-inline">
      {presets.map(preset => <Button key={preset.label} variant="secondary" disabled={disabled || readOnly || !!rangeError(preset.value) || !!(required && (!preset.value.start || !preset.value.end))} onClick={() => onValueChange(preset.value)}>{preset.label}</Button>)}
      {clearable && <Button variant="quiet" disabled={disabled || readOnly || (!value.start && !value.end)} onClick={() => onValueChange({ start: '', end: '' })}>清空日期</Button>}
    </div>{hint && <p id={`${id}-hint`} className="rhine-field__hint">{hint}</p>}{invalid && <p id={id} role="alert" className="rhine-field__error">{invalid}</p>}
  </fieldset>;
}

export interface NumberFieldProps {
  label: string; value: number | null; onValueChange: (value: number | null) => void;
  min?: number; max?: number; step?: number; precision?: number; disabled?: boolean; error?: string;
  readOnly?: boolean; required?: boolean; name?: string; id?: string; hint?: string;
  controls?: boolean;
}
export function NumberField({ label, value, onValueChange, min, max, step = 1, precision, disabled, error, readOnly = false, required, name, id, hint, controls = true }: NumberFieldProps) {
  const [draft, setDraft] = useState(value === null ? '' : String(value));
  const [localError, setLocalError] = useState('');
  const composing = useRef(false);
  useEffect(() => { setDraft(value === null ? '' : String(value)); setLocalError(''); }, [value]);
  const numericDraft = draft.trim() ? Number(draft) : null;
  const boundsError = (min !== undefined && max !== undefined && min > max) ? '最小值不能大于最大值。' : numericDraft !== null && Number.isFinite(numericDraft) && ((min !== undefined && numericDraft < min) || (max !== undefined && numericDraft > max)) ? `请输入 ${min ?? '−∞'} 至 ${max ?? '+∞'} 之间的数字。` : undefined;
  const blocked = disabled || readOnly || (min !== undefined && max !== undefined && min > max);
  const normalize = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, Number(n.toFixed(Math.max(0, Math.min(15, precision ?? 12))))));
  const commit = () => {
    if (composing.current || blocked) return;
    if (!draft.trim()) { setLocalError(''); onValueChange(null); return; }
    const n = Number(draft);
    if (!Number.isFinite(n)) { setLocalError('请输入有效数字。'); return; }
    if ((min !== undefined && n < min) || (max !== undefined && n > max)) { setLocalError(`请输入 ${min ?? '−∞'} 至 ${max ?? '+∞'} 之间的数字。`); return; }
    const next = normalize(n); setDraft(String(next)); setLocalError(''); onValueChange(next);
  };
  const move = (direction: number) => {
    if (blocked || composing.current) return;
    const parsed = draft.trim() ? Number(draft) : value ?? 0;
    const next = normalize((Number.isFinite(parsed) ? parsed : value ?? 0) + direction * (Number.isFinite(step) && step ? Math.abs(step) : 1));
    setDraft(String(next)); setLocalError(''); onValueChange(next);
  };
  return <div className="rhine-number-field"><TextField label={label} id={id} name={name} hint={hint} required={required} readOnly={readOnly} inputMode="decimal" role="spinbutton" aria-valuenow={numericDraft !== null && Number.isFinite(numericDraft) ? numericDraft : undefined} aria-valuemin={min} aria-valuemax={max}
    value={draft} disabled={disabled} error={error || localError || boundsError} onChange={event => { if (!blocked) { setDraft(event.target.value); setLocalError(''); } }} onBlur={commit}
    onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }}
    onKeyDown={event => { if (event.nativeEvent.isComposing || composing.current || blocked) return; if (event.key === 'Escape' && (draft !== (value === null ? '' : String(value)) || localError)) { event.preventDefault(); event.stopPropagation(); setDraft(value === null ? '' : String(value)); setLocalError(''); } if (event.key === 'Enter') { event.preventDefault(); commit(); } if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); move(event.key === 'ArrowUp' ? 1 : -1); } }} />
    {controls && <div className="rhine-inline"><Button variant="secondary" disabled={blocked || (numericDraft !== null && min !== undefined && numericDraft <= min)} onMouseDown={event => event.preventDefault()} onClick={() => move(-1)} aria-label={`减少${label}`}>−</Button><Button variant="secondary" disabled={blocked || (numericDraft !== null && max !== undefined && numericDraft >= max)} onMouseDown={event => event.preventDefault()} onClick={() => move(1)} aria-label={`增加${label}`}>+</Button></div>}
  </div>;
}

export interface RemoteMultiSelectProps {
  label: string; query: string; onQueryChange: (query: string) => void;
  value: Choice[]; onValueChange: (value: Choice[]) => void; options: Choice[];
  loading?: boolean; error?: string; disabled?: boolean;
  readOnly?: boolean; clearable?: boolean; closeOnSelect?: boolean; clearQueryOnSelect?: boolean;
  placeholder?: string; hint?: string; name?: string;
}
export function RemoteMultiSelect({ value, onValueChange, options, readOnly = false, clearable = true, closeOnSelect = false, clearQueryOnSelect = false, name, ...props }: RemoteMultiSelectProps) {
  const inputId = useId();
  const focusInput = () => document.getElementById(inputId)?.focus();
  const remove = (key: string) => {
    if (props.disabled || readOnly || value.find(item => item.value === key)?.disabled) return;
    onValueChange(value.filter(item => item.value !== key)); focusInput();
  };
  return <div className="rhine-multi-select">
    <Combobox {...props} id={inputId} readOnly={readOnly} selectedValues={value.map(item => item.value)} closeOnSelect={closeOnSelect} onEmptyBackspace={() => { const last = [...value].reverse().find(item => !item.disabled); if (last) remove(last.value); }} options={options.map(option => ({ ...option, disabled: option.disabled || value.some(item => item.value === option.value) }))} value={null} onValueChange={option => { const original = options.find(item => item.value === option.value); if (original && !value.some(item => item.value === original.value)) { onValueChange([...value, original]); if (clearQueryOnSelect) props.onQueryChange(''); } }} />
    {name && value.map(item => <input key={item.value} type="hidden" name={name} value={item.value} disabled={props.disabled} />)}
    <ul className="rhine-multi-select__tags" aria-label={`${props.label}已选项`}>{value.map(item => <li key={item.value}><span>{item.label}</span><Button variant="quiet" disabled={props.disabled || readOnly || item.disabled} aria-label={`移除${item.label}`} onClick={() => remove(item.value)}>×</Button></li>)}</ul>
    {clearable && <Button variant="quiet" disabled={props.disabled || readOnly || !value.some(item => !item.disabled)} onClick={() => { onValueChange(value.filter(item => item.disabled)); focusInput(); }}>清空选择</Button>}
  </div>;
}

export interface TreeNode { id: string; label: string; disabled?: boolean; selectable?: boolean; children?: TreeNode[] }
export interface TreeSelectProps {
  label: string; nodes: TreeNode[]; value: string[]; onValueChange: (value: string[]) => void;
  expandedKeys: string[]; onExpandedChange: (keys: string[]) => void; multiple?: boolean;
  disabled?: boolean; loading?: boolean; error?: string;
  readOnly?: boolean; name?: string;
}
export function TreeSelect({ label, nodes, value, onValueChange, expandedKeys, onExpandedChange, multiple = false, disabled = false, loading, error, readOnly = false, name }: TreeSelectProps) {
  const root = useRef<HTMLDivElement>(null), id = useId();
  const [active, setActive] = useState<string>();
  const hadFocus = useRef(false), typeahead = useRef({ text: '', time: 0 });
  const visible: { node: TreeNode; parent?: string }[] = [];
  const collect = (items: TreeNode[], parent?: string) => items.forEach(node => { visible.push({ node, parent }); if (expandedKeys.includes(node.id)) collect(node.children ?? [], node.id); });
  collect(nodes);
  const parents = new Map<string, string | undefined>();
  const collectParents = (items: TreeNode[], parent?: string) => items.forEach(node => { parents.set(node.id, parent); collectParents(node.children ?? [], node.id); });
  collectParents(nodes);
  let ancestor = active;
  while (ancestor && !visible.some(item => item.node.id === ancestor)) ancestor = parents.get(ancestor);
  const current = ancestor || visible.find(item => value.includes(item.node.id))?.node.id || visible[0]?.node.id;
  const itemId = (key: string) => `${id}-item-${encodeURIComponent(key)}`;
  const focus = (key?: string) => { if (!key) return; setActive(key); document.getElementById(itemId(key))?.focus(); };
  useLayoutEffect(() => {
    if (hadFocus.current && active !== current && current) document.getElementById(itemId(current))?.focus();
  }, [active, current, id]);
  const expand = (node: TreeNode, next: boolean) => { if (!disabled) onExpandedChange(next ? [...new Set([...expandedKeys, node.id])] : expandedKeys.filter(key => key !== node.id)); };
  const canChoose = (node: TreeNode) => !disabled && !readOnly && !loading && !error && !node.disabled && node.selectable !== false;
  const choose = (node: TreeNode) => { if (!canChoose(node)) return; onValueChange(multiple ? value.includes(node.id) ? value.filter(key => key !== node.id) : [...value, node.id] : [node.id]); };
  const keyDown = (event: KeyboardEvent, node: TreeNode) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    const index = visible.findIndex(item => item.node.id === node.id), expanded = expandedKeys.includes(node.id);
    if (['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End',' ','Enter'].includes(event.key)) { event.preventDefault(); event.stopPropagation(); }
    if (event.key === 'ArrowDown') focus(visible[Math.min(visible.length - 1, index + 1)]?.node.id);
    if (event.key === 'ArrowUp') focus(visible[Math.max(0, index - 1)]?.node.id);
    if (event.key === 'Home') focus(visible[0]?.node.id);
    if (event.key === 'End') focus(visible.at(-1)?.node.id);
    if (event.key === 'ArrowRight' && node.children?.length) { if (!expanded) expand(node, true); else focus(node.children[0].id); }
    if (event.key === 'ArrowLeft') { if (expanded && node.children?.length) expand(node, false); else focus(visible[index]?.parent); }
    if (event.key === ' ' || event.key === 'Enter') choose(node);
    if (event.key === '*' && !disabled) { event.preventDefault(); event.stopPropagation(); onExpandedChange([...new Set([...expandedKeys, ...visible.filter(item => item.parent === visible[index]?.parent && item.node.children?.length).map(item => item.node.id)])]); }
    if (multiple && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault(); event.stopPropagation();
      if (disabled || readOnly || loading || error) return;
      const eligible = visible.filter(item => canChoose(item.node)).map(item => item.node.id);
      onValueChange(eligible.every(key => value.includes(key)) ? value.filter(key => !eligible.includes(key)) : [...new Set([...value, ...eligible])]);
    } else if (event.key.length === 1 && event.key !== ' ' && event.key !== '*' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.stopPropagation();
      const now = Date.now();
      const previous = now - typeahead.current.time < 500 ? typeahead.current.text : '';
      const typed = previous + event.key.toLocaleLowerCase();
      typeahead.current = { text: typed, time: now };
      const search = [...typed].every(character => character === typed[0]) ? typed[0] : typed;
      const ordered = [...visible.slice(index + 1), ...visible.slice(0, index + 1)];
      const match = ordered.find(item => item.node.label.toLocaleLowerCase().startsWith(search));
      if (match) { event.preventDefault(); event.stopPropagation(); focus(match.node.id); }
    }
  };
  const renderNodes = (items: TreeNode[]) => items.map(node => {
    const expanded = expandedKeys.includes(node.id);
    return <div role="treeitem" key={node.id} id={itemId(node.id)} tabIndex={current === node.id ? 0 : -1} aria-label={node.label} aria-expanded={node.children?.length ? expanded : undefined} aria-selected={!multiple && node.selectable !== false ? value.includes(node.id) : undefined} aria-checked={multiple && node.selectable !== false ? value.includes(node.id) : undefined} aria-disabled={disabled || loading || !!error || node.disabled || undefined}
      onFocus={event => { if (event.target === event.currentTarget) setActive(node.id); }} onKeyDown={event => keyDown(event, node)}>
      <div className="rhine-tree__row" data-selected={value.includes(node.id)} onClick={() => { focus(node.id); choose(node); }}>
        {node.children?.length ? <button type="button" tabIndex={-1} disabled={disabled} aria-label={`${expanded ? '收起' : '展开'}${node.label}`} onClick={event => { event.stopPropagation(); focus(node.id); expand(node, !expanded); }}>{expanded ? '−' : '+'}</button> : <span className="rhine-tree__spacer" />}
        {node.selectable !== false && <span aria-hidden="true">{value.includes(node.id) ? '✓' : '○'}</span>}<span>{node.label}</span>{node.disabled && <small>不可选</small>}
      </div>{expanded && !!node.children?.length && <div role="group">{renderNodes(node.children)}</div>}
    </div>;
  });
  return <div className="rhine-tree" ref={root} onFocusCapture={() => { hadFocus.current = true; }} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) hadFocus.current = false; }}>
    {name && value.map(key => <input key={key} type="hidden" name={name} value={key} disabled={disabled} />)}
    <div role="tree" aria-label={label} aria-multiselectable={multiple || undefined} aria-readonly={readOnly || undefined} aria-busy={loading} aria-disabled={disabled || undefined}>{renderNodes(nodes)}</div>{(loading || error || !nodes.length) && <p role={error ? 'alert' : 'status'}>{loading ? '正在读取…' : error || '暂无节点'}</p>}</div>;
}
