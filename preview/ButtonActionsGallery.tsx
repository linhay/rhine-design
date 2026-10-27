import { useEffect, useRef, useState } from 'react';
import { Button, ConfirmDialog, Inline, Select, Stack, Surface, Text, Toolbar } from '../components';

export function ButtonActionsGallery() {
  const [width,setWidth]=useState('520'),[state,setState]=useState('normal');
  const [busy,setBusy]=useState<string|null>(null),[result,setResult]=useState('');
  const lock=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  const run=(id:string)=>{if(lock.current)return;lock.current=true;setBusy(id);setResult('');timer.current=setTimeout(()=>{setBusy(null);lock.current=false;setResult(`${id}：合成操作完成，未改变真实会话。`);},700)};
  return <section id="button-actions"><Stack gap={6}>
    <Toolbar title="动作语义与尺寸" description="层级和后果决定配色；大尺寸强调独立操作，不自动表示危险。">
      <Select label="按钮容器宽度" value={width} onChange={e=>setWidth(e.target.value)}>{['400','520','880'].map(v=><option key={v}>{v}</option>)}</Select>
      <Select label="按钮状态" value={state} onChange={e=>setState(e.target.value)}><option value="normal">正常</option><option value="disabled">禁用</option><option value="busy">处理中</option><option value="long">长标签</option></Select>
    </Toolbar>
    <div style={{width:`${width}px`,maxWidth:'100%'}} data-button-actions><Stack gap={6}>
      {(['standard','large'] as const).map(size=><Surface key={size}><Stack gap={3}><Text as="h3" variant="heading">{size==='standard'?'标准尺寸':'大尺寸 · 独立设置动作'}</Text><Inline gap={3}>
        <Button size={size} variant="primary" disabled={state==='disabled'} busy={state==='busy'||busy===`${size}退出登录`} onClick={()=>run(`${size}退出登录`)}>{state==='long'?'退出当前合成工作区并保留已确认的设置':'退出登录'}</Button>
        <Button size={size} variant="secondary" disabled={state==='disabled'} busy={state==='busy'||busy===`${size}断开连接`} onClick={()=>run(`${size}断开连接`)}>{state==='long'?'断开当前连接并保留可重新连接的配置':'断开连接'}</Button>
        <ConfirmDialog trigger={<Button size={size} variant="danger" disabled={state==='disabled'} busy={state==='busy'}>{state==='long'?'永久删除选中的合成记录且无法恢复':'删除记录'}</Button>} title="删除合成记录" description="这条合成记录将无法恢复。这里只演示确认，不删除真实数据。" confirmLabel="确认删除" danger onConfirm={()=>setResult('删除：合成确认完成，未删除真实数据。')} />
      </Inline><Text variant="caption">{size==='standard'?'14/22，至少44px，横内距16px':'16/24，至少52px，横内距24px'}。退出/断开可恢复，不自动使用危险色；删除明确提示不可恢复。</Text></Stack></Surface>)}
      <Surface><Stack gap={3}><Text as="h3" variant="heading">窄表单的独立全宽动作</Text><Button size="large" style={{width:'100%'}} onClick={()=>run('全宽退出')} busy={busy==='全宽退出'}>退出登录</Button><Text variant="caption">使用原生width，长文自然换行；不要给所有工具栏动作铺满宽度。</Text></Stack></Surface>
      <Text role="status">{result}</Text>
    </Stack></div>
  </Stack></section>;
}
