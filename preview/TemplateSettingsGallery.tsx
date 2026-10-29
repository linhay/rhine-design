import { useEffect, useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import './template-settings.css';
import { Badge, Button, Checkbox, Dialog, Inline, MappingEditor, Notice, RemoteMultiSelect, Select, SettingsNavigation, Stack, Switch, Text, TextField, type MappingEditorRow } from '../components';
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

export function TemplateSettingsGallery({keyboardLabels=false,longNavigation=false}:{keyboardLabels?:boolean;longNavigation?:boolean}={}) {
  const options=keyboardLabels ? catalogOptions.map((option,index)=>({...option,label:`${['Alpha','Beta','Gamma','Delta','Echo','Foxtrot','Hotel','India'][index]} · ${option.label}`})) : catalogOptions;
  const [closePrompt,setClosePrompt]=useState(false),closeOrigin=useRef<HTMLElement|null>(null);
  const [open,setOpen]=useState(false),[section,setSection]=useState('apply');
  const [templates,setTemplates]=useState(initialTemplates),[targets,setTargets]=useState(initialTargets);
  const [drafts,setDrafts]=useState<Record<string,Draft>>(()=>Object.fromEntries(initialTemplates.map(t=>[t.id,{name:t.name,rows:t.rows}])));
  const [editing,setEditing]=useState('basic'),[selected,setSelected]=useState<{id:string;version:number}|null>(null);
  const [context,setContext]=useState<'single'|'batch'>('batch');
  const [query,setQuery]=useState(''),[targetPage,setTargetPage]=useState(1);
  const opener=useRef<HTMLButtonElement|null>(null);
  const [targetIds,setTargetIds]=useState<string[]>([]),[intent,setIntent]=useState<Intent>('keep');
  const [message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [applyFailure,setApplyFailure]=useState(false),[receipts,setReceipts]=useState<{name:string;status:string}[]>([]),[retryPlan,setRetryPlan]=useState<typeof plan>(null);
  const [failure,setFailure]=useState(false),[mode,setMode]=useState('edit'),[readOnlyWorkspace,setReadOnlyWorkspace]=useState(false);
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
  const contextDrafts=useRef(new Map<'single'|'batch',{targetIds:string[];selected:typeof selected;intent:Intent;query:string;targetPage:number}>());
  const enter=(next:'single'|'batch',trigger:HTMLButtonElement)=>{
    opener.current=trigger;
    if(next!==context) {
      contextDrafts.current.set(context,{targetIds,selected,intent,query,targetPage});
      const previous=contextDrafts.current.get(next);
      setTargetIds(previous?.targetIds || (next==='single'?['a']:[]));setSelected(previous?.selected || null);setIntent(previous?.intent || 'keep');setQuery(previous?.query || '');setTargetPage(previous?.targetPage || 1);setPlan(null);setReceipts([]);setRetryPlan(null);setMessage('');
    }
    setContext(next);setOpen(true);
  };
  const draft=drafts[editing] || {name:'',rows:[]}, saved=templates.find(t=>t.id===editing);
  const selectedTemplate=templates.find(t=>t.id===selected?.id && t.version===selected.version) || null;
  const dirty=Boolean(editing) && (!saved || draft.name!==saved.name || !equalRules(draft.rows,saved.rows));
  const hasChanges=selectedTargets.some(t=>t.editable && ((selectedTemplate && !equalRules(t.rows,selectedTemplate.rows)) || (intent!=='keep' && t.enabled!==(intent==='on'))));
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
      else setMessage('模板已保存');
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
  const apply=(snapshot=plan)=>{
    if(!snapshot) return;
    const failed=snapshot.targets.filter(t=>applyFailure && t.id==='b' && t.editable && changes(t,snapshot.template,snapshot.intent)[0]!=='不变');
    const ids=new Set(snapshot.targets.filter(t=>t.editable && !failed.some(f=>f.id===t.id)).map(t=>t.id));
    setTargets(current=>current.map(t=>ids.has(t.id)?{...t,rows:snapshot.template?snapshot.template.rows.map(r=>({...r})):t.rows,enabled:snapshot.intent==='keep'?t.enabled:snapshot.intent==='on'}:t));
    const updated=snapshot.targets.map(t=>({name:t.name,status:!t.editable?'跳过：此对象不可编辑':failed.some(f=>f.id===t.id)?'修改失败':changes(t,snapshot.template,snapshot.intent)[0]==='不变'?'不变':'修改完成'}));
    setReceipts(current=>snapshot===retryPlan?current.map(old=>updated.find(r=>r.name===old.name) || old):updated);
    setRetryPlan(failed.length?{...snapshot,targets:failed}:null);setApplyFailure(false);
    setPlan(null);setIntent('keep');setMessage(failed.length?'部分修改失败':'修改完成');
  };
  const continueEditing=()=>{flushSync(()=>setClosePrompt(false));closeOrigin.current?.focus();};
  const nav=[{id:'apply',label:'应用配置',href:'#apply'},{id:'edit',label:'模板编辑',href:'#edit'},{id:'other',label:longNavigation?'其他设置：用于验证超长栏目名称的合成导航项目':'其他设置',href:'#other'}];
  return <Stack gap={4}>
    <Text as="h2" variant="section">模板驱动批量设置</Text>
    <Text>合成数据，仅本页内存；业务权限、服务与持久化由宿主提供。</Text>
    <Checkbox label="只读工作区" checked={readOnlyWorkspace} onChange={e=>{setReadOnlyWorkspace(e.target.checked);if(e.target.checked) setSection('apply');}} />
    <Checkbox label="模拟模板保存失败" checked={failure} onChange={e=>setFailure(e.target.checked)} />
    <Checkbox label="模拟批量部分失败一次" checked={applyFailure} onChange={e=>setApplyFailure(e.target.checked)} />
    <Button variant="secondary" disabled={busy} onClick={()=>{setTemplates([]);setDrafts({});setEditing('');setSelected(null);setMessage('');setError('');setSection('apply');}}>载入无模板</Button>
    <Select label="编辑器状态" value={mode} onChange={e=>setMode(e.target.value)}><option value="edit">可编辑</option><option value="disabled">禁用</option><option value="readonly">只读</option></Select>
    <Button variant="secondary" disabled={busy || readOnlyWorkspace || !editing} onClick={()=>{setDrafts(current=>({...current,[editing]:{...current[editing],rows:options.map(o=>({id:`rule-${nextId.current++}`,source:o.value,target:'option-2'}))}}));setSection('edit');}}>载入八行草稿</Button>
    <Button variant="secondary" disabled={busy || readOnlyWorkspace || !editing} onClick={()=>{setDrafts(current=>({...current,[editing]:{...current[editing],rows:[{id:`rule-${nextId.current++}`,source:'option-1',target:''},{id:`rule-${nextId.current++}`,source:'option-1',target:'option-2'}]}}));setSection('edit');}}>载入重复来源与空目标</Button>
    <Button variant="secondary" onClick={e=>enter('single',e.currentTarget)}>设置合成对象甲</Button>
    <Dialog title={context==='single'?'模板配置 · 合成对象甲':'模板配置'} height={760} open={open} onOpenChange={next=>{if(!next && (dirty || hasChanges)) {closeOrigin.current=document.activeElement as HTMLElement;setClosePrompt(true);}else setOpen(next);}} trigger={<Button onClick={e=>enter('batch',e.currentTarget)}>打开模板工作区</Button>}
      onCloseAutoFocus={event=>{event.preventDefault();opener.current?.focus();}}
      navigation={<SettingsNavigation label="模板工作区栏目" currentId={section} items={nav.filter(item=>!readOnlyWorkspace || item.id!=='edit')} disabled={Boolean(plan) || busy} onNavigate={item=>setSection(item.id)} />}
      footer={(section==='edit' && !editing) || (section==='apply' && !templates.length && !plan && !hasChanges) ? undefined : <>
        <Button variant="secondary" disabled={busy} onClick={()=>{if(plan) setPlan(null);else if(section==='edit') {if(saved) update({name:saved.name,rows:saved.rows});else {setEditing(templates[0]?.id || '');setError('');setMessage('');}}else {setSelected(null);setIntent('keep');setMessage('已撤销应用选择');}}}>{plan?'返回编辑':'撤销'}</Button>
        {section==='edit' ? editing && <Button busy={busy} disabled={mode!=='edit' || readOnlyWorkspace} onClick={save}>保存</Button> : plan ? <Button onClick={()=>apply()}>确认修改</Button> : <Button disabled={readOnlyWorkspace || !targetIds.length || (!selectedTemplate && intent==='keep')} onClick={()=>{setMessage('');setReceipts([]);setRetryPlan(null);setSection('apply');setPlan({template:selectedTemplate,intent,targets:targets.filter(t=>targetIds.includes(t.id)).map(t=>({...t}))});}}>预览</Button>}
      </>}>
      <Dialog trigger={<span hidden />} title="保留未完成修改？" open={closePrompt} onOpenChange={next=>{if(next)setClosePrompt(true);else continueEditing();}}
        onCloseAutoFocus={event=>{event.preventDefault();if(open && (!document.activeElement || document.activeElement===document.body || document.activeElement.hasAttribute('data-radix-focus-guard'))) closeOrigin.current?.focus();}}
        footer={<><Button variant="secondary" onClick={continueEditing}>继续编辑</Button><Button variant="secondary" onClick={()=>{setClosePrompt(false);setOpen(false);}}>保留草稿并关闭</Button><Button variant="danger" disabled={busy} onClick={()=>{
          if(hasChanges) {setSelected(null);setIntent('keep');setPlan(null);}else if(saved) update({name:saved.name,rows:saved.rows});else setEditing(templates[0]?.id || '');
          setClosePrompt(false);setOpen(false);
        }}>{hasChanges?'放弃应用修改并关闭':'放弃当前模板修改并关闭'}</Button></>}>
        <Text>{hasChanges?'应用修改尚未确认；模板草稿独立保留。':'当前模板尚未保存；其他模板草稿不受影响。'}</Text>
      </Dialog>
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
        {retryPlan && <Notice tone="error" title="失败项尚未修改" action={<Button variant="secondary" onClick={()=>apply(retryPlan)}>重试失败项</Button>}>成功项已保留。</Notice>}
        {context==='batch' && receipts.length>0 && <ul aria-label="逐对象回执">{receipts.map(r=><li key={r.name}>{r.name}：{r.status}</li>)}</ul>}
        {!plan && hasChanges && <Text role="status">有未确认修改</Text>}
        {busy && <Text role="status">正在保存模板</Text>}
        {section==='edit' && <>
          {templates.length>0 && <><Inline gap={2}><Select label="编辑模板" disabled={busy || dirty} value={editing} onChange={e=>{setEditing(e.target.value);setError('');setMessage('');}}>{Object.entries(drafts).filter(([id])=>templates.some(t=>t.id===id)||id===editing).map(([id,d])=><option key={id} value={id}>{d.name || '未命名草稿'}{templates.some(t=>t.id===id)?'':'（未保存）'}</option>)}</Select>
          <Button variant="secondary" disabled={busy || dirty || mode!=='edit'} onClick={create}>新建模板</Button></Inline>
          {dirty && <Text tone="muted">保存或撤销后可切换模板</Text>}</>}
          {!editing ? <Inline gap={2}><Text>暂无模板</Text><Button variant="secondary" onClick={create}>新建</Button></Inline> : <>
          <TextField label="模板名称" value={draft.name} disabled={busy || mode==='disabled'} readOnly={mode==='readonly'} onChange={e=>update({name:e.target.value})} />
          {dirty && <Text role="status">有未保存的模板修改</Text>}
          <MappingEditor density="compact" label="模板规则" rows={rows} sourceOptions={options} targetOptions={options} disabled={busy || mode==='disabled'} readOnly={mode==='readonly'}
            onRowChange={(id,values)=>update({rows:draft.rows.map(r=>r.id===id?{...r,...values}:r)})}
            onRemove={id=>update({rows:draft.rows.filter(r=>r.id!==id)})}
            onAdd={()=>{const id=`rule-${nextId.current++}`;update({rows:[...draft.rows,{id,source:'',target:''}]});return id;}} emptyContent="模板暂无规则" />
          </>}
        </>}
        {section==='other' && <Switch layout="row" label="启用调度" checked={intent==='keep'?allEnabled:intent==='on'} disabled={!targetIds.length || readOnlyWorkspace} hint={intent==='keep' && mixed?'部分对象已开启':undefined} onCheckedChange={checked=>{setIntent(checked?'on':'off');setMessage('');}} />}
        {section==='apply' && (plan ? <>
          {context==='batch' && <Text>{plan.targets.length} 个对象</Text>}<Text>{plan.template?`${plan.template.name} · v${plan.template.version}`:'规则保持原值'}；{plan.intent==='keep'?'开关保持各自原值':plan.intent==='on'?'全部开启':'全部关闭'}</Text>
          {plan.targets.map(target=><Stack key={target.id} gap={1}>{context==='batch' && <Text variant="label">{target.name}</Text>}{changes(target,plan.template,plan.intent).map((change,index)=><Text key={index}>{change}</Text>)}</Stack>)}
        </> : templates.length===0 ? <Inline gap={2}><Text>暂无模板</Text>{!readOnlyWorkspace && <Button variant="secondary" onClick={()=>setSection('edit')}>前往编辑</Button>}</Inline> : <>
          <Select label="已保存模板" disabled={readOnlyWorkspace} value={selectedTemplate?.id || ''} onChange={e=>{const t=templates.find(t=>t.id===e.target.value);setSelected(t?{id:t.id,version:t.version}:null);setMessage('');}}><option value="">不修改规则</option>{templates.map(t=><option key={t.id} value={t.id}>{t.name} · v{t.version}</option>)}</Select>
          {selectedTemplate ? <><MappingEditor density="compact" readOnlyLayout="grouped" label="已保存模板规则" rows={selectedTemplate.rows} sourceOptions={options} targetOptions={options} onRowChange={()=>{}} readOnly emptyContent="空模板：应用后清空规则" /></> : null}
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

export function SwitchRowsExample() {
  const [draft,setDraft]=useState(false),[applied,setApplied]=useState(false),[long,setLong]=useState(true),[cards,setCards]=useState([false,true,true]);
  return <section aria-label="开关行样例"><Stack gap={3}>
    <Switch layout="row" label="接收提醒" checked={draft} onCheckedChange={setDraft} />
    <Switch layout="row" label="较长设置名称：保留完整说明并在窄容器中自然换行" hint="仅修改草稿，确认后才生效。较长提示也应完整换行。" checked={long} onCheckedChange={setLong} />
    <Switch layout="row" label="不可更改的设置" checked disabled onCheckedChange={()=>{}} />
    <Switch layout="row" label="只读设置" checked readOnly hint="可以聚焦查看当前值" onCheckedChange={()=>{}} />
    <Switch label="默认内联开关" checked onCheckedChange={()=>{}} />
    <section aria-label="独立卡片开关"><Stack gap={3}>
      {['消息提醒','自动归档','长名称：团队资料同步与离线保留的独立设置'].map((title,index)=><div key={title} style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,minWidth:0}}>
        <Text as="h3" variant="label" style={{overflowWrap:'anywhere'}}>{title}</Text>
        <Switch label={`${title}启用`} labelVisibility="hidden" checked={cards[index]} onCheckedChange={checked=>setCards(current=>current.map((value,i)=>i===index?checked:value))} />
      </div>)}
      <Inline gap={2}><Text>只读设置</Text><Switch label="隐藏标签只读开关" labelVisibility="hidden" layout="row" checked readOnly onCheckedChange={()=>{}} /></Inline>
      <Inline gap={2}><Text>不可更改的设置</Text><Switch label="隐藏标签禁用开关" labelVisibility="hidden" checked disabled onCheckedChange={()=>{}} /></Inline>
    </Stack></section>
    <Button onClick={()=>setApplied(draft)}>确认开关草稿</Button><Text aria-label="已提交开关">{applied?'已开启':'已关闭'}</Text>
  </Stack></section>;
}

export function MappingDensityExamples() {
  const options=[{value:'a',label:'Alpha'},{value:'b',label:'Beta'},{value:'c',label:'Gamma'},{value:'d',label:'Delta'},{value:'long',label:'很长的来源名称：跨团队归档与完整内容在窄窗口中自然换行'}];
  const initial=[{id:'1',source:'a',target:'b'},{id:'2',source:'c',target:'d'},{id:'3',source:'b',target:'b'},{id:'4',source:'long',target:'long'}];
  const [rows,setRows]=useState<MappingEditorRow[]>(initial);
  const next=useRef(5);
  return <section aria-label="紧凑映射与汇合预览" style={{paddingInline:16}}><Stack gap={3}>
    <Text as="h2" variant="section">紧凑映射与汇合预览</Text>
    <MappingEditor density="compact" label="紧凑映射" rows={rows} sourceOptions={options} targetOptions={options}
      onRowChange={(id,values)=>setRows(current=>current.map(row=>row.id===id?{...row,...values}:row))}
      onRemove={id=>setRows(current=>current.filter(row=>row.id!==id))}
      onAdd={()=>{const id=String(next.current++);setRows(current=>[...current,{id,source:'',target:''}]);return id;}} />
    <MappingEditor density="compact" label="紧凑逐行只读" rows={rows} sourceOptions={options} targetOptions={options} onRowChange={()=>{}} readOnly />
    <section aria-label="完整来源预览"><Stack gap={2}>
      <Text>{rows.length+2} 个来源</Text>
      <Inline gap={1} aria-label="原名使用"><Badge>原名甲</Badge><Badge>原名乙</Badge></Inline>
      <MappingEditor label="按目标汇合预览" rows={rows} sourceOptions={options} targetOptions={options} onRowChange={()=>{}} readOnly readOnlyLayout="grouped" />
    </Stack></section>
    <MappingEditor label="空分组预览" rows={[]} sourceOptions={options} targetOptions={options} onRowChange={()=>{}} readOnly readOnlyLayout="grouped" />
    <MappingEditor label="默认映射布局" rows={[initial[0]]} sourceOptions={options} targetOptions={options} onRowChange={()=>{}} />
  </Stack></section>;
}

export function TemplateSettingsFixture() {
  const params=new URLSearchParams(location.search), zoom=Number(params.get('zoom')) || 1;
  useEffect(()=>{document.documentElement.style.zoom=String(zoom);return()=>{document.documentElement.style.zoom='';};},[zoom]);
  return <ThemeProvider defaultTheme={(params.get('theme') || 'rhine') as ThemeName} data-rhine-motion={params.get('motion') || 'reduced'}><div dir={params.get('dir')==='rtl'?'rtl':'ltr'} style={{padding:16}}>{params.get('switches')==='1' && <SwitchRowsExample />}{params.get('density')==='1' && <MappingDensityExamples />}<TemplateSettingsGallery keyboardLabels={params.get('keyboard')==='latin'} longNavigation={params.get('longnav')==='1'} /></div></ThemeProvider>;
}
