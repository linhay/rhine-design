import { useId, useLayoutEffect, useReducer, useRef, type ReactNode } from 'react';
import { Badge, Button, type Choice } from './components';
import { Select } from './Select';
import './mapping-editor.css';

export interface MappingEditorRow {
  /** Stable host identity; never use the current array index. */
  id: string;
  source: string;
  target: string;
  error?: string;
  disabled?: boolean;
  readOnly?: boolean;
  /** Per-row options may disable sources already used elsewhere. */
  sourceOptions?: readonly Choice[];
  targetOptions?: readonly Choice[];
}
export interface MappingEditorProps {
  label: string;
  rows: readonly MappingEditorRow[];
  sourceOptions: readonly Choice[];
  targetOptions: readonly Choice[];
  onRowChange: (id: string, values: {source: string; target: string}) => void;
  onRemove?: (id: string) => void;
  /** Synchronously append a controlled row and return its new id to focus it. Return undefined to cancel. */
  onAdd?: () => string | undefined;
  sourceLabel?: string;
  targetLabel?: string;
  sourcePlaceholder?: string;
  targetPlaceholder?: string;
  addLabel?: string;
  removeLabel?: string;
  rowLabel?: (index: number) => string;
  emptyContent?: ReactNode;
  disabled?: boolean;
  readOnly?: boolean;
  /** Compact rows retain a horizontal layout down to 360 CSS px of actual editor width. */
  density?: 'default' | 'compact';
  /** Group by target only when the entire editor is read-only; never changes rows. */
  readOnlyLayout?: 'rows' | 'grouped';
  /** Only affects read-only grouped presentation. */
  groupedSourceLayout?: 'branches' | 'tags';
  className?: string;
}

/** A controlled presentation/editor. Relations, validation and persistence belong to the host. */
export function MappingEditor({label, rows, sourceOptions, targetOptions, onRowChange, onRemove, onAdd,
  sourceLabel='来源', targetLabel='目标', sourcePlaceholder='选择来源', targetPlaceholder='选择目标',
  addLabel='添加规则', removeLabel='删除', rowLabel=index=>`第${index+1}行`, emptyContent='暂无规则',
  disabled=false, readOnly=false, density='default', readOnlyLayout='rows', groupedSourceLayout='branches', className=''}: MappingEditorProps) {
  const id=useId(), root=useRef<HTMLDivElement>(null);
  const nodes=useRef(new Map<string, HTMLLIElement>());
  // Ensure a post-callback commit even when onAdd already flushed or rejected its update.
  const [,commitFocus]=useReducer((revision:number)=>revision+1,0);
  const pending=useRef<{kind:'add'|'remove'; id:string; index:number; trigger:HTMLElement} | null>(null);
  useLayoutEffect(()=>{
    const action=pending.current; pending.current=null;
    if(!action || disabled || readOnly) return;
    // Do not steal focus when the host rejected an action or moved focus elsewhere.
    const active=document.activeElement;
    if(active!==action.trigger && (action.trigger.isConnected || (active && active!==document.body && active!==document.documentElement))) return;
    if(action.kind==='add' && !rows.some(row=>row.id===action.id)) return;
    if(action.kind==='remove' && rows.some(row=>row.id===action.id)) return;
    const candidates=action.kind==='add' ? rows.filter(row=>row.id===action.id) : [...rows.slice(action.index),...rows.slice(0,action.index).reverse()];
    for(const row of candidates) {
      const select=nodes.current.get(row.id)?.querySelector<HTMLSelectElement>('select:not(:disabled)');
      if(select) {select.focus();return;}
    }
    (root.current?.querySelector<HTMLButtonElement>('[data-mapping-add]:not(:disabled)') || root.current)?.focus();
  });
  useLayoutEffect(()=>{
    if(!root.current) return;
    if(density!=='compact' || readOnly) {root.current.querySelectorAll('.rhine-mapping-editor__fields--long').forEach(node=>node.classList.remove('rhine-mapping-editor__fields--long'));return;}
    const editor=root.current;
    const reflow=()=>{
      for(const row of nodes.current.values()) {
        const fields=row.querySelector<HTMLElement>('.rhine-mapping-editor__fields');
        if(!fields) continue;
        const measures=[...fields.querySelectorAll<HTMLElement>('.rhine-mapping-editor__measure>span')];
        const selects=[...fields.querySelectorAll<HTMLSelectElement>('select')];
        if(measures.length!==2 || selects.length!==2) {fields.classList.remove('rhine-mapping-editor__fields--long');continue;}
        const needed=measures.map((measure,index)=>{
          const style=getComputedStyle(selects[index]);
          measure.style.font=style.font;measure.style.letterSpacing=style.letterSpacing;
          return Math.max(44,measure.offsetWidth+parseFloat(style.paddingLeft)+parseFloat(style.paddingRight)+parseFloat(style.borderLeftWidth)+parseFloat(style.borderRightWidth));
        });
        const action=fields.querySelector<HTMLButtonElement>('button');
        const gap=parseFloat(getComputedStyle(editor).getPropertyValue('--rhine-space-2')) || 8;
        // Equal columns keep arrows aligned; the wider current value sets both minima.
        const required=Math.max(...needed)*2+20+(action?.offsetWidth || 0)+gap*(action?3:2);
        fields.classList.toggle('rhine-mapping-editor__fields--long',required>editor.clientWidth);
      }
    };
    reflow();
    if(typeof ResizeObserver==='undefined') return;
    const observer=new ResizeObserver(reflow);observer.observe(editor);
    editor.querySelectorAll('.rhine-mapping-editor__measure>span').forEach(node=>observer.observe(node));
    const theme=editor.closest('.rhine-theme'),themeObserver=new MutationObserver(reflow);
    if(theme)themeObserver.observe(theme,{attributes:true,attributeFilter:['class','style','data-rhine-theme']});
    document.fonts?.addEventListener('loadingdone',reflow);
    return ()=>{observer.disconnect();themeObserver.disconnect();document.fonts?.removeEventListener('loadingdone',reflow);};
  },[density,readOnly,rows,sourceOptions,targetOptions,Boolean(onRemove)]);
  const options=(items:readonly Choice[], value:string, placeholder:string)=> <>
    <option value="">{placeholder}</option>
    {value && !items.some(item=>item.value===value) && <option value={value} disabled>{value}（不可用）</option>}
    {items.map(item=><option key={item.value} value={item.value} disabled={item.disabled}>{item.label}</option>)}
  </>;
  const groups=new Map<string, MappingEditorRow[]>();
  if(readOnly && readOnlyLayout==='grouped') for(const row of rows) {
    const group=groups.get(row.target);
    if(group) group.push(row);else groups.set(row.target,[row]);
  }
  const display=(items:readonly Choice[], value:string, placeholder:string)=>items.find(item=>item.value===value)?.label || (value ? `${value}（不可用）` : placeholder);
  return <div ref={root} role="group" aria-label={label} tabIndex={-1} className={`rhine-mapping-editor${density==='compact' ? ' rhine-mapping-editor--compact' : ''} ${className}`}>
    {rows.length===0 ? <div className="rhine-mapping-editor__empty">{emptyContent}</div> : readOnly && readOnlyLayout==='grouped' ? <ul className="rhine-mapping-editor__groups">
      {[...groups].map(([target,group])=><li key={target} className={`rhine-mapping-editor__group${groupedSourceLayout==='tags' ? ' rhine-mapping-editor__group--tags' : ''}`}>
        <ul aria-label={sourceLabel} className="rhine-mapping-editor__sources">{group.map(row=><li key={row.id}>
          <span className="rhine-mapping-editor__value">{groupedSourceLayout==='tags' ? <Badge>{display(row.sourceOptions || sourceOptions,row.source,sourcePlaceholder)}</Badge> : display(row.sourceOptions || sourceOptions,row.source,sourcePlaceholder)}{row.error && <span className="rhine-field__error" role="alert">{row.error}</span>}</span>
          {groupedSourceLayout==='branches' && <span className="rhine-mapping-editor__branch" aria-hidden="true" />}
        </li>)}</ul>
        {groupedSourceLayout==='tags' ? <span className="rhine-mapping-editor__arrow" aria-hidden="true">→</span> : <span className="rhine-mapping-editor__join" aria-hidden="true" />}
        <div className="rhine-mapping-editor__value rhine-mapping-editor__target"><span className="rhine-sr-only">{targetLabel}：</span>{display(group[0].targetOptions || targetOptions,target,targetPlaceholder)}</div>
      </li>)}
    </ul> : <ol className="rhine-mapping-editor__list">
      {rows.map((row,index)=>{
        const prefix=rowLabel(index), source=row.sourceOptions || sourceOptions, target=row.targetOptions || targetOptions;
        const locked=disabled || row.disabled, viewing=readOnly || row.readOnly, errorId=`${id}-${encodeURIComponent(row.id)}-error`;
        return <li key={row.id} ref={element=>{if(element) nodes.current.set(row.id,element);else nodes.current.delete(row.id);}} className="rhine-mapping-editor__row" aria-label={prefix}>
          <div className="rhine-mapping-editor__fields">
            {density==='compact' && !viewing && <><span className="rhine-mapping-editor__measure" aria-hidden="true"><span>{display(source,row.source,sourcePlaceholder)}</span></span><span className="rhine-mapping-editor__measure" aria-hidden="true"><span>{display(target,row.target,targetPlaceholder)}</span></span></>}

            {viewing ? <><div className="rhine-mapping-editor__value"><span className="rhine-sr-only">{prefix} {sourceLabel}：</span>{source.find(item=>item.value===row.source)?.label || (row.source ? `${row.source}（不可用）` : sourcePlaceholder)}</div><span className="rhine-mapping-editor__arrow" aria-hidden="true">→</span><div className="rhine-mapping-editor__value"><span className="rhine-sr-only">{prefix} {targetLabel}：</span>{target.find(item=>item.value===row.target)?.label || (row.target ? `${row.target}（不可用）` : targetPlaceholder)}</div></> : <>
              <Select className="rhine-mapping-editor__field" label={`${prefix} ${sourceLabel}`} value={row.source} disabled={locked} aria-invalid={Boolean(row.error) || undefined} aria-describedby={row.error ? errorId : undefined} onChange={e=>{if(!locked) onRowChange(row.id,{source:e.target.value,target:row.target});}}>{options(source,row.source,sourcePlaceholder)}</Select>
              <span className="rhine-mapping-editor__arrow" aria-hidden="true">→</span>
              <Select className="rhine-mapping-editor__field" label={`${prefix} ${targetLabel}`} value={row.target} disabled={locked} aria-invalid={Boolean(row.error) || undefined} aria-describedby={row.error ? errorId : undefined} onChange={e=>{if(!locked) onRowChange(row.id,{source:row.source,target:e.target.value});}}>{options(target,row.target,targetPlaceholder)}</Select>
            </>}
            {!viewing && onRemove && <Button variant="quiet" disabled={locked} aria-label={`${removeLabel}${prefix}`} onClick={e=>{pending.current={kind:'remove',id:row.id,index,trigger:e.currentTarget};onRemove(row.id);}}>{removeLabel}</Button>}
          </div>
          {row.error && <p id={errorId} className="rhine-field__error" role="alert">{row.error}</p>}
        </li>;
      })}
    </ol>}
    {!readOnly && onAdd && <Button data-mapping-add variant="secondary" disabled={disabled} onClick={e=>{const newId=onAdd();if(newId!==undefined) {pending.current={kind:'add',id:newId,index:rows.length,trigger:e.currentTarget};commitFocus();}}}>{addLabel}</Button>}
  </div>;
}
