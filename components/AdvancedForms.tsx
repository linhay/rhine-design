import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Button, TextField, type Choice } from './components';
import { Combobox } from './Forms';

export interface DateFieldProps {
  label: string; value: string; onValueChange: (value: string) => void;
  min?: string; max?: string; disabled?: boolean; error?: string;
}
/** Date-only ISO strings: conversion to timestamps and time zones belongs to the host. */
export function DateField({ onValueChange, ...props }: DateFieldProps) {
  return <TextField {...props} type="date" onChange={event => onValueChange(event.target.value)} />;
}
export interface DateRange { start: string; end: string }
export interface DateRangePickerProps {
  label: string; value: DateRange; onValueChange: (value: DateRange) => void;
  min?: string; max?: string; disabled?: boolean; error?: string;
  presets?: { label: string; value: DateRange }[];
}
export function DateRangePicker({ label, value, onValueChange, min, max, disabled, error, presets = [] }: DateRangePickerProps) {
  const id = useId();
  const invalid = error || (value.start && value.end && value.start > value.end ? '结束日期不能早于开始日期。' : undefined);
  return <fieldset className="rhine-date-range" disabled={disabled} aria-describedby={invalid ? id : undefined}>
    <legend>{label}</legend><div className="rhine-date-range__fields">
      <DateField label="开始日期" value={value.start} min={min} max={max} onValueChange={start => onValueChange({ ...value, start })} error={invalid ? '请检查日期范围' : undefined} />
      <DateField label="结束日期" value={value.end} min={value.start && (!min || value.start > min) ? value.start : min} max={max} onValueChange={end => onValueChange({ ...value, end })} />
    </div><div className="rhine-inline">
      {presets.map(preset => <Button key={preset.label} variant="secondary" disabled={disabled || !!(min && preset.value.start < min) || !!(max && preset.value.end > max)} onClick={() => onValueChange(preset.value)}>{preset.label}</Button>)}
      <Button variant="quiet" disabled={disabled || (!value.start && !value.end)} onClick={() => onValueChange({ start: '', end: '' })}>清空日期</Button>
    </div>{invalid && <p id={id} role="alert" className="rhine-field__error">{invalid}</p>}
  </fieldset>;
}

export interface NumberFieldProps {
  label: string; value: number | null; onValueChange: (value: number | null) => void;
  min?: number; max?: number; step?: number; precision?: number; disabled?: boolean; error?: string;
}
export function NumberField({ label, value, onValueChange, min, max, step = 1, precision, disabled, error }: NumberFieldProps) {
  const [draft, setDraft] = useState(value === null ? '' : String(value));
  const [localError, setLocalError] = useState('');
  const composing = useRef(false);
  useEffect(() => { setDraft(value === null ? '' : String(value)); setLocalError(''); }, [value]);
  const normalize = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, Number(n.toFixed(Math.max(0, Math.min(15, precision ?? 12))))));
  const commit = () => {
    if (composing.current) return;
    if (!draft.trim()) { setLocalError(''); onValueChange(null); return; }
    const n = Number(draft);
    if (!Number.isFinite(n)) { setLocalError('请输入有效数字。'); return; }
    if ((min !== undefined && n < min) || (max !== undefined && n > max)) { setLocalError(`请输入 ${min ?? '−∞'} 至 ${max ?? '+∞'} 之间的数字。`); return; }
    const next = normalize(n); setDraft(String(next)); setLocalError(''); onValueChange(next);
  };
  const move = (direction: number) => {
    const parsed = draft.trim() ? Number(draft) : value ?? 0;
    const next = normalize((Number.isFinite(parsed) ? parsed : value ?? 0) + direction * Math.abs(step || 1));
    setDraft(String(next)); setLocalError(''); onValueChange(next);
  };
  return <div className="rhine-number-field"><TextField label={label} inputMode="decimal" role="spinbutton" aria-valuenow={draft.trim() && Number.isFinite(Number(draft)) ? Number(draft) : undefined} aria-valuemin={min} aria-valuemax={max}
    value={draft} disabled={disabled} error={error || localError} onChange={event => { setDraft(event.target.value); setLocalError(''); }} onBlur={commit}
    onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }}
    onKeyDown={event => { if (event.nativeEvent.isComposing || composing.current) return; if (event.key === 'Enter') { event.preventDefault(); commit(); } if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); move(event.key === 'ArrowUp' ? 1 : -1); } }} />
    <div className="rhine-inline"><Button variant="secondary" disabled={disabled || (min !== undefined && Number(draft) <= min)} onMouseDown={event => event.preventDefault()} onClick={() => move(-1)} aria-label={`减少${label}`}>−</Button><Button variant="secondary" disabled={disabled || (max !== undefined && Number(draft) >= max)} onMouseDown={event => event.preventDefault()} onClick={() => move(1)} aria-label={`增加${label}`}>+</Button></div>
  </div>;
}

export interface RemoteMultiSelectProps {
  label: string; query: string; onQueryChange: (query: string) => void;
  value: Choice[]; onValueChange: (value: Choice[]) => void; options: Choice[];
  loading?: boolean; error?: string; disabled?: boolean;
}
export function RemoteMultiSelect({ value, onValueChange, options, ...props }: RemoteMultiSelectProps) {
  return <div className="rhine-multi-select">
    <Combobox {...props} options={options.map(option => ({ ...option, disabled: option.disabled || value.some(item => item.value === option.value) }))} value={null} onValueChange={option => { const original = options.find(item => item.value === option.value); if (original) onValueChange([...value, original]); }} />
    <ul className="rhine-multi-select__tags" aria-label={`${props.label}已选项`}>{value.map(item => <li key={item.value}><span>{item.label}</span><Button variant="quiet" disabled={props.disabled || item.disabled} aria-label={`移除${item.label}`} onClick={() => onValueChange(value.filter(selected => selected.value !== item.value))}>×</Button></li>)}</ul>
    <Button variant="quiet" disabled={props.disabled || !value.some(item => !item.disabled)} onClick={() => onValueChange(value.filter(item => item.disabled))}>清空选择</Button>
  </div>;
}

export interface TreeNode { id: string; label: string; disabled?: boolean; children?: TreeNode[] }
export interface TreeSelectProps {
  label: string; nodes: TreeNode[]; value: string[]; onValueChange: (value: string[]) => void;
  expandedKeys: string[]; onExpandedChange: (keys: string[]) => void; multiple?: boolean;
  disabled?: boolean; loading?: boolean; error?: string;
}
export function TreeSelect({ label, nodes, value, onValueChange, expandedKeys, onExpandedChange, multiple = false, disabled = false, loading, error }: TreeSelectProps) {
  const root = useRef<HTMLDivElement>(null), id = useId();
  const [active, setActive] = useState<string>();
  const visible: { node: TreeNode; parent?: string }[] = [];
  const collect = (items: TreeNode[], parent?: string) => items.forEach(node => { visible.push({ node, parent }); if (expandedKeys.includes(node.id)) collect(node.children ?? [], node.id); });
  collect(nodes);
  const current = visible.some(item => item.node.id === active) ? active : visible[0]?.node.id;
  const focus = (key?: string) => { if (!key) return; setActive(key); const index = visible.findIndex(item => item.node.id === key); document.getElementById(`${id}-${index}`)?.focus(); };
  const expand = (node: TreeNode, next: boolean) => { if (!disabled) onExpandedChange(next ? [...new Set([...expandedKeys, node.id])] : expandedKeys.filter(key => key !== node.id)); };
  const choose = (node: TreeNode) => { if (disabled || loading || error || node.disabled) return; onValueChange(multiple ? value.includes(node.id) ? value.filter(key => key !== node.id) : [...value, node.id] : [node.id]); };
  const keyDown = (event: KeyboardEvent, node: TreeNode) => {
    const index = visible.findIndex(item => item.node.id === node.id), expanded = expandedKeys.includes(node.id);
    if (['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End',' ','Enter'].includes(event.key)) { event.preventDefault(); event.stopPropagation(); }
    if (event.key === 'ArrowDown') focus(visible[Math.min(visible.length - 1, index + 1)]?.node.id);
    if (event.key === 'ArrowUp') focus(visible[Math.max(0, index - 1)]?.node.id);
    if (event.key === 'Home') focus(visible[0]?.node.id);
    if (event.key === 'End') focus(visible.at(-1)?.node.id);
    if (event.key === 'ArrowRight' && node.children?.length) { if (!expanded) expand(node, true); else focus(node.children[0].id); }
    if (event.key === 'ArrowLeft') { if (expanded && node.children?.length) expand(node, false); else focus(visible[index]?.parent); }
    if (event.key === ' ' || event.key === 'Enter') choose(node);
  };
  const renderNodes = (items: TreeNode[]) => items.map(node => {
    const index = visible.findIndex(item => item.node.id === node.id), expanded = expandedKeys.includes(node.id);
    return <div role="treeitem" key={node.id} id={`${id}-${index}`} tabIndex={current === node.id ? 0 : -1} aria-label={node.label} aria-expanded={node.children?.length ? expanded : undefined} aria-selected={!multiple ? value.includes(node.id) : undefined} aria-checked={multiple ? value.includes(node.id) : undefined} aria-disabled={disabled || loading || !!error || node.disabled || undefined}
      onFocus={event => { if (event.target === event.currentTarget) setActive(node.id); }} onKeyDown={event => keyDown(event, node)}>
      <div className="rhine-tree__row" data-selected={value.includes(node.id)} onClick={() => { focus(node.id); choose(node); }}>
        {node.children?.length ? <button type="button" tabIndex={-1} disabled={disabled} aria-label={`${expanded ? '收起' : '展开'}${node.label}`} onClick={event => { event.stopPropagation(); focus(node.id); expand(node, !expanded); }}>{expanded ? '−' : '+'}</button> : <span className="rhine-tree__spacer" />}
        <span aria-hidden="true">{value.includes(node.id) ? '✓' : '○'}</span><span>{node.label}</span>{node.disabled && <small>不可选</small>}
      </div>{expanded && !!node.children?.length && <div role="group">{renderNodes(node.children)}</div>}
    </div>;
  });
  return <div className="rhine-tree" ref={root}><div role="tree" aria-label={label} aria-multiselectable={multiple || undefined} aria-busy={loading} aria-disabled={disabled || undefined}>{renderNodes(nodes)}</div>{(loading || error || !nodes.length) && <p role={error ? 'alert' : 'status'}>{loading ? '正在读取…' : error || '暂无节点'}</p>}</div>;
}
