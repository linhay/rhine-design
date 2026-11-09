import { useEffect, useRef, useState } from 'react';
import { Button, Checkbox, ResponsiveActions, Select, Stack, Text, TextField, Toolbar, type ResponsiveAction } from '../components';
import { ThemeProvider, type ThemeName } from '../components/theme';

export function ResponsiveActionsGallery(){
 const [width,setWidth]=useState(680),[long,setLong]=useState(false),[permission,setPermission]=useState(true),[disabled,setDisabled]=useState(false),[busy,setBusy]=useState(false),[font,setFont]=useState('default'),[mounted,setMounted]=useState(true),[empty,setEmpty]=useState(false);
 const [last,setLast]=useState('尚未执行动作'),[count,setCount]=useState(0),[custom,setCustom]=useState('刷新');
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null),pending=useRef(false);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 const run=(name:string)=>{setLast(name);setCount(value=>value+1);};
 const refresh=()=>{if(pending.current)return;pending.current=true;setBusy(true);run('正在刷新');timer.current=setTimeout(()=>{timer.current=null;pending.current=false;setBusy(false);setLast('刷新完成');},700);};
 const items:ResponsiveAction[]=[
  {id:'refresh',label:long?'刷新所有合成对象与长期协作计划 Refresh all synthetic records':custom || '刷新',icon:'refresh',onSelect:refresh,busy},
  {id:'copy',label:long?'复制跨团队完整配置 Copy complete configuration':'复制',icon:'copy',onSelect:()=>run('已复制合成配置'),disabled},
  {id:'details',label:long?'打开详细信息与变更记录 Open detailed history':'详情',icon:'info',onSelect:()=>run('已查看合成详情')},
  {id:'manage',label:long?'管理授权对象与访问权限 Manage access permissions':'管理',icon:'settings',onSelect:()=>run('已打开合成管理'),hidden:!permission},
 ];
 return <Stack gap={3}>
  <Text as="h2" variant="section">容器自适应操作区</Text>
  <Text tone="muted">合成示例；实际容器放不下时整组依次收为图标、更多菜单。更新信息属于内容区。</Text>
  <Select label="动作容器宽度" value={String(width)} onChange={e=>setWidth(Number(e.target.value))}>{[680,440,240,160,56].map(value=><option key={value} value={value}>{value}px</option>)}</Select>
  <TextField label="刷新动作文字" value={custom} onChange={e=>setCustom(e.target.value)}/>
  <Select label="动作字体" value={font} onChange={e=>setFont(e.target.value)}><option value="default">主题默认</option><option value="mono">等宽字体</option></Select>
  <Checkbox label="长动作与多语言" checked={long} onChange={e=>setLong(e.target.checked)}/>
  <Checkbox label="有管理权限" checked={permission} onChange={e=>setPermission(e.target.checked)}/>
  <Checkbox label="禁用复制" checked={disabled} onChange={e=>setDisabled(e.target.checked)}/>
  <Checkbox label="无可用动作" checked={empty} onChange={e=>setEmpty(e.target.checked)}/>
  <Checkbox label="挂载自适应动作" checked={mounted} onChange={e=>setMounted(e.target.checked)}/>
  <Toolbar title="合成对象列表"/>
  <div data-action-container style={{width,maxWidth:'100%',minWidth:44,...(font==='mono'?{'--rhine-font':'monospace'}:{})}}>
   {mounted && <ResponsiveActions label="对象操作" items={empty?[]:items}/>}
  </div>
  <Button variant="secondary" onClick={()=>run('离开操作区')}>操作区之后</Button>
  <Text role="status" aria-label="动作结果">{last} · 执行 {count} 次</Text>
 </Stack>;
}
export function ResponsiveActionsFixture(){
 const params=new URLSearchParams(location.search),zoom=Number(params.get('zoom'))||1;
 useEffect(()=>{document.documentElement.style.zoom=String(zoom);return()=>{document.documentElement.style.zoom='';};},[zoom]);
 return <ThemeProvider theme={(params.get('theme')||'rhine') as ThemeName} data-rhine-motion={params.get('motion')||'system'}><div dir={params.get('dir')==='rtl'?'rtl':'ltr'} style={{padding:12}}><ResponsiveActionsGallery/></div></ThemeProvider>;
}
