import { useState } from 'react';
import { AppShell, Background, Button, Checkbox, Dialog, EmptyState, Notice, Select, SideNav, Skeleton, Stack, Surface, TextField, type AppShellProps } from '../components';
import './extensions.css';

const longName = '非常长的工作区名称与跨区域协作资料—Workspace-2026-archive';

function StateControl({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <Select label="演示状态" value={value} onChange={event => onChange(event.target.value)}><option value="ready">默认</option><option value="loading">加载 / 保留旧数据</option><option value="error">失败</option><option value="empty">空内容</option><option value="disabled">禁用</option></Select>;
}

export function ShellGallery() {
  const [layout, setLayout] = useState<AppShellProps['layout']>('double-left');
  const [navOpen, setNavOpen] = useState(true), [secondaryOpen, setSecondaryOpen] = useState(true);
  const [current, setCurrent] = useState('inbox'), [draft, setDraft] = useState('主题切换和侧栏折叠会保留这段内容。');
  const [plain, setPlain] = useState(true), [state, setState] = useState('ready');
  return <section><div className="ds-section-title"><span>LAYOUT</span><h2>画布与应用外壳</h2></div>
    <p className="ds-caption">单侧栏适合简单工具；双左栏适合目录与列表；左右栏适合编辑器与检查器。可用宽度不足 1120px 时次栏转抽屉，不足 760px 时全局导航也转抽屉。正文始终保留。</p>
    <div className="ds-extension-controls"><Select label="布局方案" value={layout} onChange={event => setLayout(event.target.value as AppShellProps['layout'])}><option value="single">单侧栏</option><option value="double-left">双左侧栏</option><option value="left-right">左右侧栏</option></Select><Checkbox label="纯色背景" checked={plain} onChange={event => setPlain(event.target.checked)} /><StateControl value={state} onChange={setState} /></div>
    <div className="ds-shell-stage"><AppShell layout={layout} decoration={plain ? 'none' : 'theme'}
      navigation={{ label: '全局导航', open: navOpen, onOpenChange: setNavOpen, content: <SideNav aria-label="应用导航" currentId={current} groups={[{ label: '工作空间', items: [{ id: 'inbox', label: '收件箱', href: '#app-shell' }, { id: 'archive', label: longName, href: '#app-shell' }] }]} onNavigate={(item, event) => { event.preventDefault(); setCurrent(item.id); }} /> }}
      secondary={{ label: layout === 'left-right' ? '辅助详情' : '上下文目录', open: secondaryOpen, onOpenChange: setSecondaryOpen, content: <Stack gap={4}><strong>{current === 'inbox' ? '收件箱' : longName}</strong>{state === 'loading' ? <Skeleton label="目录加载中" /> : state === 'error' ? <Notice title="目录读取失败" tone="error">可以继续编辑正文。</Notice> : state === 'empty' ? <EmptyState title="目录暂无内容" description="选择其他项目或继续编辑正文。" /> : <><p>当前条目、所属目录和属性。</p><Button variant="secondary" disabled={state === 'disabled'}>上下文操作</Button></>}</Stack> }}
      header={<Dialog title="背景与浮层" description="浮层仍然挂载在唯一主题根；不受局部背景裁剪。" trigger={<Button>打开对话框</Button>}><TextField label="对话框输入" placeholder="试试 Tab 和 Escape" /></Dialog>}>
      <Stack gap={6}><div><p className="ds-kicker">CURRENT TASK / {current}</p><h3>同一主题，独立正文背景</h3><p>正文默认使用纯色背景。关闭“纯色背景”可显式启用主题纹理；纸面主题保持纯净。</p></div>
        <Surface><Stack gap={4}><TextField label="正文草稿" value={draft} onChange={event => setDraft(event.target.value)} /><Button disabled={state === 'disabled'}>继续当前任务</Button></Stack></Surface>
        {Array.from({ length: 5 }, (_, i) => <Surface key={i}><h3>内容段落 {i + 1}</h3><p>滚动正文时顶部操作栏保持可达；每栏仅有一个滚动容器。Tab 可依次访问导航、正文与辅助详情。</p></Surface>)}
      </Stack>
    </AppShell></div>
    <div className="ds-extension-grid ds-gap-top">{(['canvas','content','sidebar'] as const).map(role => <Background key={role} roleTone={role} decoration={plain ? 'none' : 'theme'} className="ds-background-swatch"><strong>{role}</strong><Surface>Surface 始终提供不透明阅读表面。</Surface></Background>)}</div>
  </section>;
}
