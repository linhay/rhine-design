import {useEffect,useRef,useState}from'react';
import {Button,ButtonLink,Checkbox,ConfirmDialog,DataTable,Dialog,Inline,KeyValue,NumberField,Popover,RangeSlider,RemoteMultiSelect,Select,Slider,Stack,Surface,Text,TextField,Tooltip,TreeSelect,type Choice,type SelectionChangeReason,type TreeNode}from'../components';
export function StructuredTooltipGallery(){const[state,setState]=useState('partial');const rows=[{label:'模型／带有很长说明的采样来源名称',value:'12次 / 40%'},{label:'推理构成',value:state==='unknown'?'未知':state==='error'?'读取失败':'18次 / 60%'},{label:'缺口',value:state==='partial'?'部分样本缺失':'无新增信息'}];return <Stack>
<Text>提示中只放可核对的文本结构；关键事实同时常驻。触屏点按不承诺悬停提示，交互明细用Popover。</Text>
<Select label="提示数据状态" value={state} onChange={e=>setState(e.target.value)}>
<option value="partial">部分</option>
<option value="normal">完整</option>
<option value="unknown">未知</option>
<option value="error">失败</option>
</Select>
<Surface>
<Inline>
<Tooltip width={420} content={{title:'合成采样构成',rows,description:'无真实请求；比例与缺口由宿主提供。'}}>
<Button variant="quiet">采样构成帮助</Button>
</Tooltip>
<Tooltip content="原字符串提示保持兼容。">
<Button variant="quiet">短说明</Button>
</Tooltip>
<Popover title="可操作的明细" trigger={<Button variant="secondary">打开明细</Button>}>
<TextField label="明细草稿" defaultValue="交互内容属于Popover"/>
</Popover>
</Inline>
<KeyValue items={rows.map((row,index)=>({key:String(index),...row}))}/>
</Surface>
</Stack>;}
export function DialogGateGallery(){const[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[draft,setDraft]=useState('合成阈值草稿'),[result,setResult]=useState('error'),[status,setStatus]=useState('尚未保存'),[caller,setCaller]=useState(true),[triggerMode,setTriggerMode]=useState(false);const epoch=useRef(0),timers=useRef<ReturnType<typeof setTimeout>[]>([]);useEffect(()=>()=>{epoch.current++;timers.current.forEach(clearTimeout);},[]);
 const change=(next:boolean)=>{if(!next&&busy)return;epoch.current++;setOpen(next);};const save=()=>{const token=++epoch.current;setBusy(true);setStatus('保存结果待确认');timers.current.push(setTimeout(()=>{if(epoch.current!==token)return;setBusy(false);setStatus(result==='success'?'合成保存已确认':result==='unknown'?'结果未知，保留草稿':'合成保存失败，保留草稿');},600));};
 return <Stack>
<Text id="dialog-context" as="h2" tabIndex={-1}>详情上下文</Text>
<Checkbox label="使用真实trigger" checked={triggerMode} onChange={e=>setTriggerMode(e.target.checked)}/>
<Select label="保存结果" value={result} onChange={e=>setResult(e.target.value)}>
<option value="error">失败</option>
<option value="success">明确成功</option>
<option value="unknown">未知</option>
</Select>{caller&&!triggerMode&&<Button id="dialog-caller" onClick={()=>change(true)}>打开受控详情</Button>}<Dialog title="受控详情" trigger={triggerMode?<Button id="dialog-caller">打开触发详情</Button>:undefined} open={open} onOpenChange={change} closingDisabled={busy} closeDisabledReason="保存结果待确认，请保留草稿。" returnFocus={()=>document.getElementById('dialog-caller')??document.getElementById('dialog-context')} footer={<Inline>
<Button busy={busy} onClick={save}>保存草稿</Button>
<Button variant="secondary" disabled={busy} onClick={()=>change(false)}>返回列表</Button>
</Inline>}>
<Stack>
<TextField label="详情草稿" value={draft} onChange={e=>setDraft(e.target.value)}/>
<Text role="status">{status}</Text>
<Button variant="quiet" onClick={()=>{epoch.current++;setBusy(false);setStatus('目标已刷新，旧结果失效');}}>刷新目标</Button>
<Button variant="quiet" onClick={()=>setCaller(false)}>移除打开者</Button>
<Dialog title="子层说明" trigger={<Button variant="secondary">打开子层</Button>}>
<Text>此层关闭门禁独立，Escape先处理本层。</Text>
</Dialog>
</Stack>
</Dialog>
<Text role="status">{status}；草稿：{draft}</Text>
<ConfirmDialog title="显式结果确认" description="合成操作；未知、失败和无明确返回均不关闭。" trigger={<Button variant="danger">打开显式确认</Button>} resultMode="explicit" onConfirm={()=>new Promise(resolve=>{timers.current.push(setTimeout(()=>resolve({status:result==='success'?'success':result==='error'?'error':'unknown'}),300));})}/>
</Stack>;
}
export function ThresholdSliderGallery(){const[value,setValue]=useState<[number,number]>([20,80]),[mode,setMode]=useState('normal'),[last,setLast]=useState('尚未请求'),[scan,setScan]=useState(600),[max,setMax]=useState(720);const propose=(next:[number,number])=>{setLast('请求：'+next.join(' / '));if(mode!=='reject')setValue(next);};return <Stack>
<Select label="滑块状态" value={mode} onChange={e=>setMode(e.target.value)}>
<option value="normal">普通</option>
<option value="reject">受控拒绝</option>
<option value="readonly">只读</option>
<option value="disabled">禁用</option>
<option value="fieldset">父级fieldset禁用</option>
</Select>
<fieldset aria-label="阈值编辑字段组" disabled={mode==='fieldset'} style={{border:0,padding:0,margin:0,minWidth:0}}>
<Surface>
<Stack>
<RangeSlider label="告警恢复双阈值" value={value} onChange={propose} min={0} max={100} step={1} minGap={1} thumbLabels={['触发阈值','恢复阈值']} getValueText={v=>v+'%'} disabled={mode==='disabled'} readOnly={mode==='readonly'} marks={[{value:0,label:'0%'},{value:50,label:'50%'},{value:100,label:'100%'}]} hint="同轨双游标；顺序严格、间距至少1，不推挤另一端。"/>
<Inline>
<NumberField label="触发数值" value={value[0]} onValueChange={v=>v!==null&&propose([v,value[1]])} min={0} max={100} disabled={mode==='disabled'} readOnly={mode==='readonly'}/>
<NumberField label="恢复数值" value={value[1]} onValueChange={v=>v!==null&&propose([value[0],v])} min={0} max={100} disabled={mode==='disabled'} readOnly={mode==='readonly'}/>
</Inline>
<Inline>
<Button variant="secondary" onClick={()=>setValue([80,20])}>注入非法阈值</Button>
<Button variant="secondary" onClick={()=>setValue([20,80])}>恢复有效阈值</Button>
</Inline>
<Text role="status">已接受：{value.join(' / ')}；{last}</Text>
</Stack>
</Surface>
</fieldset>
<Select label="扫描动态上限" value={max} onChange={e=>setMax(Number(e.target.value))}>
<option value={720}>720分钟</option>
<option value={240}>240分钟</option>
<option value={1440}>1440分钟</option>
</Select>
<Slider label="扫描周期" value={scan} onChange={setScan} max={max} step={5} getValueText={v=>v+'分钟'} marks={[{value:0,label:'0分钟'},{value:max/2,label:max/120+'小时'},{value:max,label:max/60+'小时'}]}/>
<NumberField label="扫描分钟" value={scan} onValueChange={v=>v!==null&&setScan(v)} min={0} max={1440} step={5}/>
</Stack>;}
const people:Choice[]=Array.from({length:12},(_,index)=>({value:'person-'+index,label:'合成成员 '+index,disabled:index===11}));
const departments:TreeNode[]=[{id:'org',label:'合成组织',selectable:false,children:[{id:'east',label:'东区',selectable:false,children:Array.from({length:12},(_,index)=>({id:'east-'+index,label:index===0?'研发':'部门 '+index}))},{id:'west',label:'西区',selectable:false,children:Array.from({length:12},(_,index)=>({id:'west-'+index,label:index===0?'研发':'部门 '+index,disabled:index===11}))}]}];
export function SelectionLifecycleGallery({tree=false}:{tree?:boolean}){const initial=tree?['east-0','west-0','missing','east-1']:['person-0','person-1'];const[value,setValue]=useState(initial),[confirmed,setConfirmed]=useState(initial),[query,setQuery]=useState(''),[open,setOpen]=useState(false),[closeCause,setCloseCause]=useState<Exclude<SelectionChangeReason,'open'>>(),[mode,setMode]=useState('normal'),[result,setResult]=useState('error'),[busy,setBusy]=useState(false),[attempts,setAttempts]=useState(0),[status,setStatus]=useState('尚未提交'),[finished,setFinished]=useState(0),[ignored,setIgnored]=useState(0),[expanded,setExpanded]=useState(['org','east','west']);const epoch=useRef(0),timers=useRef<ReturnType<typeof setTimeout>[]>([]);useEffect(()=>()=>{epoch.current++;timers.current.forEach(clearTimeout);},[]);
 const closed=(reason:SelectionChangeReason)=>{if(['unmount','disabled','programmatic'].includes(reason))return;if(reason==='cancel'||reason==='escape'){setValue(confirmed);setStatus('已取消草稿（'+reason+'）');return;}const token=++epoch.current,snapshot=[...value];setAttempts(n=>n+1);setBusy(true);setStatus('等待宿主保存（'+reason+'）');timers.current.push(setTimeout(()=>{setFinished(n=>n+1);if(token!==epoch.current){setIgnored(n=>n+1);return;}setBusy(false);if(result==='success'){setConfirmed(snapshot);setStatus('合成保存已确认');}else{if(!tree)setValue(confirmed);setStatus(result==='unknown'?'结果未知，尚未确认':tree?'保存失败，草稿保留':'保存失败，已回退确认值');}},400));};
 const changeOpen=(next:boolean,detail:{reason:SelectionChangeReason})=>{if(!next&&mode==='reject')return;setCloseCause(next?undefined:detail.reason==='open'?'programmatic':detail.reason);setOpen(next);};
 const flags={disabled:mode==='disabled'||busy,readOnly:mode==='readonly'};return <Stack>
<Text>选择仅改草稿；完成/Tab/外点退出后提交一次，Escape/取消撤销。受控拒绝关闭不提交；卸载/不可用不当作完成。{tree?'失败保留待重试草稿。':'失败回退最后确认值。'}均无真实写入。</Text>
<Inline>
<Select label="选择状态" value={mode} onChange={e=>setMode(e.target.value)}>
<option value="normal">普通</option>
<option value="reject">拒绝关闭</option>
<option value="readonly">只读</option>
<option value="disabled">禁用</option>
</Select>
<Select label="提交结果" value={result} onChange={e=>setResult(e.target.value)}>
<option value="error">失败</option>
<option value="success">明确成功</option>
<option value="unknown">未知</option>
</Select>
</Inline>
<Button variant="quiet">字段前目标</Button>
<label id="external-field-label" htmlFor={tree?'department-field':'permission-field'}>{tree?'部门范围':'成员范围'}</label>
<p id="selection-external">外部说明：仅合成目录。</p>{tree?<TreeSelect id="department-field" label="部门范围" presentation="dropdown" searchable query={query} onQueryChange={setQuery} multiple nodes={departments} value={value} onValueChange={setValue} expandedKeys={expanded} onExpandedChange={setExpanded} open={open} onOpenChange={changeOpen} closeReason={closeCause} onClose={closed} maxVisibleTags={2} inputProps={{'aria-describedby':'selection-external'}} validationError={status.startsWith('保存失败')?'请核对未保存草稿':undefined} {...flags}/>:<RemoteMultiSelect focusOnOpen id="permission-field" label="成员范围" query={query} onQueryChange={setQuery} options={people.filter(item=>item.label.includes(query))} value={value.map(key=>people.find(item=>item.value===key)??{value:key,label:'未提供的成员 ['+key+']'})} onValueChange={next=>setValue(next.map(item=>item.value))} open={open} onOpenChange={changeOpen} closeReason={closeCause} onClose={closed} maxVisibleTags={2} maxSelected={4} cancelLabel="取消选择" inputProps={{'aria-describedby':'selection-external',autoComplete:'off'}} validationError={status.startsWith('保存失败')?'请核对权限草稿':undefined} {...flags}/>}
 <Button variant="quiet">字段后目标</Button>
<Inline>
<Button variant="secondary" onClick={()=>{epoch.current++;setBusy(false);setValue(confirmed);setCloseCause(undefined);setOpen(true);setStatus('新会话，旧结果失效');}}>重开并使旧结果失效</Button>
<Button variant="secondary" onClick={()=>{epoch.current++;setBusy(false);const next=tree?['west-0','missing']:['person-3'];setValue(next);setConfirmed(next);setCloseCause('programmatic');setOpen(false);setStatus('已同步外部确认值');}}>同步外部值</Button>
</Inline>
<Text role="status">{status}；提交次数：{attempts}；草稿：{value.join('、')}；确认值：{confirmed.join('、')}；已到达结果：{finished}；已忽略：{ignored}</Text>
</Stack>;}
export function DataRowGallery(){const callerId=useRef<string|null>(null);const[revision,setRevision]=useState(1),[removed,setRemoved]=useState(false),[selected,setSelected]=useState<string[]>([]),[expanded,setExpanded]=useState<string[]>([]),[current,setCurrent]=useState<{id:string;name:string;revision:number}|null>(null),[copies,setCopies]=useState(0);const rows=[{id:'failed',name:'合成失败请求',revision},{id:'matched',name:'合成匹配记录',revision},{id:'locked',name:'不可激活记录',revision}].filter(row=>!removed||row.id!=='failed');return <Stack>
<Text id="table-context" as="h2" tabIndex={-1}>失败证据上下文</Text>
<Text>普通单元格点按与具名动作激活同一行；链接/复制/勾选/展开保持独立。匹配状态不表示选中。</Text>
<Button variant="secondary" onClick={()=>setRevision(n=>n+1)}>刷新行版本</Button>
<DataTable caption="合成请求记录" rows={rows} rowKey={row=>row.id} rowLabel={row=>row.name} selection={{keys:selected,onChange:setSelected}} expansion={{keys:expanded,onChange:setExpanded,renderDetail:row=>
<Text>{row.name}的只读摘要</Text>}} rowAction={{id:row=>'request-action-'+row.id,label:row=>'查看'+row.name,onActivate:row=>{callerId.current=row.id;setCurrent(row);},isDisabled:row=>row.id==='locked'}} rowPresentation={row=>row.id==='matched'?{tone:'match',status:'后端提供的搜索匹配'}:row.id==='failed'?{tone:'error',status:'读取失败，有错误证据'}:undefined} columns={[{key:'name',header:'名称',rowHeader:true,render:row=>row.name},{key:'rate',header:'命中率',headerDescription:'按当前已知采样计算，未知不补零。',headerHelp:{title:'命中率说明',rows:[{label:'已知',value:'12次'},{label:'缺口',value:'未知'}]},render:()=> '40%'},{key:'actions',header:'独立动作',render:row=>
<Inline>
<Button variant="quiet" onClick={()=>setCopies(n=>n+1)}>复制{row.name}</Button>
<ButtonLink href="#table" onClick={e=>e.preventDefault()}>只读来源</ButtonLink>
</Inline>}]}/>
<Text role="status">复制次数：{copies}；行revision：{revision}；选中：{selected.join('、')||'无'}</Text>
<Dialog title="行错误证据" open={Boolean(current)} onOpenChange={next=>{if(!next)setCurrent(null);}} returnFocus={()=>document.getElementById('request-action-'+callerId.current)??document.getElementById('table-context')}>
<Text>{current?.name}；激活revision：{current?.revision}</Text>
<Button variant="secondary" onClick={()=>setRemoved(true)}>移除原行</Button>
</Dialog>
</Stack>;}
