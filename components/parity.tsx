import { useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent, type FormHTMLAttributes, type ReactNode } from 'react';
import { Button } from './components';
import { Text } from './Typography';
import { Stack } from './Layout';
import { Icon } from './Actions';
import { useDismissFocus } from './focus-recovery';
import { Combobox } from './Forms';
import type { ProvidedFieldProps, QueryInputProps } from './field-support';
import { TreeSelect, type TreeNode } from './AdvancedForms';
import { Menu, Popover } from './Overlays';
export { ConfigProvider, useConfig } from './config';

type Gap = 1 | 2 | 3 | 4 | 6 | 8 | 12;

export function Flex({ direction = 'row', gap = 3, wrap = false, children }: { direction?: 'row' | 'column'; gap?: Gap; wrap?: boolean; children: ReactNode }) {
  return <div className="rhine-flex" data-direction={direction} data-wrap={wrap || undefined} style={{ gap: `var(--rhine-space-${gap})` }}>{children}</div>;
}
export function Columns({ children }: { children: ReactNode }) { return <div className="rhine-columns">{children}</div>; }
export function Column({ span = 24, children }: { span?: number; children: ReactNode }) {
  return <div className="rhine-column" style={{ gridColumn: `span ${Math.min(24, Math.max(1, Math.floor(span) || 1))}` }}>{children}</div>;
}

export function Dropdown({ label, items, onSelect, disabled = false }: { label: string; items: readonly { id: string; label: string; disabled?: boolean }[]; onSelect: (id: string) => void; disabled?:boolean }) {
  const [open,setOpen] = useState(false);
  useEffect(() => { if(disabled)setOpen(false); },[disabled]);
  return <Menu label={label} trigger={<Button disabled={disabled}>{label}</Button>} open={open && !disabled} onOpenChange={next => { if(!disabled)setOpen(next); }} items={items.map(item => ({ ...item, onSelect: () => { if(!disabled)onSelect(item.id); } }))} />;
}
export interface AutoCompleteProps extends ProvidedFieldProps, QueryInputProps {
  label:string; value:string; onChange:(value:string)=>void; options:readonly string[]; onSelect?:(value:string)=>void;
  loading?:boolean; optionsError?:string; onRetry?:()=>void; placeholder?:string;
}
export function AutoComplete({ label, value, onChange, options, onSelect, id, name, form, required, disabled, readOnly, hint, error, loading, optionsError, onRetry, placeholder, minLength, maxLength, pattern, autoComplete, inputMode, 'aria-describedby': describedBy }: AutoCompleteProps) {
  return <Combobox id={id} label={label} query={value} onQueryChange={onChange} value={options.includes(value) ? value : null} options={[...new Set(options)].filter(option => option.includes(value)).map(option => ({ value: option, label: option }))} disabled={disabled} readOnly={readOnly} hint={hint} validationError={error} loading={loading} error={optionsError} onRetry={onRetry} placeholder={placeholder} inputProps={{name,form,required,minLength,maxLength,pattern,autoComplete,inputMode,'aria-describedby':describedBy}} onValueChange={option => { onChange(option.value); onSelect?.(option.value); }} />;
}

export interface FormProps extends Omit<FormHTMLAttributes<HTMLFormElement>,'onSubmit'|'children'> { label:string; children:ReactNode; onSubmit:(event:FormEvent<HTMLFormElement>)=>void }
export function Form({ label, onSubmit, children, ...props }: FormProps) {
  return <form {...props} aria-label={label} onSubmit={event => { event.preventDefault(); onSubmit(event); }}>{children}</form>;
}
export function Card({ title, extra, children }: { title: string; extra?: ReactNode; children: ReactNode }) {
  return <section className="rhine-card"><header><Text as="h3" variant="heading">{title}</Text>{extra}</header><Stack gap={3}>{children}</Stack></section>;
}
export function Collapse({ label, items, accordion = false }: { label: string; items: readonly { id: string; title: string; content: ReactNode }[]; accordion?: boolean }) {
  const id = useId(), root = useRef<HTMLDivElement>(null);
  const focused = useRef<{ key:string; node:HTMLElement } | null>(null);
  const [open, setOpen] = useState<string[]>(accordion ? items.slice(0, 1).map(item => item.id) : items.map(item => item.id));
  const eligible = open.filter(key => items.some(item => item.id === key));
  const retained = focused.current && eligible.includes(focused.current.key) ? focused.current.key : eligible[0];
  const visible = accordion ? retained ? [retained] : [] : eligible;
  useLayoutEffect(() => {
    if (open.length !== visible.length || open.some((key, index) => key !== visible[index])) setOpen(visible);
    const previous = focused.current;
    if (previous && !previous.node.isConnected) {
      focused.current = null;
      if (document.activeElement === document.body) root.current?.querySelector<HTMLElement>('button')?.focus();
    }
  });
  const toggle = (key: string) => setOpen(current => current.includes(key) ? current.filter(item => item !== key) : accordion ? [key] : [...current, key]);
  return <div ref={root} className="rhine-collapse" role="group" aria-label={label} onFocusCapture={event => {
    const section = event.target.closest<HTMLElement>('[data-rhine-collapse-key]');
    if (section) focused.current = { key:section.dataset.rhineCollapseKey!, node:event.target };
  }} onBlurCapture={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) focused.current = null; }}>{items.map(item => {
    const key = encodeURIComponent(item.id), expanded = visible.includes(item.id);
    return <section key={item.id} data-rhine-collapse-key={item.id}><Button variant="quiet" className="rhine-collapse__toggle" id={`${id}-heading-${key}`} aria-controls={expanded ? `${id}-panel-${key}` : undefined} aria-expanded={expanded} onClick={() => toggle(item.id)}><Icon name={expanded ? 'chevronDown' : 'chevronRight'} /><span>{item.title}</span></Button>{expanded && <div id={`${id}-panel-${key}`} role="region" aria-labelledby={`${id}-heading-${key}`}>{item.content}</div>}</section>;
  })}</div>;
}

export function Descriptions({ title, items }: { title: string; items: readonly { label: string; value: ReactNode }[] }) {
  return <section className="rhine-descriptions" aria-label={title}><Text as="h3" variant="heading">{title}</Text><dl>{items.map(item => <div key={item.label}><dt><Text as="span" variant="caption" tone="muted">{item.label}</Text></dt><dd>{item.value}</dd></div>)}</dl></section>;
}
export { Image } from './Image';

export function List({ label, items }: { label: string; items: readonly { id: string; title: string; description?: string }[] }) {
  return <ul className="rhine-list" aria-label={label}>{items.map(item => <li key={item.id}><strong>{item.title}</strong>{item.description && <span>{item.description}</span>}</li>)}</ul>;
}
export function EventTimeline({ label, items }: { label: string; items: readonly { id: string; time: string; title: string }[] }) {
  return <ol className="rhine-events" aria-label={label}>{items.map(item => <li key={item.id}><time>{item.time}</time><span>{item.title}</span></li>)}</ol>;
}
export interface BrowseNode { id: string; label: string; children?: readonly BrowseNode[] }
export function Tree({ label, nodes, selected, onSelect }: { label: string; nodes: readonly BrowseNode[]; selected?: string; onSelect: (id: string) => void }) {
  const [expanded, setExpanded] = useState<string[]>([]);
  const convert = (items: readonly BrowseNode[]): TreeNode[] => items.map(node => ({ ...node, children: node.children ? convert(node.children) : undefined }));
  return <TreeSelect label={label} nodes={convert(nodes)} value={selected ? [selected] : []} onValueChange={values => { if (values[0]) onSelect(values[0]); }} expandedKeys={expanded} onExpandedChange={setExpanded} />;
}
export function Message({ title, children, onClose }: { title: string; children?: ReactNode; onClose?: () => void }) {
  const root = useRef<HTMLDivElement>(null), recovery = useDismissFocus(root);
  return <div ref={root} className="rhine-message" role="status" onFocusCapture={recovery.onFocusCapture}><Text as="strong" variant="label">{title}</Text>{children}{onClose && <Button variant="quiet" onClick={event => recovery.dismiss(event.currentTarget, onClose)}>关闭提示</Button>}</div>;
}
export function Notification({ title, description, onClose }: { title: string; description: string; onClose: () => void }) {
  const root = useRef<HTMLElement>(null), recovery = useDismissFocus(root);
  return <section ref={root} className="rhine-notification" role="status" aria-label={title} onFocusCapture={recovery.onFocusCapture}><Text as="strong" variant="label">{title}</Text><Text>{description}</Text><Button variant="quiet" onClick={event => recovery.dismiss(event.currentTarget, onClose)}>关闭通知</Button></section>;
}
export function Popconfirm({ label, title, onConfirm }: { label: string; title: string; onConfirm: () => void }) {
  const [open, setOpen] = useState(false);
  return <Popover title={title} trigger={<Button>{label}</Button>} open={open} onOpenChange={setOpen} showHeader={false}><p>{title}</p><div className="rhine-inline"><Button variant="secondary" onClick={() => setOpen(false)}>取消</Button><Button onClick={() => { onConfirm(); setOpen(false); }}>确认</Button></div></Popover>;
}
export function CountBadge({ count, label, children }: { count: number; label: string; children: ReactNode }) {
  const summary = count > 99 ? '99+' : count;
  return <span className="rhine-count-badge">{children}<span title={`${count} ${label}`} aria-label={`${count} ${label}`}>{summary} {label}</span></span>;
}
