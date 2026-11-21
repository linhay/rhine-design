import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import * as PopoverBase from '@radix-ui/react-popover';
import { Button } from './components';
import { Popover } from './Overlays';
import { useLayerScope } from './layer';
import { useFloatingScale } from './useFloatingScale';
import { FieldFeedback, exceedsTextLimit, fieldDescription, type ProvidedFieldProps } from './field-support';
import { DataFeedback } from './data-feedback';

export interface CascadeOption { value: string; label: string; disabled?: boolean; children?: readonly CascadeOption[]; isLeaf?:boolean; loading?:boolean; loadError?:string }
function pathLabels(options: readonly CascadeOption[], path: readonly string[]) {
  const labels: string[] = [];
  for (const key of path) { const option = options.find(item => item.value === key); if (!option) break; labels.push(option.label); options = option.children ?? []; }
  return labels;
}
export interface CascaderProps extends Omit<ProvidedFieldProps,'required'> {
  label:string; options:readonly CascadeOption[]; value:readonly string[]; onChange:(value:string[])=>void;
  loading?:boolean; loadError?:string; emptyText?:string;
  onExpand?:(path:readonly string[])=>void; onRetry?:(path:readonly string[])=>void;
}
export function Cascader({ label, options, value, onChange, disabled = false, readOnly = false, id: suppliedId, name, form, hint, error, loading = false, loadError, emptyText, onExpand, onRetry, 'aria-describedby': extra }: CascaderProps) {
  const generated=useId(),id=suppliedId||generated;
  const [open, setOpen] = useState(false), [path, setPath] = useState<string[]>([]);
  const panel = useRef<HTMLDivElement>(null), focusNext = useRef(false), hadPanelFocus = useRef(false);
  const validPath:string[]=[];
  let level=options,parent:CascadeOption|undefined;
  for(const key of path){const option=level.find(item=>item.value===key);if(!option || (!option.children?.length && option.isLeaf!==false))break;validPath.push(key);parent=option;level=option.children??[];}
  const busy=loading||!!parent?.loading, readError=loadError||parent?.loadError;
  const changed=path.length!==validPath.length || path.some((key,index)=>key!==validPath[index]);
  const inSelectedBranch = validPath.every((key, index) => key === value[index]);
  const labels=pathLabels(options,value),missing=!loading&&!loadError&&value.length>0&&labels.length!==value.length;
  useEffect(() => { if(disabled || readOnly || document.getElementById(id)?.matches(':disabled'))setOpen(false); });
  useLayoutEffect(() => {
    if(changed){setPath(validPath);if(hadPanelFocus.current)focusNext.current=true;}
    if(focusNext.current){(panel.current?.querySelector<HTMLElement>('[role=option]:not(:disabled)')??panel.current)?.focus();focusNext.current=false;}
  });
  const choose=(option:CascadeOption)=>{
    if(disabled||readOnly||busy||readError||option.disabled||document.getElementById(id)?.matches(':disabled'))return;
    const next=[...validPath,option.value];
    if(option.children?.length || option.isLeaf===false){focusNext.current=true;setPath(next);onExpand?.(next);}
    else{onChange(next);setOpen(false);}
  };
  const described=fieldDescription(id,hint,error,[extra,missing&&`${id}-missing`,readOnly&&`${id}-readonly`].filter(Boolean).join(' ')||undefined);
  return <div className="rhine-selection-field">
    {name&&value.map((key,index)=><input key={`${index}-${key}`} type="hidden" name={name} form={form} value={key} disabled={disabled}/>)}
    <Popover title={label} showHeader={false} trigger={<Button id={id} aria-describedby={described} aria-invalid={!!error||undefined} aria-disabled={readOnly||undefined} disabled={disabled}>{label}：{labels.join(' / ') || '未选择'}</Button>} open={open&&!disabled&&!readOnly} onOpenChange={next=>{setOpen(next);if(next)setPath([]);}}>
      <div ref={panel} id={`${id}-panel`} className="rhine-cascader" role="group" aria-label={`${label}候选`} aria-busy={busy||undefined} tabIndex={-1} onFocusCapture={()=>{hadPanelFocus.current=true;}} onBlurCapture={event=>{if(event.relatedTarget&&!event.currentTarget.contains(event.relatedTarget))hadPanelFocus.current=false;}}>
        {!!validPath.length&&<Button variant="quiet" onClick={()=>{focusNext.current=true;setPath(validPath.slice(0,-1));}}>返回上一级</Button>}
        <p aria-live="polite">{pathLabels(options,validPath).join(' / ') || '选择一级'}</p>
        <div role="listbox" aria-label={label} aria-busy={busy||undefined} onKeyDown={event=>{
          if(!['ArrowUp','ArrowDown','Home','End','ArrowLeft','ArrowRight'].includes(event.key))return;
          event.preventDefault();event.stopPropagation();
          if(event.key==='ArrowLeft'){if(validPath.length){focusNext.current=true;setPath(validPath.slice(0,-1));}return;}
          const buttons=[...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role=option]:not(:disabled)')];
          if(event.key==='ArrowRight'){(document.activeElement as HTMLButtonElement)?.click?.();return;}
          const index=buttons.indexOf(document.activeElement as HTMLButtonElement),next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[next]?.focus();
        }}>{level.map(option=><button type="button" className="rhine-button rhine-button--quiet" role="option" aria-selected={inSelectedBranch && value[validPath.length] === option.value} disabled={option.disabled||busy||!!readError} key={option.value} onClick={()=>choose(option)}>{option.label}{(!!option.children?.length||option.isLeaf===false)&&<span aria-hidden="true"> ›</span>}</button>)}</div>
        <DataFeedback id={`${id}-data`} loading={busy} loadError={readError} empty={!level.length} emptyText={parent?.isLeaf===false&&parent.children===undefined?'尚未提供下级选项':emptyText||'暂无选项'} disabled={disabled} focusId={`${id}-panel`} onRetry={onRetry?()=>onRetry(validPath):undefined}/>
      </div>
    </Popover>
    <FieldFeedback id={id} hint={hint} error={error}/>
    {readOnly&&<span id={`${id}-readonly`} className="rhine-sr-only">只读，不能更改路径。</span>}
    {missing&&<p id={`${id}-missing`} role="status">选中路径暂不可用，原值仍由宿主持有。</p>}
  </div>;
}

export interface MentionsProps extends ProvidedFieldProps { label:string; value:string; onChange:(value:string)=>void; options:readonly string[]; rows?:number; minLength?:number; maxLength?:number; placeholder?:string }
export function Mentions({ label, value, onChange, options, disabled = false, readOnly = false, id: suppliedId, name, form, required, hint, error, rows, minLength, maxLength, placeholder, 'aria-describedby': extra }: MentionsProps) {
  const generated = useId(), id = suppliedId || generated, input = useRef<HTMLTextAreaElement>(null), composing = useRef(false);
  const { ref, container, density } = useLayerScope();
  const floating = useFloatingScale(undefined, 'popover', 240);
  const [open, setOpen] = useState(false), [caret, setCaret] = useState(value.length), [active, setActive] = useState<string | null>(null);
  const [insertNotice, setInsertNotice] = useState('');
  const pendingSelection = useRef<{ value:string; position:number } | null>(null);
  useLayoutEffect(() => {
    const action = pendingSelection.current; pendingSelection.current = null;
    if (action && input.current?.value === action.value && document.activeElement === input.current) input.current.setSelectionRange(action.position, action.position);
  });
  useEffect(() => { if (disabled || readOnly) { setOpen(false); setActive(null); composing.current=false; } }, [disabled,readOnly]);
  const prefix = value.slice(0, caret), match = prefix.match(/(?:^|\s)@([^\s@]*)$/);
  const matches = open && !disabled && !readOnly && match ? [...new Set(options)].filter(option => option.includes(match[1])) : [];
  const visible = matches.length > 0, current = active === null ? -1 : matches.indexOf(active);
  useLayoutEffect(() => { if (active !== null && current < 0) setActive(null); }, [active, current]);
  const choose = (option: string) => {
    if(disabled||readOnly||input.current?.matches(':disabled'))return;
    const text = prefix.replace(/@([^\s@]*)$/, `@${option} `), next = text + value.slice(caret);
    if (exceedsTextLimit(next, maxLength)) { setInsertNotice('此候选会超过字数上限，未插入。'); return; }
    setInsertNotice('');
    pendingSelection.current = { value:next, position:text.length };
    onChange(next); setCaret(text.length); setActive(null); setOpen(false);
  };
  return <span className="rhine-mentions rhine-field" ref={ref}><label htmlFor={id}>{label}</label><PopoverBase.Root open={visible} onOpenChange={setOpen}><PopoverBase.Anchor asChild><textarea ref={input} id={id} name={name} form={form} required={required} readOnly={readOnly} rows={rows} minLength={minLength} maxLength={maxLength} placeholder={placeholder} aria-invalid={!!error||undefined} aria-describedby={fieldDescription(id,hint,error,[extra,insertNotice && id+'-insert'].filter(Boolean).join(' '))} role="combobox" aria-multiline="true" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded={visible} aria-controls={visible ? `${id}-list` : undefined} aria-activedescendant={current >= 0 ? `${id}-option-${current}` : undefined} value={value} disabled={disabled}
    onFocus={() => { if(!readOnly&&!disabled)setOpen(true); }} onClick={event => { setCaret(event.currentTarget.selectionStart); if(!readOnly&&!disabled)setOpen(true); }} onSelect={event => setCaret(event.currentTarget.selectionStart)}
    onChange={event => { if(readOnly||event.currentTarget.matches(':disabled'))return; onChange(event.target.value); setCaret(event.target.selectionStart); setOpen(true); setActive(null); setInsertNotice(''); }}
    onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }}
    onKeyDown={event => {
      if (disabled || readOnly || event.currentTarget.matches(':disabled') || composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
      if (event.key === 'Tab') { setOpen(false); setActive(null); }
      if (event.key === 'Escape' && visible) { event.preventDefault(); event.stopPropagation(); setOpen(false); setActive(null); }
      if (visible && ['ArrowUp', 'ArrowDown'].includes(event.key)) { event.preventDefault(); setActive(matches[current < 0 ? (event.key === 'ArrowDown' ? 0 : matches.length - 1) : (current + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length]); }
      if (visible && event.key === 'Enter' && current >= 0) { event.preventDefault(); choose(matches[current]); }
    }} /></PopoverBase.Anchor><PopoverBase.Portal container={container}><PopoverBase.Content asChild sideOffset={4} collisionPadding={12} onOpenAutoFocus={event => event.preventDefault()} onCloseAutoFocus={event => event.preventDefault()} onInteractOutside={event => { if (event.target === input.current) event.preventDefault(); }} onEscapeKeyDown={event => { event.preventDefault(); setOpen(false); setActive(null); }}><div ref={floating} className="rhine-combobox__list" data-rhine-density={density}><div role="listbox" aria-label="提及候选" id={`${id}-list`}>{matches.map((option, index) => <div role="option" aria-selected={current === index} data-active={current === index} id={`${id}-option-${index}`} key={option} onMouseDown={event => event.preventDefault()} onClick={() => choose(option)}>{option}</div>)}</div></div></PopoverBase.Content></PopoverBase.Portal></PopoverBase.Root><FieldFeedback id={id} hint={hint} error={error}/>{insertNotice&&<span id={id+'-insert'} className="rhine-field__hint" role="status">{insertNotice}</span>}</span>;
}

export { Tour } from './Tour';
