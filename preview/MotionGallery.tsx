import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Checkbox, Dialog, Drawer, Disclosure, Icon, Logo, Menu, Popover, SegmentedControl, Select, Skeleton, Stack, Steps, Switch, Tabs, Text, TextField, Toast, Tooltip } from '../components/index';
import './motion.css';
import './brand-assembly.css';

const recipes = [
  ['loading', '加载 → 内容', '180ms', '骨架占位 → 内容就绪 → 原位淡入', '展台候选'],
  ['result', '操作 → 结果', '120ms', '等待反馈 → 合成成功 → 图标与文字淡入', '展台候选'],
  ['popover', '气泡 · 四向展开', '160ms / 3px', '触发点 → 按最终方向展开 → Escape关闭', '方向候选'],
  ['menu', '菜单 · 从触发点展开', '160ms / 3px', '操作入口 → 菜单展开 → 选择或Escape', '方向候选'],
  ['dialog', '弹窗 · 聚焦任务', '160ms', '原位按钮 → 模态淡入 → 关闭并归还焦点', '现有组件'],
  ['disclosure', '折叠 · 连续的高度', '200ms', '收起 → 高度展开 → 可点击标题反向', '现有组件'],
  ['selection', '切换 · 稳定的位置', '120 / 180ms', '默认选项 → 指示与滑块切换 → 保留内容', '现有组件'],
  ['toast', '通知 · 轻量回应', '180ms', '静态占位 → 通知进入 → 手动关闭', '现有组件'],
  ['tooltip', '提示 · 即看即走', '160ms', '播放或悬停 → 提示出现 → Escape关闭', '现有组件'],
  ['drawer', '抽屉 · 保留上下文', '160ms / 3px', '入口 → 右侧详情 → Escape 返回入口', '现有组件'],
  ['steps', '步骤 · 验证后推进', '180ms / 3px', '模拟本步完成 → 下一步进入 → 保持静止', '现有组件'],
  ['brand', '品牌 · 旋转变形归位', '880ms / 三块错峰', '三块旋转压缩 → 展开闭合 → 定稿标志静止', '品牌候选'],
] as const;
type Kind = typeof recipes[number][0];
type Side = 'top' | 'right' | 'bottom' | 'left';

// Restart only visual animations: never remount the modal or replay a business action.
function replayModal(button: HTMLButtonElement) {
  const dialog = button.closest('.rhine-dialog');
  const overlay = dialog?.parentElement?.querySelector('.rhine-overlay');
  for (const element of [dialog, overlay]) {
    if (!element) continue;
    for (const animation of element.getAnimations()) { animation.currentTime = 0; animation.play(); }
  }
}

function Scene({ kind, active, side }: { kind: Kind; active: boolean; side: Side }) {
  const [started, setStarted] = useState(false), [done, setDone] = useState(false);
  const [open, setOpen] = useState(false), [selected, setSelected] = useState('before'), [enabled, setEnabled] = useState(false);
  const [compact, setCompact] = useState(false);
  const disclosure = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (kind !== 'popover' && kind !== 'menu') return;
    const media = window.matchMedia?.('(max-width:759px)');
    if (!media) return;
    const update = () => setCompact(media.matches); update();
    media.addEventListener('change', update); return () => media.removeEventListener('change', update);
  }, [kind]);
  const preferredSide = compact && (side === 'left' || side === 'right') ? 'bottom' : side;
  useEffect(() => {
    if (!active) return;
    let second = 0; let timer: ReturnType<typeof setTimeout> | undefined;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => {
      setStarted(true); setOpen(true); setSelected('after'); setEnabled(true);
      if (kind === 'loading' || kind === 'result') timer = setTimeout(() => setDone(true), 700);
    }); });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); clearTimeout(timer); };
  }, [active, kind]);
  useEffect(() => { if (started && kind === 'disclosure') disclosure.current?.querySelector('summary')?.click(); }, [started, kind]);

  if (kind === 'loading') return <div className="ds-motion-content" aria-busy={started && !done}>
    {done ? <div className="ds-content-reveal"><Text variant="heading">研究工作区</Text><Text tone="muted">内容已准备好，阅读位置保持稳定。</Text><Badge tone="success">读取完成 · 演示</Badge></div> : <div className={started ? '' : 'ds-still'}><Skeleton lines={3} label="加载占位示例" /></div>}
  </div>;
  if (kind === 'result') return <div className="ds-result-demo"><Button disabled={!started || done} busy={started && !done} busyLabel="演示处理中">保存示例</Button><div className="ds-result-slot" role="status">{done ? <span className="ds-result-reveal"><Icon name="check" /> 已完成 · 演示</span> : <Text variant="caption" tone="muted">{started ? '等待合成结果…' : '等待播放'}</Text>}</div></div>;
  if (kind === 'popover') return <Popover open={open} onOpenChange={setOpen} side={preferredSide} title="方向感知气泡" trigger={<Button variant="secondary">查看气泡</Button>}><Text>方向跟随实际位置。窄窗左右方向改为上下展开。</Text></Popover>;
  if (kind === 'menu') return <Menu open={open} onOpenChange={setOpen} side={preferredSide} label="动效菜单" trigger={<Button variant="secondary">打开动效菜单</Button>} items={[{id:'view',label:'查看示例',onSelect:()=>{}},{id:'disabled',label:'暂不可用',disabled:true,onSelect:()=>{}},{id:'close',label:'结束演示',onSelect:()=>{}}]} />;
  if (kind === 'steps') return <Steps current={started ? 1 : 0} items={[{id:'input',label:'输入信息'},{id:'verify',label:'核对配置'},{id:'done',label:'完成任务'}]}/>;
  if (kind === 'drawer') return <Drawer open={open} onOpenChange={setOpen} title="抽屉动效示例" description="详情由右侧轻入；重播只重启动画，输入和焦点不变。" trigger={<Button variant="secondary">打开动效抽屉</Button>}><Stack><Text>按 Escape 关闭后回到入口。</Text><TextField label="重播保留输入" placeholder="输入演示文字后重播"/><Button variant="secondary" onClick={event=>replayModal(event.currentTarget)}>重播抽屉入场</Button></Stack></Drawer>;
  if (kind === 'dialog') return <Dialog open={open} onOpenChange={setOpen} title="弹窗动效示例" description="文字保持原尺寸；重播仅重新播放淡入，不重建弹窗或移动焦点。" trigger={<Button variant="secondary">打开动效弹窗</Button>}><Stack><Text>按 Escape 关闭，焦点回到入口。</Text><Button variant="secondary" onClick={event=>replayModal(event.currentTarget)}>重播弹窗入场</Button></Stack></Dialog>;
  if (kind === 'disclosure') return <div ref={disclosure} className="ds-motion-fill"><Disclosure title="展开动效说明"><Text>内容沿高度展开，文字保持原尺寸。</Text><Text tone="muted" variant="caption">反复点击标题可观察中途反向。</Text></Disclosure></div>;
  if (kind === 'selection') return <Stack className="ds-motion-fill"><Switch label="显示辅助信息" checked={enabled} onCheckedChange={setEnabled}/><Tabs label="动效切换示例" value={selected} onValueChange={setSelected} items={[{value:'before',label:'概览',content:<Text>默认阅读内容。</Text>},{value:'after',label:'详情',content:<Text>选中状态即时更新，内容轻轻进入。</Text>}]} /></Stack>;
  if (kind === 'toast') return <div className="ds-motion-fill">{open ? <Toast open onOpenChange={setOpen} title="演示已完成" description="这里保持显示，方便比较动画。" duration={0}/> : <Text tone="muted" variant="caption">通知将在这里出现</Text>}</div>;
  if (kind === 'tooltip') return <Tooltip open={open} onOpenChange={setOpen} content="说明只在需要时出现；不放必要操作。"><Button variant="secondary">悬停或聚焦这里</Button></Tooltip>;
  return <Logo key={String(started)} size={104} animate={started} className="ds-brand-assembly" />;
}

function MotionCard({ recipe, slow, reduced }: { recipe: typeof recipes[number]; slow: boolean; reduced: boolean }) {
  const [generation, setGeneration] = useState(0), [active, setActive] = useState(false), [still, setStill] = useState(false), [side, setSide] = useState<Side>('bottom');
  const [kind, title, duration, flow, status] = recipe;
  const run = () => { setGeneration(value=>value+1); setActive(true); };
  return <article className="rhine-theme ds-motion-card" aria-label={title} data-kind={kind} data-slow={slow} data-rhine-motion={reduced || still ? 'reduced' : 'system'}>
    <header><Text variant="code">{duration}</Text><Badge>{status}</Badge></header>
    <div className="ds-motion-stage"><Scene key={generation} kind={kind} active={active} side={side}/></div>
    <div className="ds-motion-description"><h3>{title}</h3><Text variant="caption" tone="muted">{flow}</Text></div>
    {(kind === 'popover' || kind === 'menu') && <Select label={`${title}方向`} hint="窄窗优先上下展开，方向随最终位置调整。" value={side} onChange={event=>setSide(event.target.value as Side)}><option value="bottom">下方</option><option value="top">上方</option><option value="left">左侧</option><option value="right">右侧</option></Select>}
    <div className="ds-motion-buttons"><Button variant="primary" aria-label={`播放${title}`} onClick={run}>播放</Button><Button variant="secondary" aria-label={`重播${title}`} disabled={!active} onClick={run}>重播</Button><Button variant="quiet" aria-label={`复位${title}`} onClick={()=>{setGeneration(value=>value+1);setActive(false);}}>复位</Button></div>
    <Checkbox label="此例减少动态" checked={still} onChange={event=>setStill(event.target.checked)}/>
  </article>;
}

export function MotionGallery({ reduced }: { reduced: boolean }) {
  const [speed, setSpeed] = useState('normal');
  return <section id="motion" className="ds-motion-lab"><div className="ds-section-title"><span>MOTION LAB</span><h2>按下播放，感受变化。</h2></div>
    <div className="ds-motion-toolbar"><div><Text>12 组可重播示例 · 现有组件与新动效候选</Text><Text variant="caption" tone="muted">播放只改变本地合成状态。浮层按 Escape 关闭；慢放只延长视觉过渡，减少动态始终优先。</Text></div><SegmentedControl label="动效播放速度" value={speed} onValueChange={setSpeed} items={[{value:'normal',label:'原速'},{value:'slow',label:'4 倍慢放'}]}/></div>
    <div className="ds-motion-grid">{recipes.map(recipe=><MotionCard key={recipe[0]} recipe={recipe} slow={speed==='slow'} reduced={reduced}/>)}</div>
  </section>;
}
