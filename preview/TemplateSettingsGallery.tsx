import { useEffect, useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import './template-settings.css';
import { Button, Checkbox, Dialog, EmptyState, MappingEditor, Notice, RemoteMultiSelect, Select, SideNav, Stack, Switch, Text, TextField, type MappingEditorRow } from '../components';
import { ThemeProvider, type ThemeName } from '../components/theme';

type Rule = Pick<MappingEditorRow,'id'|'source'|'target'>;
type Template = {id:string; name:string; version:number; rows:Rule[]};
type Draft = Pick<Template,'name'|'rows'>;
type Target = {id:string; name:string; enabled:boolean; editable:boolean; rows:Rule[]};
type Intent = 'keep'|'on'|'off';
const catalogOptions = Array.from({length:8},(_,i)=>({value:`option-${i+1}`,label:i===7 ? '合成选项八 · 用于验证超长名称不会挤出编辑边界的展示文本' : `合成选项 ${i+1}`}));
const keyboardOptions=[{value:'option-1',label:'Alpha · 合成选项一'},{value:'option-2',label:'Beta · 合成选项二'},{value:'option-3',label:'Gamma · 合成选项三'}];
const initialTemplates:Template[]=[{id:'basic',name:'基础模板',version:1,rows:[{id:'initial-rule',source:'option-1',target:'option-2'}]},{id:'empty',name:'空模板',version:1,rows:[]}];
const initialTargets:Target[]=[{id:'a',name:'合成对象甲',enabled:true,editable:true,rows:[]},{id:'b',name:'合成对象乙',enabled:false,editable:true,rows:initialTemplates[0].rows},{id:'c',name:'合成对象丙',enabled:true,editable:false,rows:[]}];
const equalRules=(a:Rule[],b:Rule[])=>JSON.stringify(a.map(({source,target})=>({source,target})))===JSON.stringify(b.map(({source,target})=>({source,target})));

export function TemplateSettingsGallery({keyboardLabels=false}:{keyboardLabels?:boolean}={}) {
  const options=keyboardLabels ? catalogOptions.map((option,index)=>({...option,label:`${['Alpha','Beta','Gamma','Delta','Echo','Foxtrot','Hotel','India'][index]} · ${option.label}`})) : catalogOptions;
  const [open,setOpen]=useState(false),[section,setSection]=useState('apply');
  const [templates,setTemplates]=useState(initialTemplates),[targets,setTargets]=useState(initialTargets);
  const [drafts,setDrafts]=useState<Record<string,Draft>>(()=>Object.fromEntries(initialTemplates.map(t=>[t.id,{name:t.name,rows:t.rows}])));
  const [editing,setEditing]=useState('basic'),[selected,setSelected]=useState<{id:string;version:number}|null>(null);
  const [context,setContext]=useState<'single'|'batch'>('batch');
  const [query,setQuery]=useState(''),[targetPage,setTargetPage]=useState(1);
  const opener=useRef<HTMLButtonElement|null>(null);
  const [targetIds,setTargetIds]=useState<string[]>([]),[intent,setIntent]=useState<Intent>('keep');
  const [message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [failure,setFailure]=useState(false),[mode,setMode]=useState('edit');
  const [plan,setPlan]=useState<{template:Template|null;intent:Intent;targets:Target[]}|null>(null);
  const selectedRef=useRef(selected);selectedRef.current=selected;
  const handoffId=useId();
  const [handoffRows,setHandoffRows]=useState<Rule[]>([{id:'handoff-a',source:'option-1',target:'option-2'},{id:'handoff-b',source:'option-2',target:'option-3'}]);
  const [addMode,setAddMode]=useState('batch');
  const [addRows,setAddRows]=useState<Rule[]>([]);
  const addHandoffId=useId();
  const nextId=useRef(0),pending=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  const selectedTargets=targets.filter(t=>targetIds.includes(t.id));
  const allEnabled=selectedTargets.length>0 && selectedTargets.every(t=>t.enabled);
  const mixed=selectedTargets.some(t=>t.enabled) && selectedTargets.some(t=>!t.enabled);
  const matchingTargets=targets.filter(t=>t.name.includes(query));
  const enter=(next:'single'|'batch',trigger:HTMLButtonElement)=>{
    opener.current=trigger;
    if(next!==context) {setTargetIds(next==='single'?['a']:[]);setSelected(null);setIntent('keep');setPlan(null);setQuery('');setTargetPage(1);}
    setContext(next);setOpen(true);
  };
  const draft=drafts[editing], saved=templates.find(t=>t.id===editing);
  const selectedTemplate=templates.find(t=>t.id===selected?.id && t.version===selected.version) || null;
  const dirty=!saved || draft.name!==saved.name || !equalRules(draft.rows,saved.rows);
  const update=(patch:Partial<Draft>)=>{if(pending.current) return;setDrafts(current=>({...current,[editing]:{...current[editing],...patch}}));setError('');setMessage('');};
  const rowError=(row:Rule)=>!row.source ? '请选择来源' : !row.target ? '请选择目标' : draft.rows.filter(r=>r.source===row.source).length>1 ? '来源重复，请选择不同来源' : undefined;
  const rows:MappingEditorRow[]=draft.rows.map(row=>({...row,error:rowError(row),sourceOptions:options.map(option=>({...option,disabled:option.value!==row.source && draft.rows.some(other=>other.id!==row.id && other.source===option.value)}))}));
  const save=()=>{
    if(pending.current) return;
    const name=draft.name.trim();
    if(!name) {setError('请输入模板名称');return;}
    if(templates.some(t=>t.id!==editing && t.name.toLocaleLowerCase()===name.toLocaleLowerCase())) {setError('模板名称重复');return;}
    if(draft.rows.some(row=>rowError(row))) {setError('请修正逐行错误后保存');return;}
    const id=editing, snapshot={name,rows:draft.rows.map(row=>({...row}))};
    pending.current=true;setBusy(true);setError('');setMessage('');
    timer.current=setTimeout(()=>{
      pending.current=false;setBusy(false);
      if(failure) {setError('保存失败，草稿已保留，请重试');return;}
      const version=(templates.find(t=>t.id===id)?.version || 0)+1;
      setTemplates(current=>[...current.filter(t=>t.id!==id),{id,version,...snapshot}]);
      setDrafts(current=>({...current,[id]:snapshot}));
      if(selectedRef.current?.id===id) {setSelected(null);setPlan(null);setMessage('模板已更新，原选择已失效，请重新选择版本');}
      else setMessage('模板已保存，目标对象未改变');
    },400);
  };
  const create=()=>{if(pending.current) return;const id=`template-${nextId.current++}`;setDrafts(current=>({...current,[id]:{name:'',rows:[]}}));setEditing(id);setSection('edit');setMessage('');setError('');setPlan(null);};
  const changes=(target:Target, template:Template|null, action:Intent)=>{
    if(!target.editable) return ['跳过：此对象不可编辑'];
    const parts=[];
    if(template && !equalRules(target.rows,template.rows)) {
      parts.push(`规则 ${target.rows.length} → ${template.rows.length} 条`);
      const label=(value:string)=>options.find(option=>option.value===value)?.label || value;
      for(const old of target.rows) {
        const next=template.rows.find(row=>row.source===old.source);
        if(!next) parts.push(`删除 ${label(old.source)} → ${label(old.target)}`);
        else if(next.target!==old.target) parts.push(`替换 ${label(old.source)}：${label(old.target)} → ${label(next.target)}`);
      }
      for(const next of template.rows) if(!target.rows.some(row=>row.source===next.source)) parts.push(`新增 ${label(next.source)} → ${label(next.target)}`);
    }
    const enabled=action==='keep'?target.enabled:action==='on';
    if(enabled!==target.enabled) parts.push(`${target.enabled?'开启':'关闭'} → ${enabled?'开启':'关闭'}`);
    return parts.length ? parts : ['不变'];
  };
  const apply=()=>{
    if(!plan) return;
    const ids=new Set(plan.targets.filter(t=>t.editable).map(t=>t.id));
    setTargets(current=>current.map(t=>ids.has(t.id)?{...t,rows:plan.template?plan.template.rows.map(r=>({...r})):t.rows,enabled:plan.intent==='keep'?t.enabled:plan.intent==='on'}:t));
    setPlan(null);setIntent('keep');setMessage('已应用演示配置（仅本页内存）');
  };
  const nav=[{id:'apply',label:'应用配置',href:'#apply'},{id:'edit',label:'模板编辑',href:'#edit'},{id:'other',label:'其他设置',href:'#other'}];
  return <Stack gap={4}>
    <Text as="h2" variant="section">模板驱动批量设置</Text>
    <Text>合成数据，仅本页内存；业务权限、服务与持久化由宿主提供。</Text>
    <Checkbox label="模拟模板保存失败" checked={failure} onChange={e=>setFailure(e.target.checked)} />
    <Select label="编辑器状态" value={mode} onChange={e=>setMode(e.target.value)}><option value="edit">可编辑</option><option value="disabled">禁用</option><option value="readonly">只读</option></Select>
    <Button variant="secondary" disabled={busy} onClick={()=>{setDrafts(current=>({...current,[editing]:{...current[editing],rows:options.map(o=>({id:`rule-${nextId.current++}`,source:o.value,target:'option-2'}))}}));setSection('edit');}}>载入八行草稿</Button>
    <Button variant="secondary" disabled={busy} onClick={()=>{setDrafts(current=>({...current,[editing]:{...current[editing],rows:[{id:`rule-${nextId.current++}`,source:'option-1',target:''},{id:`rule-${nextId.current++}`,source:'option-1',target:'option-2'}]}}));setSection('edit');}}>载入重复来源与空目标</Button>
    <Button variant="secondary" onClick={e=>enter('single',e.currentTarget)}>设置合成对象甲</Button>
    <Dialog title="模板配置" height={760} open={open} onOpenChange={setOpen} trigger={<Button onClick={e=>enter('batch',e.currentTarget)}>打开模板工作区</Button>}
      description={context==='single' ? '当前对象：合成对象甲' : undefined}
      onCloseAutoFocus={event=>{event.preventDefault();opener.current?.focus();}}
      navigation={<SideNav aria-label="模板工作区栏目" currentId={section} groups={[{label:'配置',items:nav.map(item=>({...item,disabled:Boolean(plan)}))}]} onNavigate={(item,e)=>{e.preventDefault();if(!plan) setSection(item.id);}} />}
      footer={<>
        <Button variant="secondary" disabled={busy} onClick={()=>{if(plan) setPlan(null);else if(section==='edit') {update(saved ? {name:saved.name,rows:saved.rows} : {name:'',rows:[]});}else {setSelected(null);setIntent('keep');setMessage('已撤销应用选择');}}}>{plan?'返回':'撤销'}</Button>
        <Button variant="secondary" onClick={()=>setOpen(false)}>关闭</Button>
        {section==='edit' ? <Button busy={busy} disabled={mode!=='edit'} onClick={save}>保存</Button> : plan ? <Button onClick={apply}>确认</Button> : <Button disabled={!targetIds.length || (!selectedTemplate && intent==='keep')} onClick={()=>{setSection('apply');setPlan({template:selectedTemplate,intent,targets:targets.filter(t=>targetIds.includes(t.id)).map(t=>({...t}))});}}>预览</Button>}
      </>}>
      <div className="template-settings-context"><div className={`template-settings-layout ${context==='batch'?'template-settings-layout--batch':''}`}>
        {context==='batch' && <aside aria-label="批量对象栏" className="template-settings-targets">
          <RemoteMultiSelect label="目标对象" query={query} onQueryChange={value=>{setQuery(value);setTargetPage(1);}}
            value={selectedTargets.map(t=>({value:t.id,label:t.name}))}
            onValueChange={values=>{if(!plan) setTargetIds(values.map(v=>v.value));}}
            options={matchingTargets.slice(0,targetPage*2).map(t=>({value:t.id,label:t.name}))}
            hasMore={matchingTargets.length>targetPage*2} onLoadMore={()=>setTargetPage(page=>page+1)}
            disabled={Boolean(plan)} maxVisibleTags={1} />
        </aside>}
      <div className="template-settings-feature"><Stack gap={4}>
        {error && <Notice tone="error" title={error} />}
        {message && <Text role="status">{message}</Text>}
        {busy && <Text role="status">正在保存模板</Text>}
        {section==='edit' && <>
          <Select label="编辑模板" disabled={busy} value={editing} onChange={e=>{setEditing(e.target.value);setError('');setMessage('');}}>{Object.entries(drafts).map(([id,d])=><option key={id} value={id}>{d.name || '未命名草稿'}{templates.some(t=>t.id===id)?'':'（未保存）'}</option>)}</Select>
          <Button variant="secondary" disabled={busy || mode!=='edit'} onClick={create}>新建模板</Button>
          <TextField label="模板名称" value={draft.name} disabled={busy || mode==='disabled'} readOnly={mode==='readonly'} onChange={e=>update({name:e.target.value})} />
          {dirty && <Text role="status">有未保存的模板修改</Text>}
          <MappingEditor label="模板规则" rows={rows} sourceOptions={options} targetOptions={options} disabled={busy || mode==='disabled'} readOnly={mode==='readonly'}
            onRowChange={(id,values)=>update({rows:draft.rows.map(r=>r.id===id?{...r,...values}:r)})}
            onRemove={id=>update({rows:draft.rows.filter(r=>r.id!==id)})}
            onAdd={()=>{const id=`rule-${nextId.current++}`;update({rows:[...draft.rows,{id,source:'',target:''}]});return id;}} emptyContent="模板暂无规则" />
        </>}
        {section==='other' && <Switch label="启用调度" checked={intent==='keep'?allEnabled:intent==='on'} disabled={!targetIds.length} hint={intent==='keep' && mixed?'部分对象已开启':undefined} onCheckedChange={checked=>{setIntent(checked?'on':'off');setMessage('');}} />}
        {section==='apply' && (plan ? <>
          <Text as="h3" variant="heading">确认逐目标差异</Text><Text>{plan.template?`${plan.template.name} · v${plan.template.version}`:'规则保持原值'}；{plan.intent==='keep'?'开关保持各自原值':plan.intent==='on'?'全部开启':'全部关闭'}</Text>
          {plan.targets.map(target=><Stack key={target.id} gap={1}><Text>{target.name}</Text>{changes(target,plan.template,plan.intent).map((change,index)=><Text key={index}>{change}</Text>)}</Stack>)}
        </> : <>
          <Select label="已保存模板" value={selectedTemplate?.id || ''} onChange={e=>{const t=templates.find(t=>t.id===e.target.value);setSelected(t?{id:t.id,version:t.version}:null);setMessage('');}}><option value="">不修改规则</option>{templates.map(t=><option key={t.id} value={t.id}>{t.name} · v{t.version}</option>)}</Select>
          {selectedTemplate ? <><Text>只读预览 · v{selectedTemplate.version}</Text><MappingEditor label="已保存模板规则" rows={selectedTemplate.rows} sourceOptions={options} targetOptions={options} onRowChange={()=>{}} readOnly emptyContent="空模板：应用后清空规则" /></> : <EmptyState title="规则保持原值" description="" />}
        </>)}
      </Stack></div></div></div>
    </Dialog>
    <Text as="h3" variant="heading">实际目标状态</Text>
    <div aria-label="已应用目标状态">{targets.map(t=><Text key={t.id}>{t.name}：{t.enabled?'开启':'关闭'}，{t.rows.length}条规则</Text>)}</div>
    <Text as="h3" variant="heading">宿主删除后的焦点交接</Text>
    <MappingEditor label="宿主焦点交接规则" rows={handoffRows} sourceOptions={keyboardOptions} targetOptions={keyboardOptions} onRowChange={(id,values)=>setHandoffRows(current=>current.map(row=>row.id===id?{...row,...values}:row))} onRemove={id=>{setHandoffRows(current=>current.filter(row=>row.id!==id));document.getElementById(handoffId)?.focus();}} />
    <TextField id={handoffId} label="宿主删除后确认" />
    <Text as="h3" variant="heading">添加提交与焦点交接</Text>
    <Select label="添加行为" value={addMode} onChange={e=>setAddMode(e.target.value)}>
      <option value="batch">普通批处理</option><option value="flush">同步提交</option><option value="handoff">同步提交后宿主移焦</option><option value="cancel">取消添加</option><option value="reject">拒绝添加</option>
    </Select>
    <MappingEditor label="添加焦点规则" rows={addRows} sourceOptions={keyboardOptions} targetOptions={keyboardOptions}
      onRowChange={(id,values)=>setAddRows(current=>current.map(row=>row.id===id?{...row,...values}:row))}
      onAdd={()=>{
        if(addMode==='cancel') return undefined;
        const id=`add-${nextId.current++}`;
        if(addMode==='reject') return id;
        const append=()=>setAddRows(current=>[...current,{id,source:'',target:''}]);
        if(addMode==='batch') append();else flushSync(append);
        if(addMode==='handoff') document.getElementById(addHandoffId)?.focus();
        return id;
      }} />
    <TextField id={addHandoffId} label="宿主添加后确认" />
  </Stack>;
}

export function TemplateSettingsFixture() {
  const params=new URLSearchParams(location.search), zoom=Number(params.get('zoom')) || 1;
  useEffect(()=>{document.documentElement.style.zoom=String(zoom);return()=>{document.documentElement.style.zoom='';};},[zoom]);
  return <ThemeProvider defaultTheme={(params.get('theme') || 'rhine') as ThemeName} data-rhine-motion={params.get('motion') || 'reduced'}><div style={{padding:16}}><TemplateSettingsGallery keyboardLabels={params.get('keyboard')==='latin'} /></div></ThemeProvider>;
}
