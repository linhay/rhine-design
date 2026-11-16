import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from './components';
import { FieldFeedback, fieldDescription, type ProvidedFieldProps } from './field-support';
import { DataFeedback, type ProvidedDataProps } from './data-feedback';

const splitValue = (value: number) => Math.min(80, Math.max(20, Number.isFinite(value) ? Math.round(value) : 50));
export function Splitter({ label, value, onChange, start, end, disabled = false }: { label: string; value: number; onChange: (value: number) => void; start: ReactNode; end: ReactNode; disabled?: boolean }) {
  const id = useId(), root = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const current = splitValue(value);
  useEffect(() => { if (disabled) { pointer.current = null; setDragging(false); } }, [disabled]);
  return <div ref={root} className="rhine-splitter" data-dragging={dragging || undefined} style={{ gridTemplateColumns: `minmax(0,${current}fr) 44px minmax(0,${100 - current}fr)` }}>
    <div id={`${id}-start`} className="rhine-splitter__pane">{start}</div>
    <div className="rhine-splitter__bar" role="separator" aria-orientation="vertical" aria-label={label} aria-controls={`${id}-start ${id}-end`} aria-valuemin={20} aria-valuemax={80} aria-valuenow={current} aria-valuetext={`${current}%`} aria-disabled={disabled || undefined} tabIndex={disabled ? -1 : 0}
      onPointerDown={event => { if (disabled || event.button !== 0) return; event.preventDefault(); event.currentTarget.focus(); pointer.current = event.pointerId; event.currentTarget.setPointerCapture?.(event.pointerId); setDragging(true); }}
      onPointerMove={event => {
        if (disabled || pointer.current !== event.pointerId || !root.current) return;
        const bounds = root.current.getBoundingClientRect(), bar = event.currentTarget.getBoundingClientRect();
        const width = bounds.width - bar.width;
        if (width <= 0) return;
        const distance = getComputedStyle(root.current).direction === 'rtl' ? bounds.right - event.clientX : event.clientX - bounds.left;
        onChange(splitValue((distance - bar.width / 2) / width * 100));
      }}
      onPointerUp={event => { if (pointer.current !== event.pointerId) return; pointer.current = null; setDragging(false); if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
      onPointerCancel={() => { pointer.current = null; setDragging(false); }} onLostPointerCapture={() => { pointer.current = null; setDragging(false); }}
      onKeyDown={event => {
        if (disabled || !['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) return;
        event.preventDefault(); event.stopPropagation();
        const direction = root.current && getComputedStyle(root.current).direction === 'rtl' ? -1 : 1;
        const next = event.key === 'Home' ? 20 : event.key === 'End' ? 80 : current + (event.key === 'PageUp' ? 10 : event.key === 'PageDown' ? -10 : event.key === 'ArrowRight' ? 5 * direction : -5 * direction);
        onChange(splitValue(next));
      }} />
    <div id={`${id}-end`} className="rhine-splitter__pane">{end}</div>
  </div>;
}

type TransferItem = { id: string; label: string; disabled?: boolean };
export interface TransferProps extends Omit<ProvidedFieldProps,'required'>, ProvidedDataProps { label:string; source:readonly TransferItem[]; target:readonly string[]; onChange:(target:string[])=>void }
export function Transfer({ label, source, target, onChange, disabled = false, readOnly = false, id: suppliedId, name, form, hint, error, loading = false, loadError, onRetry, emptyText, 'aria-describedby': extra }: TransferProps) {
  const generated = useId(), id = suppliedId || generated, root = useRef<HTMLDivElement>(null), ownedFocus = useRef<HTMLElement | null>(null);
  const immutable = readOnly || loading || !!loadError;
  const missing = target.filter(key => !source.some(item => item.id === key)).length;
  const [picked, setPicked] = useState<string[]>([]);
  const [active, setActive] = useState<string[]>(['', '']);
  const pendingMove = useRef<{ keys:string[]; into:boolean; origin:Element | null } | null>(null);
  const previousTarget = useRef(new Set(target));
  const sides = [source.filter(item => !target.includes(item.id)), source.filter(item => target.includes(item.id))];
  const inputId = (key: string) => `${id}-${encodeURIComponent(key)}`;
  const focus = (key: string) => { document.getElementById(inputId(key))?.focus(); };
  useLayoutEffect(() => {
    const intent = pendingMove.current;
    // An action owns only this commit. Rejected/asynchronous updates must not
    // leave focus work for a later refresh or an unrelated target array.
    pendingMove.current = null;
    if (!intent) return;
    const accepted = intent.keys.filter(key => source.some(item => item.id === key) && target.includes(key) === intent.into);
    if (!accepted.length) return;
    setPicked(current => current.filter(key => !accepted.includes(key)));
    const active = document.activeElement;
    if (!disabled && !immutable && (active === intent.origin || active === document.body || active?.hasAttribute('data-radix-focus-guard'))) {
      const next = accepted.find(key => !source.find(item => item.id === key)?.disabled);
      if (next) focus(next);
    }
  });
  useLayoutEffect(() => {
    const current = new Set(target), before = previousTarget.current, present = new Set(source.map(item => item.id));
    previousTarget.current = current;
    const next = picked.filter(key => ((loading || loadError) || present.has(key)) && before.has(key) === current.has(key));
    if (next.length !== picked.length) setPicked(next);
  });
  useLayoutEffect(()=>{const previous=ownedFocus.current;if(previous && document.activeElement===document.body && (!previous.isConnected || previous.matches(':disabled')))root.current?.focus({preventScroll:true});});
  const move = (into: boolean, fallback?: string) => {
    if (disabled || immutable) return;
    const candidates = sides[into ? 0 : 1].filter(item => !item.disabled);
    const chosen = candidates.filter(item => picked.includes(item.id));
    const moving = chosen.length ? chosen : fallback ? candidates.filter(item => item.id === fallback) : [];
    if (!moving.length) return;
    const keys = moving.map(item => item.id), next = new Set(target);
    keys.forEach(key => into ? next.add(key) : next.delete(key));
    const intent = { keys, into, origin:document.activeElement };
    pendingMove.current = intent;
    try { onChange([...next]); }
    catch (error) { if (pendingMove.current === intent) pendingMove.current = null; throw error; }
    setActive(current => current.map((key, index) => index === (into ? 1 : 0) ? keys[0] : key));
  };
  const status = loading || loadError;
  const described = fieldDescription(id,hint,error,[extra,status&&`${id}-data`,missing&&!loading&&!loadError&&`${id}-missing`,readOnly&&`${id}-readonly`].filter(Boolean).join(' ')||undefined);
  return <div ref={root} id={id} className="rhine-transfer" role="group" aria-label={label} aria-busy={loading||undefined} aria-invalid={!!error||undefined} aria-describedby={described} tabIndex={-1} data-readonly={readOnly||undefined} onFocusCapture={event=>{ownedFocus.current=event.target;}} onBlurCapture={event=>{if(event.relatedTarget&&!event.currentTarget.contains(event.relatedTarget))ownedFocus.current=null;}}>
    {name&&target.map((key,index)=><input key={`${index}-${key}`} type="hidden" name={name} form={form} value={key} disabled={disabled}/>)}
    <div className="rhine-transfer__columns">
    {sides.map((items, side) => {
      const available = items.filter(item => !item.disabled);
      const current = available.some(item => item.id === active[side]) ? active[side] : available[0]?.id;
      const list = <section key={side}><h3>{side ? '已选' : '可选'} <span aria-live="polite">{side ? target.length : (loading || loadError) && !source.length ? '未知' : items.length} 项</span></h3><ul aria-label={side ? '已选' : '可选'}>{items.map(item => <li key={item.id}><label><input id={inputId(item.id)} type="checkbox" disabled={disabled || item.disabled} aria-disabled={loading||!!loadError||undefined} aria-readonly={readOnly||undefined} tabIndex={current === item.id ? 0 : -1} checked={picked.includes(item.id)} onFocus={() => setActive(current => current.map((key, index) => index === side ? item.id : key))} onChange={() => { if (!disabled && !immutable && !item.disabled) setPicked(current => current.includes(item.id) ? current.filter(key => key !== item.id) : [...current, item.id]); }} onKeyDown={event => {
        if (disabled || item.disabled || event.nativeEvent.isComposing || event.keyCode === 229) return;
        if(immutable && ([' ','Enter','ArrowLeft','ArrowRight'].includes(event.key)||((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='a'))){event.preventDefault();return;}
        const index = available.findIndex(entry => entry.id === item.id);
        if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
          event.preventDefault();
          const next = event.key === 'Home' ? available[0] : event.key === 'End' ? available.at(-1) : available[(index + (event.key === 'ArrowDown' ? 1 : -1) + available.length) % available.length];
          if (next) focus(next.id);
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
          event.preventDefault();
          const keys = available.map(entry => entry.id), all = keys.every(key => picked.includes(key));
          setPicked(current => all ? current.filter(key => !keys.includes(key)) : [...new Set([...current, ...keys])]);
        }
        if (event.key === (side ? 'ArrowLeft' : 'ArrowRight')) { event.preventDefault(); move(!side, item.id); }
      }} />{item.label}</label></li>)}</ul>{!items.length && !loading && !loadError && <p>{side && target.length ? '所选项暂未提供详情' : emptyText||'暂无项目'}</p>}</section>;
      return side ? list : [list, <div className="rhine-transfer__actions" key="actions"><Button aria-disabled={immutable||undefined} disabled={disabled || (!immutable && !sides[0].some(item => !item.disabled && picked.includes(item.id)))} onClick={() => move(true)}>移到已选</Button><Button variant="secondary" aria-disabled={immutable||undefined} disabled={disabled || (!immutable && !sides[1].some(item => !item.disabled && picked.includes(item.id)))} onClick={() => move(false)}>移回可选</Button></div>];
    })}</div>
    <DataFeedback id={`${id}-data`} loading={loading} loadError={loadError} empty={false} emptyText={emptyText} disabled={disabled} onRetry={onRetry} focusId={id}/>
    <FieldFeedback id={id} hint={hint} error={error}/>
    {readOnly&&<span id={`${id}-readonly`} className="rhine-sr-only">只读，不能更改选择。</span>}
    {!!missing&&!loading&&!loadError&&<p id={`${id}-missing`} role="status">有 {missing} 项已选值暂未提供详情，原值保留。</p>}
  </div>;
}

const isoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isFinite(date.getTime()) && isoDate(date) === value ? date : null;
}
function shiftMonth(date: Date, amount: number) {
  const first = new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
  first.setDate(Math.min(date.getDate(), new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()));
  return first;
}
export function Calendar({ label, value, onChange, disabled = false }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const initial = parseDate(value) ?? new Date();
  const [shown, setShown] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1, 12));
  const [active, setActive] = useState(isoDate(initial));
  const root = useRef<HTMLDivElement>(null), pendingFocus = useRef(false), id = useId();
  const buttonId = (date: string) => `${id}-${date}`;
  useEffect(() => {
    const next = parseDate(value);
    if (!next) return;
    pendingFocus.current = !!root.current?.querySelector('.rhine-calendar__days')?.contains(document.activeElement);
    setShown(new Date(next.getFullYear(), next.getMonth(), 1, 12)); setActive(value);
  }, [value]);
  useLayoutEffect(() => { if (pendingFocus.current) { document.getElementById(buttonId(active))?.focus(); pendingFocus.current = false; } }, [active, shown]);
  const navigate = (next: Date, focus = true) => {
    pendingFocus.current = focus;
    setShown(new Date(next.getFullYear(), next.getMonth(), 1, 12)); setActive(isoDate(next));
  };
  const days = new Date(shown.getFullYear(), shown.getMonth() + 1, 0).getDate();
  const offset = (shown.getDay() + 6) % 7;
  const weeks = Array.from({ length: Math.ceil((offset + days) / 7) }, (_, week) => Array.from({ length: 7 }, (_, weekday) => week * 7 + weekday - offset + 1));
  return <div className="rhine-calendar" ref={root}><div className="rhine-calendar__head"><Button variant="secondary" disabled={disabled} onClick={() => navigate(shiftMonth(parseDate(active) ?? shown, -1), false)}>上个月</Button><span aria-live="polite">{shown.getFullYear()} 年 {shown.getMonth() + 1} 月</span><Button variant="secondary" disabled={disabled} onClick={() => navigate(shiftMonth(parseDate(active) ?? shown, 1), false)}>下个月</Button></div>
    <div className="rhine-calendar__viewport" role="region" aria-label={`${label}月历`} tabIndex={0}><table className="rhine-calendar__days" role="grid" aria-label={label} aria-disabled={disabled || undefined}><thead><tr>{['一', '二', '三', '四', '五', '六', '日'].map(day => <th scope="col" key={day}>周{day}</th>)}</tr></thead><tbody>{weeks.map((week, index) => <tr key={index}>{week.map((day, weekday) => {
      if (day < 1 || day > days) return <td key={weekday} />;
      const date = new Date(shown.getFullYear(), shown.getMonth(), day, 12), iso = isoDate(date);
      return <td key={weekday} aria-selected={value === iso}><button type="button" id={buttonId(iso)} aria-label={`${shown.getFullYear()}年${shown.getMonth() + 1}月${day}日`} aria-pressed={value === iso} disabled={disabled} tabIndex={active === iso ? 0 : -1} onFocus={() => setActive(iso)} onClick={() => onChange(iso)} onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) return;
        event.preventDefault();
        const next = new Date(date);
        if (event.key === 'PageUp' || event.key === 'PageDown') navigate(shiftMonth(date, (event.key === 'PageDown' ? 1 : -1) * (event.shiftKey ? 12 : 1)));
        else {
          const weekday = (date.getDay() + 6) % 7;
          next.setDate(day + (event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : event.key === 'ArrowUp' ? -7 : event.key === 'ArrowDown' ? 7 : event.key === 'Home' ? -weekday : 6 - weekday)); navigate(next);
        }
      }}>{day}</button></td>;
    })}</tr>)}</tbody></table></div></div>;
}
