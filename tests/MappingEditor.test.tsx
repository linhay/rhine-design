import { fireEvent, render, screen, within } from '@testing-library/react';
import { flushSync } from 'react-dom';
import { useRef, useState } from 'react';
import { expect, it, vi } from 'vitest';
import { MappingEditor, type MappingEditorRow } from '../components';
const choices=[{value:'a',label:'来源甲'},{value:'b',label:'来源乙',disabled:true}];
const initial=[{id:'a',source:'a',target:'a'},{id:'b',source:'b',target:'a'},{id:'c',source:'a',target:''}];
function Harness({start=initial}:{start?:MappingEditorRow[]}) {
  const [rows,setRows]=useState(start), id=useRef(0);
  return <MappingEditor label="映射" rows={rows} sourceOptions={choices} targetOptions={choices}
    onRowChange={(id,values)=>setRows(current=>current.map(row=>row.id===id?{...row,...values}:row))}
    onRemove={id=>setRows(current=>current.filter(row=>row.id!==id))}
    onAdd={()=>{const newId=`new-${id.current++}`;setRows(current=>[...current,{id:newId,source:'',target:''}]);return newId;}} />;
}
it('uses stable identities for callbacks and native disabled options, with row and direction names',()=>{
 const change=vi.fn();render(<MappingEditor label="关系" rows={[initial[2]]} sourceOptions={choices} targetOptions={[]} onRowChange={change} />);
 const source=screen.getByRole('combobox',{name:'第1行 来源'}),target=screen.getByRole('combobox',{name:'第1行 目标'});
 expect(within(source).getByRole('option',{name:'来源乙'})).toBeDisabled();
 expect(target).toHaveValue('');expect(within(target).getByRole('option',{name:'选择目标'})).toBeVisible();
 fireEvent.change(source,{target:{value:''}});expect(change).toHaveBeenCalledWith('c',{source:'',target:''});
 expect(screen.getByText('→')).toHaveAttribute('aria-hidden','true');
});
it('adds to an empty list and focuses the acknowledged new source',()=>{
 render(<Harness start={[]} />);const add=screen.getByRole('button',{name:'添加规则'});add.focus();fireEvent.click(add);
 expect(screen.getByRole('combobox',{name:'第1行 来源'})).toHaveFocus();
});
it('retains a following row DOM/value when deleting the middle, then focuses previous or add',()=>{
 render(<Harness />);const last=screen.getByRole('combobox',{name:'第3行 目标'});
 fireEvent.change(last,{target:{value:'a'}});
 const remove=screen.getByRole('button',{name:'删除第2行'});remove.focus();fireEvent.click(remove);
 expect(screen.getByRole('combobox',{name:'第2行 目标'})).toBe(last);expect(last).toHaveValue('a');
 expect(screen.getByRole('combobox',{name:'第2行 来源'})).toHaveFocus();
 fireEvent.click(screen.getByRole('button',{name:'删除第2行'}));expect(screen.getByRole('combobox',{name:'第1行 来源'})).toHaveFocus();
 fireEvent.click(screen.getByRole('button',{name:'删除第1行'}));expect(screen.getByRole('button',{name:'添加规则'})).toHaveFocus();
});
it('keeps row errors associated and presents read-only values without mutation controls',()=>{
 render(<MappingEditor label="只读" rows={[{...initial[0],error:'重复来源'}]} sourceOptions={choices} targetOptions={choices} onRowChange={vi.fn()} onAdd={vi.fn()} onRemove={vi.fn()} readOnly />);
 expect(screen.queryByRole('combobox')).toBeNull();expect(screen.queryByRole('button')).toBeNull();expect(screen.getByRole('alert')).toHaveTextContent('重复来源');expect(screen.getByRole('listitem')).toHaveTextContent('第1行 来源');
});
it('disables both selects and all mutations while saving',()=>{
 const change=vi.fn(),remove=vi.fn(),add=vi.fn();render(<MappingEditor label="保存中" rows={[{...initial[0],error:'行错误'}]} sourceOptions={choices} targetOptions={choices} onRowChange={change} onAdd={add} onRemove={remove} disabled />);
 for(const select of screen.getAllByRole('combobox')) {expect(select).toBeDisabled();expect(select).toHaveAttribute('aria-invalid','true');expect(document.getElementById(select.getAttribute('aria-describedby')!)).toHaveTextContent('行错误');fireEvent.change(select,{target:{value:'b'}});}
 for(const button of screen.getAllByRole('button')) {expect(button).toBeDisabled();fireEvent.click(button);}
 expect(change).not.toHaveBeenCalled();expect(remove).not.toHaveBeenCalled();expect(add).not.toHaveBeenCalled();
});
it('skips locked rows after deletion, preserving row-specific option policy',()=>{
 render(<Harness start={[initial[0],{...initial[1],disabled:true},{...initial[2],readOnly:true}]} />);
 const remove=screen.getByRole('button',{name:'删除第1行'});remove.focus();fireEvent.click(remove);expect(screen.getByRole('button',{name:'添加规则'})).toHaveFocus();
});
it('does not move focus after cancelled add or rejected remove',()=>{
 const props={label:'受控',rows:initial,sourceOptions:choices,targetOptions:choices,onRowChange:vi.fn(),onAdd:()=>undefined,onRemove:vi.fn()};
 const {rerender}=render(<MappingEditor {...props} />);const add=screen.getByRole('button',{name:'添加规则'});add.focus();fireEvent.click(add);rerender(<MappingEditor {...props} />);expect(add).toHaveFocus();
 const remove=screen.getByRole('button',{name:'删除第2行'});remove.focus();fireEvent.click(remove);rerender(<MappingEditor {...props} />);expect(remove).toHaveFocus();
});
it('shows removed catalog values explicitly rather than silently selecting another option',()=>{
 render(<MappingEditor label="缺失选项" rows={[{id:'stable',source:'missing',target:''}]} sourceOptions={[]} targetOptions={[]} onRowChange={vi.fn()} />);
 expect(screen.getByRole('combobox',{name:'第1行 来源'})).toHaveValue('missing');expect(screen.getByRole('option',{name:'missing（不可用）'})).toBeDisabled();
});
it('respects a host focus handoff when the removed trigger disconnects',()=>{
 function Host() {
  const [rows,setRows]=useState(initial),outside=useRef<HTMLInputElement>(null);
  return <><input ref={outside} aria-label="宿主确认字段" /><MappingEditor label="映射" rows={rows} sourceOptions={choices} targetOptions={choices} onRowChange={()=>{}} onRemove={id=>{setRows(current=>current.filter(row=>row.id!==id));outside.current?.focus();}} /></>;
 }
 render(<Host />);const remove=screen.getByRole('button',{name:'删除第2行'});remove.focus();fireEvent.click(remove);
 expect(screen.getByRole('textbox',{name:'宿主确认字段'})).toHaveFocus();expect(remove).not.toBeInTheDocument();
});

it.each(['batch','flush'] as const)('focuses an added row after %s updates and respects explicit host handoff',mode=>{
 function Host() {
  const [rows,setRows]=useState<MappingEditorRow[]>([]),outside=useRef<HTMLInputElement>(null),id=useRef(0);
  return <><input ref={outside} aria-label="宿主添加确认" /><MappingEditor label="映射" rows={rows} sourceOptions={choices} targetOptions={choices} onRowChange={()=>{}} onAdd={()=>{
   const newId=`added-${id.current++}`,append=()=>setRows(current=>[...current,{id:newId,source:'',target:''}]);
   if(mode==='flush') flushSync(append);else append();
   if(id.current===2) outside.current?.focus();
   return newId;
  }} /></>;
 }
 render(<Host />);const add=screen.getByRole('button',{name:'添加规则'});add.focus();fireEvent.click(add);
 expect(screen.getByRole('combobox',{name:'第1行 来源'})).toHaveFocus();
 add.focus();fireEvent.click(add);expect(screen.getByRole('textbox',{name:'宿主添加确认'})).toHaveFocus();
 expect(screen.getAllByRole('combobox')).toHaveLength(4);
});
it('clears rejected add intent before an unrelated later row with the returned id arrives',()=>{
 const props={label:'映射',rows:[],sourceOptions:choices,targetOptions:choices,onRowChange:vi.fn(),onAdd:()=> 'rejected'};
 const {rerender}=render(<MappingEditor {...props} />);const add=screen.getByRole('button',{name:'添加规则'});add.focus();fireEvent.click(add);expect(add).toHaveFocus();
 rerender(<MappingEditor {...props} rows={[{id:'rejected',source:'',target:''}]} />);expect(add).toHaveFocus();
});
it('does not focus an added row if a synchronous host update locks the editor',()=>{
 function Host(){const [rows,setRows]=useState<MappingEditorRow[]>([]),[locked,setLocked]=useState(false);return <MappingEditor label="映射" rows={rows} sourceOptions={choices} targetOptions={choices} disabled={locked} onRowChange={()=>{}} onAdd={()=>{flushSync(()=>{setRows([{id:'locked',source:'',target:''}]);setLocked(true);});return 'locked';}} />;}
 render(<Host />);const add=screen.getByRole('button',{name:'添加规则'});add.focus();fireEvent.click(add);expect(screen.getByRole('combobox',{name:'第1行 来源'})).not.toHaveFocus();expect(add).toBeDisabled();
});
it('groups only read-only presentation by first target occurrence, preserving sources, same-value rows and input order',()=>{
 const rows=[{id:'1',source:'b',target:'a'},{id:'2',source:'a',target:'b'},{id:'3',source:'a',target:'a',error:'保留行错误'},{id:'4',source:'b',target:'a'}];
 const before=JSON.stringify(rows),change=vi.fn();const props={label:'汇合',rows,sourceOptions:choices,targetOptions:choices,onRowChange:change,readOnlyLayout:'grouped' as const};
 const {container,rerender}=render(<MappingEditor {...props} readOnly density="compact"/>);
 const targets=[...container.querySelectorAll('.rhine-mapping-editor__target')];expect(targets.map(n=>n.textContent)).toEqual(['目标：来源甲','目标：来源乙']);
 const lists=screen.getAllByRole('list',{name:'来源'});expect(within(lists[0]).getAllByRole('listitem').map(n=>n.textContent)).toEqual(['来源乙','来源甲保留行错误','来源乙']);expect(within(lists[1]).getByRole('listitem')).toHaveTextContent('来源甲');
 expect(screen.queryByRole('combobox')).toBeNull();expect(screen.queryByRole('button')).toBeNull();expect(screen.getByRole('alert')).toHaveTextContent('保留行错误');
 for(const line of container.querySelectorAll('.rhine-mapping-editor__branch,.rhine-mapping-editor__join'))expect(line).toHaveAttribute('aria-hidden','true');
 expect(JSON.stringify(rows)).toBe(before);expect(change).not.toHaveBeenCalled();
 rerender(<MappingEditor {...props}/>);expect(screen.getAllByRole('combobox')).toHaveLength(8);expect(container.querySelector('.rhine-mapping-editor__groups')).toBeNull();
});
it('keeps custom empty content and unavailable values in grouped preview',()=>{
 const props={label:'汇合',sourceOptions:[],targetOptions:[],onRowChange:vi.fn(),readOnly:true,readOnlyLayout:'grouped' as const};
 const {rerender}=render(<MappingEditor {...props} rows={[]} emptyContent="尚无映射"/>);expect(screen.getByText('尚无映射')).toBeVisible();
 rerender(<MappingEditor {...props} rows={[{id:'x',source:'removed',target:''}]}/>);expect(screen.getByText('removed（不可用）')).toBeVisible();expect(screen.getByText('选择目标')).toBeVisible();
});
