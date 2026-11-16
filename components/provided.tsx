import { Children, isValidElement, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Button } from './components';
import { Link } from './Actions';
import { Text } from './Typography';
import { useDismissFocus } from './focus-recovery';
import { qrMatrix } from './qr-matrix';
import { FieldFeedback, fieldDescription, type ProvidedFieldProps } from './field-support';
export { VirtualList } from './VirtualList';
export { Splitter, Transfer, Calendar } from './provided-controls';
export { Cascader, Mentions, Tour, type CascadeOption } from './provided-overlays';

export function FloatButton({ label, children, onClick, disabled = false, contained = false }: { label: string; children: ReactNode; onClick?: () => void; disabled?: boolean; contained?: boolean }) {
  return <div className="rhine-float-button" data-contained={contained || undefined}><Button aria-label={label} disabled={disabled} onClick={onClick}>{children}</Button></div>;
}

export function Masonry({ label, columns = 3, children }: { label: string; columns?: number; children: ReactNode }) {
  return <div className="rhine-masonry" role="list" aria-label={label} style={{ ['--rhine-masonry-columns' as string]: Number.isFinite(columns) ? Math.max(1,Math.floor(columns)) : 3 }}>{Children.toArray(children).map((child,index)=><div role="listitem" key={isValidElement(child)&&child.key!=null?child.key:index}>{child}</div>)}</div>;
}

export function Anchor({ label, items, getHref = id => `#${id}` }: { label: string; items: readonly { id: string; label: string }[]; getHref?: (id: string) => string }) {
  const [current, setCurrent] = useState('');
  const idsKey = JSON.stringify(items.map(item => item.id));
  useEffect(() => {
    const ids = JSON.parse(idsKey) as string[];
    let active = true, generation = 0;
    let nodes: HTMLElement[] | undefined, observer: IntersectionObserver | undefined;
    setCurrent('');
    if (typeof IntersectionObserver === 'undefined') return;
    const synchronize = () => {
      const next = ids.map(id => document.getElementById(id)).filter((node): node is HTMLElement => !!node);
      if (nodes && nodes.length === next.length && nodes.every((node, index) => node === next[index])) return;
      nodes = next; observer?.disconnect(); setCurrent('');
      const version = ++generation;
      if (!next.length) return;
      const intersections = new Map<Element, IntersectionObserverEntry>();
      observer = new IntersectionObserver(entries => {
        if (!active || generation !== version) return;
        entries.forEach(entry => intersections.set(entry.target, entry));
        const visible = [...intersections.values()].filter(entry => entry.target.isConnected && entry.isIntersecting).sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
        setCurrent(visible?.target.id ?? '');
      }, { rootMargin: '-20% 0px -60% 0px' });
      next.forEach(node => observer!.observe(node));
    };
    synchronize();
    const mutations = typeof MutationObserver === 'undefined' ? undefined : new MutationObserver(synchronize);
    mutations?.observe(document.body, { childList: true, subtree: true });
    return () => { active = false; generation++; observer?.disconnect(); mutations?.disconnect(); };
  }, [idsKey]);
  return <nav className="rhine-anchor" aria-label={label}>{items.map(item => <Link key={item.id} href={getHref(item.id)} aria-current={current === item.id ? 'location' : undefined}>{item.label}</Link>)}</nav>;
}

export interface RateProps extends ProvidedFieldProps { label:string; value:number; onChange:(value:number)=>void; max?:number }
export function Rate({ label, value, onChange, max = 5, disabled = false, readOnly = false, id: suppliedId, name, form, required, hint, error, 'aria-describedby': extra }: RateProps) {
  const generated = useId(), id = suppliedId || generated, group = name || generated;
  const described = fieldDescription(id,hint,error,[extra,readOnly&&`${id}-readonly`].filter(Boolean).join(' ')||undefined);
  return <fieldset className="rhine-rate" disabled={disabled} data-readonly={readOnly || undefined}><legend>{label}</legend>{Array.from({ length: max }, (_, index) => {
    const score = index + 1;
    return <label key={score}><input id={index === 0 ? id : `${id}-${score}`} type="radio" name={group} form={form} required={required && !readOnly} aria-invalid={!!error || undefined} aria-describedby={described} value={score} checked={value === score} onKeyDown={event => { if(readOnly && [' ','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))event.preventDefault(); }} onChange={event => { if(!readOnly && !event.currentTarget.matches(':disabled'))onChange(score); }} />{score} 分</label>;
  })}<FieldFeedback id={id} hint={hint} error={error} />{readOnly&&<span id={`${id}-readonly`} className="rhine-sr-only">只读评分，不能修改。</span>}</fieldset>;
}

export interface SliderProps extends Omit<ProvidedFieldProps,'required'> { label:string; value:number; onChange:(value:number)=>void; min?:number; max?:number; step?:number }
export function Slider({ label, value, onChange, min = 0, max = 100, step = 1, disabled = false, readOnly = false, id: suppliedId, name, form, hint, error, 'aria-describedby': extra }: SliderProps) {
  const generated = useId(), id = suppliedId || generated;
  return <div className="rhine-slider"><label htmlFor={id}>{label}</label><input id={id} name={name} form={form} type="range" min={min} max={max} step={step} value={value} disabled={disabled} aria-readonly={readOnly || undefined} aria-invalid={!!error || undefined} aria-describedby={fieldDescription(id,hint,error,extra)} onPointerDown={event => { if(readOnly)event.preventDefault(); }} onKeyDown={event => { if(readOnly && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(event.key))event.preventDefault(); }} onChange={event => { if(!readOnly && !event.currentTarget.matches(':disabled'))onChange(Number(event.target.value)); }} /><span>{value}</span><FieldFeedback id={id} hint={hint} error={error} /></div>;
}

export interface TimePickerProps extends ProvidedFieldProps { label:string; value:string; onChange:(value:string)=>void; min?:string; max?:string; step?:number | 'any' }
export function TimePicker({ label, value, onChange, disabled = false, readOnly = false, id: suppliedId, name, form, required, min, max, step, hint, error, 'aria-describedby': extra }: TimePickerProps) {
  const generated = useId(), id = suppliedId || generated;
  return <div className="rhine-time"><label htmlFor={id}>{label}</label><input id={id} name={name} form={form} required={required} type="time" min={min} max={max} step={step} value={value} disabled={disabled} readOnly={readOnly} aria-invalid={!!error || undefined} aria-describedby={fieldDescription(id,hint,error,extra)} onChange={event => { if(!readOnly && !event.currentTarget.matches(':disabled'))onChange(event.target.value); }} /><FieldFeedback id={id} hint={hint} error={error} /></div>;
}

export interface ColorPickerProps extends ProvidedFieldProps { label:string; value:string; onChange:(value:string)=>void }
export function ColorPicker({ label, value, onChange, disabled = false, readOnly = false, id: suppliedId, name, form, required, hint, error, 'aria-describedby': extra }: ColorPickerProps) {
  const generated = useId(), id = suppliedId || generated;
  const valid = /^#[0-9a-fA-F]{6}$/.test(value);
  const lastValid = useRef(valid ? value : '#425c4b');
  useEffect(() => { if (valid) lastValid.current = value; }, [valid, value]);
  const message = error || (!valid ? '请使用 # 加 6 位色值。' : undefined), described = fieldDescription(id,hint,message,extra);
  return <div className="rhine-color"><label htmlFor={`${id}-picker`}>{label}</label>
    <input id={`${id}-picker`} type="color" value={valid ? value : lastValid.current} disabled={disabled || readOnly} aria-invalid={!!message || undefined} aria-describedby={described} onChange={event => { if (!readOnly && !event.currentTarget.matches(':disabled')) onChange(event.target.value); }} />
    <input id={id} name={name} form={form} required={required} pattern="#[0-9a-fA-F]{6}" type="text" aria-label={`${label}色值`} value={value} disabled={disabled} readOnly={readOnly} aria-invalid={!!message || undefined} aria-describedby={described} onChange={event => { if (!readOnly && !event.currentTarget.matches(':disabled')) onChange(event.target.value); }} />
    <FieldFeedback id={id} hint={hint} error={message} />
  </div>;
}

export interface UploadProps extends ProvidedFieldProps { label:string; files:readonly File[]; onChange:(files:File[])=>void; accept?:string; multiple?:boolean }
export function Upload({ label, files, onChange, disabled = false, readOnly = false, id: suppliedId, name, form, required, accept, multiple = true, hint, error, 'aria-describedby': extra }: UploadProps) {
  const generated = useId(), id = suppliedId || generated;
  const picker = useRef<HTMLInputElement>(null), eligibility = useRef<HTMLInputElement>(null), root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const input = picker.current, owner = input?.form;
    if(!input || !owner || !name)return;
    // The reset native picker is not a named field. Serialize the host-owned
    // File[] through the platform formdata event, never fake filename strings.
    const append = (event: Event) => {
      if(disabled || input.form !== owner || eligibility.current?.matches(':disabled'))return;
      const data = (event as FormDataEvent).formData;
      if(data)files.forEach(file => data.append(name,file,file.name));
    };
    owner.addEventListener('formdata',append);return () => owner.removeEventListener('formdata',append);
  },[files,name,form,disabled]);
  const remove = (index: number, trigger: HTMLButtonElement) => {
    if (disabled || readOnly || trigger.matches(':disabled')) return;
    const hadFocus = document.activeElement === trigger;
    onChange(files.filter((_, item) => item !== index));
    queueMicrotask(() => {
      if (!hadFocus || trigger.isConnected || !root.current?.isConnected || document.activeElement !== document.body) return;
      (picker.current?.disabled ? root.current : picker.current)?.focus({ preventScroll:true });
    });
  };
  return <div ref={root} className="rhine-upload" role="group" aria-label={`${label}操作`} tabIndex={-1} data-readonly={readOnly || undefined}><label htmlFor={id}>{label}</label><input ref={picker} id={id} form={form} type="file" accept={accept} multiple={multiple} required={!!required && files.length === 0} disabled={disabled || readOnly} aria-invalid={!!error || undefined} aria-describedby={fieldDescription(id,hint,error,[extra,readOnly&&`${id}-readonly`].filter(Boolean).join(' ')||undefined)} onChange={event => { if (readOnly || event.currentTarget.matches(':disabled')) return; onChange(multiple ? [...files, ...Array.from(event.target.files ?? [])] : Array.from(event.target.files ?? []).slice(0,1)); event.target.value = ''; }} /><input ref={eligibility} type="hidden" form={form} disabled={disabled} /><ul>{files.map((file, index) => <li key={`${file.name}-${index}`}>{file.name}<Button variant="quiet" disabled={disabled || readOnly} onClick={event => remove(index,event.currentTarget)}>移除</Button></li>)}</ul><FieldFeedback id={id} hint={hint} error={error} />{readOnly&&<span id={`${id}-readonly`} className="rhine-sr-only">只读文件列表，不能选择或移除。</span>}<p>只记录本地文件名，不会上传。</p></div>;
}

export function Avatar({ name, src }: { name: string; src?: string }) {
  return <span className="rhine-avatar" role="img" aria-label={name}>{src ? <AvatarImage key={src} name={name} src={src} /> : name.slice(0, 1)}</span>;
}
function AvatarImage({ name, src }: { name:string; src:string }) {
  const [failed, setFailed] = useState(false);
  return failed ? name.slice(0, 1) : <img src={src} alt="" onError={() => setFailed(true)} />;
}

export function Carousel({ label, items, index, onChange }: { label: string; items: readonly ReactNode[]; index: number; onChange: (index: number) => void }) {
  const current = items.length ? Math.max(0, Math.min(items.length - 1, Number.isFinite(index) ? Math.floor(index) : 0)) : 0;
  const canMove = items.length > 1;
  const move = (delta: number) => { if (canMove) onChange((current + delta + items.length) % items.length); };
  return <section className="rhine-carousel" aria-roledescription="carousel" aria-label={label} tabIndex={canMove ? 0 : undefined} onKeyDown={event => {
    if (event.defaultPrevented || event.nativeEvent.isComposing || event.keyCode === 229 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    // Slide content owns its own input/navigation keys. The carousel region and
    // its navigation buttons are the explicit carousel keyboard surface.
    if (event.target instanceof Element && event.target.closest('.rhine-carousel__slide')) return;
    if (!canMove || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation(); move(event.key === 'ArrowLeft' ? -1 : 1);
  }}><div className="rhine-carousel__slide" aria-live="polite">{items.length ? items[current] : <p>暂无内容</p>}</div><div><Button variant="secondary" disabled={!canMove} onClick={() => move(-1)}>上一张</Button><Button variant="secondary" disabled={!canMove} onClick={() => move(1)}>下一张</Button><span>{items.length ? current + 1 : 0} / {items.length}</span></div></section>;
}

export function QRCode({ label, value }: { label: string; value: string }) {
  const matrix = useMemo(() => qrMatrix(value), [value]);
  if (!matrix) return <p role="alert">{label}过长，当前只生成 78 字节以内的码。</p>;
  const size = matrix.length;
  return <figure className="rhine-qr"><svg viewBox={`-4 -4 ${size + 8} ${size + 8}`} shapeRendering="crispEdges" role="img" aria-label={`${label}：${value}`}><rect x="-4" y="-4" width={size + 8} height={size + 8} fill="#fff" />{matrix.map((row, y) => row.map((dark, x) => dark ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#000" /> : null))}</svg><figcaption>{label}</figcaption></figure>;
}

export function Tag({ children, onClose, disabled = false }: { children: ReactNode; onClose?: () => void; disabled?: boolean }) {
  const root = useRef<HTMLSpanElement>(null), recovery = useDismissFocus(root, { peerSelector: '.rhine-tag button' });
  return <span ref={root} className="rhine-tag" onFocusCapture={recovery.onFocusCapture}>{children}{onClose && <Button variant="quiet" aria-label={`移除${typeof children === 'string' ? children : '标签'}`} disabled={disabled} onClick={event => recovery.dismiss(event.currentTarget, onClose)}>移除</Button>}</span>;
}

export function Result({ status, title, description, action }: { status: 'success' | 'error' | 'info' | 'warning'; title: string; description: string; action?: ReactNode }) {
  const label = { success: '已完成', error: '失败', info: '说明', warning: '需要处理' }[status];
  return <section className="rhine-result" data-status={status}><Text variant="caption" tone="muted">{label}</Text><Text as="h2" variant="section">{title}</Text><Text>{description}</Text>{action}</section>;
}

export function Spin({ label, spinning = true }: { label: string; spinning?: boolean }) {
  return <div className="rhine-spin" role="status" data-spinning={spinning || undefined}><span className="rhine-spin__mark" aria-hidden="true">○</span><span>{spinning ? label : '已停止'}</span></div>;
}

export function Watermark({ text, children }: { text: string; children: ReactNode }) {
  return <div className="rhine-watermark">{children}<div className="rhine-watermark__mark" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <span key={index}>{text}</span>)}</div></div>;
}

export function Affix({ children, offset = 0 }: { children: ReactNode; offset?: number }) {
  return <div className="rhine-affix" style={{ top: offset }}>{children}</div>;
}

export function App({ label, children, containerRef }: { label: string; children: ReactNode; containerRef?: RefObject<HTMLDivElement | null> }) {
  return <div className="rhine-app" role="region" aria-label={label} ref={containerRef}>{children}</div>;
}

export function BorderBeam({ label, children }: { label: string; children: ReactNode }) {
  return <div className="rhine-border-beam"><span className="rhine-sr-only">{label}只是装饰，不表示进度。</span>{children}</div>;
}
