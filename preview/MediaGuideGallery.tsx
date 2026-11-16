import { useCallback, useId, useState } from 'react';
import { Button, Checkbox, Image, Inline, Select, Stack, Text, TextField, Tour } from '../components';
const good="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='360' height='180'%3E%3Crect width='360' height='180' fill='%23dce8d5'/%3E%3Cpath d='M60 150 180 30 300 150Z' fill='%23425c4b'/%3E%3C/svg%3E";
const bad='data:image/svg+xml,%3Csvg%20broken';

export function ImageResourceGallery() {
  const [src,setSrc]=useState<string|undefined>(good),[draft,setDraft]=useState(good);
  const apply=(value:string)=>{setDraft(value);setSrc(value||undefined);};
  return <Stack gap={4}><Text>缩略图与预览各自呈现真实浏览器资源状态；重试只重新读取当前URL，不解析业务资产协议。</Text><Inline gap={2}><Button variant="secondary" onClick={()=>apply(good)}>使用有效图片</Button><Button variant="secondary" onClick={()=>apply(bad)}>使用损坏图片</Button><Button variant="quiet" onClick={()=>apply('')}>移除图片来源</Button></Inline><TextField label="图片地址草稿" value={draft} onChange={event=>setDraft(event.target.value)} hint="点击应用才切换资源，避免每个字符都触发图片请求。"/><Button variant="secondary" onClick={()=>setSrc(draft.trim()||undefined)}>应用图片地址</Button><Image alt="示例图片" src={src} caption="Escape关闭预览；正在读取、失败与换源不冒充成功。"/></Stack>;
}

export function TargetTourGallery() {
  const prefix=useId();
  const [open,setOpen]=useState(false),[step,setStep]=useState(0),[mode,setMode]=useState('targeted'),[present,setPresent]=useState(true),[hidden,setHidden]=useState(false),[draft,setDraft]=useState('目标内输入保持'),[actions,setActions]=useState(0),[note,setNote]=useState('尚未开始');
  const target=useCallback(()=>document.getElementById(step===0?`${prefix}-input`:`${prefix}-action`),[prefix,step]);
  return <Stack gap={4}><Select label="引导方式" value={mode} onChange={event=>setMode(event.target.value)}><option value="targeted">关联真实目标</option><option value="legacy">原步骤说明层</option></Select><Inline gap={2}><Button onClick={()=>{setStep(0);setOpen(true);setNote('引导已打开，未保存进度');}}>开始引导</Button><Checkbox label="移除目标节点" checked={!present} onChange={event=>setPresent(!event.target.checked)}/><Checkbox label="隐藏目标节点" checked={hidden} onChange={event=>setHidden(event.target.checked)}/></Inline>
    <section style={{minHeight:180}}><h2>第一步目标</h2>{present?<TextField id={`${prefix}-input`} label="真实目标输入" value={draft} hidden={hidden} onChange={event=>setDraft(event.target.value)}/>:<Text>目标节点已移除。</Text>}</section>
    <section style={{minHeight:180}}><h2>第二步目标</h2>{present?<Button id={`${prefix}-action`} hidden={hidden} onClick={()=>setActions(value=>value+1)}>目标动作</Button>:<Text>目标节点已移除。</Text>}<Text>本地动作计数：{actions}</Text></section>
    <Text role="status">{note}</Text>
    {open&&<Tour title={step===0?'在真实输入中操作':'查看本地动作'} description={step===0?'转到目标后仍可编辑。说明层不会抢走输入焦点，也不替宿主推进步骤。':'操作按钮只更新本地计数，完成此步仍需显式选择。'} step={step} total={2} target={mode==='targeted'?target:undefined} onPrevious={()=>setStep(0)} onNext={()=>setStep(1)} onClose={()=>{setOpen(false);setNote('引导已关闭，没有保存进度。');}} onTargetMissing={reason=>setNote(reason==='missing'?'目标未找到，未自动跳步。':'目标暂时隐藏，未自动跳步。')} onTargetRetry={()=>{setPresent(true);setHidden(false);setNote('宿主已恢复目标，未自动前进。');}}/>}
  </Stack>;
}
