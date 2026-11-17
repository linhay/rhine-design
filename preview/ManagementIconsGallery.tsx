import { useState } from 'react';
import { Button, ButtonLink, Icon, IconButton, Menu, Notice, PlatformMark, Select, Stack, Inline, Grid, Surface, Text, TextField, iconNames, type IconName, type PlatformName } from '../components';
export function ManagementIconsGallery() {
  const [state,setState]=useState('normal'),[name,setName]=useState('download'),[count,setCount]=useState(0);
  const busy=state==='busy',disabled=state==='disabled';
  return <Stack gap={4}>
    <Text>一般动作图标与平台标记是两套明确入口；名称来自公开只读目录，不提供Ant名称别名。</Text>
    <Select label="图标动作状态" value={state} onChange={event=>setState(event.target.value)}><option value="normal">普通</option><option value="disabled">禁用</option><option value="busy">处理中</option></Select>
    <Inline><Button disabled={disabled} busy={busy} onClick={()=>setCount(n=>n+1)}><Icon name="export" size={16}/>导出演示</Button><IconButton icon="delete" label="移除演示" disabled={disabled} busy={busy} onClick={()=>setCount(n=>n+1)}/><Menu label="常用管理动作" trigger={<Button disabled={disabled} busy={busy} variant="secondary"><Icon name="moreVertical"/>管理动作</Button>} items={[{id:'edit',label:'编辑演示',icon:'edit',onSelect:()=>setCount(n=>n+1)},{id:'export',label:'导出菜单演示',icon:'export',onSelect:()=>setCount(n=>n+1)},{id:'delete',label:'暂不可移除',icon:'delete',disabled:true,onSelect:()=>setCount(n=>n+1)}]}/></Inline>
    <Text role="status">演示动作次数：{count}</Text>
    <TextField label="检查图标名称" value={name} onChange={event=>setName(event.target.value)}/>
    {iconNames.includes(name as IconName)?<Icon name={name as IconName} label="具名独立图标"/>:<Notice title="图标名称不受支持" tone="warning">宿主先用iconNames核对；直接把未知名称传给Icon会明确报错，不输出空路径。</Notice>}
    <Grid minWidth={150} gap={3}>{iconNames.map(icon=><Surface key={icon} padding="none"><Stack gap={2}><Text variant="caption">{icon}</Text><Inline><Icon name={icon} size={16} label={icon+' 16像素'}/><Icon name={icon} size={20} label={icon+' 20像素'}/><IconButton icon={icon} label={icon+' 演示动作'} onClick={()=>setCount(n=>n+1)}/></Inline></Stack></Surface>)}</Grid>
    <PlatformMarksExample/>
  </Stack>;
}
export function PlatformMarksExample() {
 const [state,setState]=useState('normal'),[platform,setPlatform]=useState('macos'),[count,setCount]=useState(0);
 return <Stack gap={3}>
  <Text as="h3" variant="heading">独立平台标记与下载入口</Text>
  <Text>Bootstrap Icons固定修订的MIT几何，完整许可随包保留；图标版权许可不授予商标权或背书。没有系统探测、远程资源加载或真实下载。</Text>
  <Select label="平台下载状态" value={state} onChange={event=>setState(event.target.value)}><option value="normal">普通</option><option value="disabled">禁用</option><option value="busy">处理中</option></Select>
  <Inline>{(['macos','windows'] as const).map(value=><ButtonLink key={value} href="#icon" variant="secondary" disabled={state==='disabled'} busy={state==='busy'} busyLabel={'正在准备'+(value==='macos'?'macOS':'Windows')} onClick={event=>{event.preventDefault();setCount(n=>n+1);}}><PlatformMark platform={value} size={20}/><span>下载 {value==='macos'?'macOS':'Windows'} 版本</span></ButtonLink>)}</Inline>
  <Inline>{(['macos','windows'] as const).map(value=><span key={value}><PlatformMark platform={value} size={16}/><PlatformMark platform={value} size={20} decorative={false}/></span>)}</Inline>
  <Select label="未知平台后备" value={platform} onChange={event=>setPlatform(event.target.value)}><option value="macos">macOS</option><option value="windows">Windows</option><option value="unsupported">未支持的输入</option></Select><PlatformMark platform={platform as PlatformName}/>
  <Text role="status">模拟下载动作：{count} 次；本例不提供安装包。</Text>
 </Stack>;
}
