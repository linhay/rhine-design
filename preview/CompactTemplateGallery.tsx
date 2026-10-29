import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Button, Checkbox, Dialog, Inline, MappingEditor, Notice, RemoteMultiSelect, SettingsNavigation, Stack, Tabs, Text, TextField, Toast, type Choice, type MappingEditorRow } from '../components';
import { ThemeProvider, type ThemeName } from '../components/theme';

export const compactChoices: Choice[] = [
  ...Array.from({length:10},(_,i)=>({value:`model-${i}`,label:`model-${i}`})),
  {value:'long',label:'完整的合成跨团队模型名称-with-a-very-long-unbroken-identifier-abcdefghijklmnopqrstuvwxyz'},
];
const groupedRows = [
  {id:'a',source:'model-0',target:'model-9'}, {id:'b',source:'model-1',target:'model-9'},
  {id:'c',source:'model-2',target:'model-8'}, {id:'d',source:'model-0',target:'model-9'},
  {id:'e',source:'model-9',target:'model-9'}, {id:'f',source:'long',target:'model-8'},
];
export function CompactTagsExample() {
  const [value,setValue]=useState(compactChoices),[query,setQuery]=useState(''),[active,setActive]=useState('model-0');
  const [disabled,setDisabled]=useState(false),[readOnly,setReadOnly]=useState(false),[activate,setActivate]=useState(true);
  return <Stack gap={3}>
    <Text as="h2" variant="section">紧凑已选标签与分组来源</Text>
    <Inline><Checkbox label="禁用紧凑标签" checked={disabled} onChange={e=>setDisabled(e.target.checked)}/><Checkbox label="只读紧凑标签" checked={readOnly} onChange={e=>setReadOnly(e.target.checked)}/><Checkbox label="允许查看标签" checked={activate} onChange={e=>setActivate(e.target.checked)}/></Inline>
    <RemoteMultiSelect label="紧凑模型" tagDensity="compact" query={query} onQueryChange={setQuery} options={compactChoices.filter(item=>item.label.includes(query))} value={value} onValueChange={setValue} activeValue={active} onActivateValue={activate ? item=>setActive(item.value) : undefined} disabled={disabled} readOnly={readOnly}/>
    <Text role="status" aria-label="当前模型">{active}</Text>
    <MappingEditor label="标签来源汇合" rows={groupedRows} sourceOptions={compactChoices} targetOptions={compactChoices} onRowChange={()=>{}} readOnly readOnlyLayout="grouped" groupedSourceLayout="tags"/>
    <MappingEditor label="单一同值来源" rows={[groupedRows[4]]} sourceOptions={compactChoices} targetOptions={compactChoices} onRowChange={()=>{}} readOnly readOnlyLayout="grouped" groupedSourceLayout="tags"/>
    <MappingEditor label="空标签来源" rows={[]} sourceOptions={compactChoices} targetOptions={compactChoices} onRowChange={()=>{}} readOnly readOnlyLayout="grouped" groupedSourceLayout="tags"/>
    <RemoteMultiSelect label="标准标签对照" query="" onQueryChange={()=>{}} options={[]} value={compactChoices.slice(0,1)} onValueChange={()=>{}} readOnly/>
  </Stack>;
}

type Draft = {name:string;values:Choice[];rows:MappingEditorRow[]};
type Problem = {message:string;field:'name'|'source'|'target';row?:number};
const empty:Draft={name:'',values:[],rows:[]};
const canonical=(draft:Draft)=>JSON.stringify({...draft,name:draft.name.trim()});
export function CompleteTemplateExample({settings=false,autoHeight=false}:{settings?:boolean;autoHeight?:boolean}={}) {
  const nameId=useId(),root=useRef<HTMLDivElement>(null),nextId=useRef(0);
  const [open,setOpen]=useState(false),[tab,setTab]=useState('models'),[draft,setDraft]=useState<Draft>(empty),[saved,setSaved]=useState<Draft|null>(null);
  const [problems,setProblems]=useState<Problem[]>([]),[message,setMessage]=useState(''),[toast,setToast]=useState(false),[busy,setBusy]=useState(false),[fail,setFail]=useState(false),[writes,setWrites]=useState(0);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null),pending=useRef(false),failed=useRef(false),focus=useRef<Problem|null>(null);
  const [focusRevision,setFocusRevision]=useState(0),[query,setQuery]=useState('');
  const [directory,setDirectory]=useState(compactChoices.slice(0,3)),[fetching,setFetching]=useState(false),[directoryMessage,setDirectoryMessage]=useState(''),[directoryFailure,setDirectoryFailure]=useState(false);
  const directoryTimer=useRef<ReturnType<typeof setTimeout>|null>(null),directoryPending=useRef(false),directoryFailed=useRef(false);
  useEffect(()=>()=>{if(directoryTimer.current)clearTimeout(directoryTimer.current);},[]);
  const fetchDirectory=()=>{
    if(directoryPending.current || pending.current)return;directoryPending.current=true;setFetching(true);setDirectoryMessage('正在获取目录');
    directoryTimer.current=setTimeout(()=>{directoryTimer.current=null;directoryPending.current=false;setFetching(false);
      if(directoryFailure && !directoryFailed.current){directoryFailed.current=true;setDirectoryMessage('目录获取失败，可重试；选择与草稿保留');return;}
      setDirectory(compactChoices);setDirectoryMessage('目录已更新，选择与草稿保留');
    },250);
  };
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
  useLayoutEffect(()=>{
    const problem=focus.current;if(!problem)return;focus.current=null;
    if(problem.field==='name')document.getElementById(nameId)?.focus();
    else root.current?.querySelectorAll<HTMLSelectElement>('.rhine-mapping-editor__row')[problem.row || 0]?.querySelectorAll('select')[problem.field==='source'?0:1]?.focus();
  },[focusRevision,nameId]);
  const locate=(problem:Problem)=>{if(problem.field!=='name')setTab('mapping');focus.current=problem;setFocusRevision(v=>v+1);};
  const update=(patch:Partial<Draft>)=>{setDraft(current=>({...current,...patch}));setToast(false);setMessage('');setProblems([]);};
  const save=()=>{
    if(pending.current)return;
    setToast(false);setMessage('');
    const errors:Problem[]=[];
    if(!draft.name.trim())errors.push({field:'name',message:'请输入模板名称'});
    else if(draft.name.trim().toLocaleLowerCase()==='常用模板')errors.push({field:'name',message:'名称重复，请更名'});
    draft.rows.forEach((row,index)=>{if(!row.source)errors.push({field:'source',row:index,message:`第${index+1}行请选择来源`});else if(!row.target)errors.push({field:'target',row:index,message:`第${index+1}行请选择目标`});});
    setProblems(errors);
    if(errors.length){locate(errors[0]);return;}
    if(saved && canonical(saved)===canonical(draft)){setMessage(settings?'模板未修改，无需保存':'无需保存');return;}
    const snapshot={...draft,name:draft.name.trim(),values:[...draft.values],rows:draft.rows.map(row=>({...row}))};
    pending.current=true;setBusy(true);
    timer.current=setTimeout(()=>{
      timer.current=null;pending.current=false;setBusy(false);
      if(fail && !failed.current){failed.current=true;setMessage(settings?'模板保存失败，草稿已保留。请重试。':'保存失败，请重试');return;}
      setSaved(snapshot);setWrites(count=>count+1);setToast(true);
    },350);
  };
  return <Stack gap={3}>
    <Text as="h2" variant="section">完整模板保存反馈</Text>
    <Checkbox label="首次保存失败" checked={fail} onChange={e=>{setFail(e.target.checked);failed.current=false;}}/>
    <Checkbox label="首次目录获取失败" checked={directoryFailure} onChange={e=>{setDirectoryFailure(e.target.checked);directoryFailed.current=false;}}/>
    <Text role="status" aria-label="模板写入次数">写入 {writes} 次</Text>
    <Text aria-label="已保存模板">{saved ? `${saved.name} · ${saved.values.length} 个模型 · ${saved.rows.length} 条映射` : '尚未保存模板'}</Text>
    <Dialog title={settings?"账号设置 · 合成主账号":"编辑完整模板"} height={autoHeight?"auto":720} navigation={settings?<SettingsNavigation label="设置功能" currentId="templates" items={[{id:"templates",label:"模板编辑"}]} onNavigate={()=>{}}/>:undefined} open={open} onOpenChange={next=>{if(!pending.current)setOpen(next);}} trigger={<Button variant="secondary">新建完整模板</Button>}
      footer={<>
        {problems.length>0 && <div style={{width:'100%'}}><Notice tone="error" title={problems[0].message}/></div>}
        {message && <div style={{width:'100%'}}><Notice tone={message.includes('保存失败')?'error':'neutral'} title={message}/></div>}
        {toast && <div style={{width:'100%'}}><Toast open={toast} onOpenChange={setToast} title={settings?"模板已保存":"已保存"}/></div>}
        {settings ? <Button variant="secondary" disabled={busy} onClick={()=>{update(saved ? {...saved,values:[...saved.values],rows:saved.rows.map(row=>({...row}))} : empty);}}>撤销编辑</Button> : problems.length>0 ? <Button variant="quiet" aria-label="定位错误" onClick={()=>locate(problems[0])}>定位</Button> : <Button variant="secondary" disabled={busy} onClick={()=>setOpen(false)}>关闭</Button>}
        <Button aria-label="保存完整模板" busy={busy} onClick={save}>{settings?"保存模板":"保存"}</Button>
      </>}>
      <div ref={root}><Stack gap={3}>
        <TextField id={nameId} label="完整模板名称" value={draft.name} disabled={busy} error={problems.find(problem=>problem.field==='name')?.message} onChange={e=>update({name:e.target.value})}/>
        <Tabs label="完整模板编辑视图" value={tab} onValueChange={setTab} fullWidth items={[
          {value:'models',label:'模型白名单',content:<Stack gap={2}><RemoteMultiSelect tagDensity="compact" label="模板模型" query={query} onQueryChange={setQuery} options={directory.filter(item=>item.label.includes(query))} value={draft.values} onValueChange={values=>update({values})} disabled={busy} labelAction={<Button variant="secondary" disabled={busy} busy={fetching} onClick={fetchDirectory}>获取合成目录</Button>}/>{directoryMessage && <Text role="status" aria-label="模板目录结果">{directoryMessage}</Text>}</Stack>},
          {value:'mapping',label:'模型映射',content:<MappingEditor density="compact" label="完整模板映射" rows={draft.rows.map((row,index)=>({...row,error:problems.find(problem=>problem.row===index)?.message}))} sourceOptions={compactChoices} targetOptions={compactChoices} disabled={busy} onRowChange={(id,values)=>update({rows:draft.rows.map(row=>row.id===id?{...row,...values}:row)})} onRemove={id=>update({rows:draft.rows.filter(row=>row.id!==id)})} onAdd={()=>{const id=`complete-${nextId.current++}`;update({rows:[...draft.rows,{id,source:'',target:''}]});return id;}}/>},
        ]}/>
      </Stack></div>
    </Dialog>
  </Stack>;
}
export function CompactTemplateGallery(){return <Stack gap={6}><CompactTagsExample/><CompleteTemplateExample/></Stack>;}
export function CompactTemplateFixture(){
  const params=new URLSearchParams(location.search),zoom=Number(params.get('zoom'))||1;
  useEffect(()=>{document.documentElement.style.zoom=String(zoom);return()=>{document.documentElement.style.zoom='';};},[zoom]);
  return <ThemeProvider theme={(params.get('theme')||'rhine') as ThemeName} data-rhine-motion={params.get('motion')||'system'}><div style={{padding:12}}><Stack gap={6}><CompactTagsExample/><CompleteTemplateExample settings={params.has("settings")} autoHeight={params.has("auto")}/></Stack></div></ThemeProvider>;
}
