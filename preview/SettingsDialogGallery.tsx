import { useEffect, useRef, useState } from 'react';
import { Button, Checkbox, Dialog, Drawer, EmptyState, Notice, RemoteMultiSelect, Select, SideNav, Skeleton, Stack, Text, TextField, type Choice } from '../components';
import { ThemeProvider, themes, useTheme, type ThemeName } from '../components/theme';
import './settings-dialog-gallery.css';

const members: Choice[] = Array.from({ length: 30 }, (_, i) => ({ value: `member-${i}`, label: `合成成员 ${i + 1}` }));
export function SettingsDialogGallery() {
  const { theme, setTheme } = useTheme();
  const [section, setSection] = useState('account'), [state, setState] = useState('normal');
  const [draft, setDraft] = useState('研究工作区'), [saved, setSaved] = useState('研究工作区');
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [open, setOpen] = useState(false), [longNav, setLongNav] = useState(false), [longActions, setLongActions] = useState(false);
  const [outcome, setOutcome] = useState('success'), [loadingSection, setLoadingSection] = useState(false);
  const [query, setQuery] = useState(''), [selected, setSelected] = useState<Choice[]>([]);
  const draftEdited = useRef(false), pending = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sectionTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { clearTimeout(saveTimer.current); clearTimeout(sectionTimer.current); }, []);
  const save = () => {
    if (pending.current) return;
    pending.current = true;
    const submitted = draft; draftEdited.current = false; setBusy(true); setMessage('');
    saveTimer.current = setTimeout(() => {
      if (outcome === 'success') { setSaved(submitted); if (!draftEdited.current) setDraft(submitted); setMessage('已保存演示草稿'); }
      else setMessage(outcome === 'conflict' ? '内容已更新，请核对后重新保存' : '保存失败，草稿已保留');
      pending.current = false; setBusy(false);
    }, 500);
  };
  const navigate = (id: string) => {
    clearTimeout(sectionTimer.current); setSection(id); setLoadingSection(id === 'async');
    if (id === 'async') sectionTimer.current = setTimeout(() => setLoadingSection(false), 500);
  };
  const items = [{ id: 'account', label: '账号', href: '#account' }, { id: 'users', label: '用户管理与权限', href: '#users' }, { id: 'public', label: '公开项目', href: '#public' }, { id: 'async', label: '异步栏目', href: '#async' }, ...(longNav ? Array.from({ length: 20 }, (_, i) => ({ id: `extra-${i}`, label: `扩展设置 ${i + 1} · 长栏目名称`, href: `#extra-${i}` })) : [])];
  return <Stack gap={4}><Text as="h2" variant="section">设置导航对话框</Text><Text>稳定窗口、独立正文滚动；使用合成数据。</Text>
    <TextField label="宿主查询" defaultValue="保留这条查询" />
    <Checkbox label="长导航" checked={longNav} onChange={event => setLongNav(event.target.checked)} />
    <Checkbox label="长操作文案" checked={longActions} onChange={event => setLongActions(event.target.checked)} />
    <Select label="保存结果" value={outcome} onChange={event => setOutcome(event.target.value)}><option value="success">成功</option><option value="error">失败</option><option value="conflict">冲突</option></Select>
    <Dialog title="设置" height={640} trigger={<Button>打开设置</Button>} open={open} onOpenChange={next => { setOpen(next); if (next) { draftEdited.current = false; setDraft(saved); setMessage(''); } }}
      footer={<>
        <Button variant="secondary" aria-label="撤销全部未保存的修改" disabled={busy} onClick={() => { draftEdited.current = false; setDraft(saved); setMessage('已撤销未保存修改'); }}><span className={longActions ? 'rhine-settings-action-full' : undefined}>{longActions ? '撤销全部未保存的修改' : '撤销'}</span>{longActions && <span className="rhine-settings-action-short">撤销</span>}</Button>
        <Button variant="secondary" aria-label="关闭设置" onClick={() => setOpen(false)}>关闭</Button>
        <Button busy={busy} aria-label="保存当前工作区设置" onClick={save}><span className={longActions ? 'rhine-settings-action-full' : undefined}>{longActions ? '保存当前工作区设置' : '保存'}</span>{longActions && <span className="rhine-settings-action-short">保存</span>}</Button>
      </>}
      navigation={<SideNav aria-label="设置导航" currentId={section} groups={[{ label: '偏好与管理', items }]} onNavigate={(item, event) => { event.preventDefault(); navigate(item.id); }} />}>
      <Stack gap={4}>
        {busy ? <Text role="status">正在保存</Text> : message ? <Notice tone={outcome !== 'success' && !message.startsWith('已撤销') ? 'error' : 'neutral'} title={message} /> : draft !== saved ? <Text role="status">有未保存的修改</Text> : null}
        {section === 'account' && <><Text as="h3" variant="heading">账号</Text><TextField label="工作区名称" value={draft} onChange={event => { draftEdited.current = true; setDraft(event.target.value); setMessage(''); }} />
          <Select label="界面主题" value={theme} onChange={event => setTheme(event.target.value as ThemeName)}>{themes.map(item => <option key={item.name} value={item.name}>{item.label}</option>)}</Select>
          <RemoteMultiSelect label="授权成员" query={query} onQueryChange={setQuery} value={selected} onValueChange={setSelected} options={members.filter(item => item.label.includes(query))} maxVisibleTags={2} />
        </>}
        {section === 'users' && <><Text as="h3" variant="heading">用户管理</Text>{Array.from({length: 30}, (_, i) => <Stack key={i} gap={2}><Text>演示成员 {i + 1} · 长名称研究工作组</Text><Dialog trigger={<Button variant="secondary">编辑成员 {i + 1}</Button>} title={`编辑成员 ${i + 1}`}><TextField label="成员备注" defaultValue="合成备注" /></Dialog></Stack>)}</>}
        {section === 'public' && <><Text as="h3" variant="heading">公开项目</Text><Select label="项目状态" value={state} onChange={event => setState(event.target.value)}><option value="normal">正常</option><option value="loading">加载</option><option value="error">失败</option><option value="empty">空态</option></Select>{state === 'loading' ? <Skeleton label="正在读取项目" /> : state === 'error' ? <Notice tone="error" title="项目读取失败" action={<Button onClick={() => setState('normal')}>重试</Button>} /> : state === 'empty' ? <EmptyState title="暂无公开项目" description="" /> : <TextField label="项目标题" defaultValue="公开研究计划" />}</>}
        {section === 'async' && (loadingSection ? <Skeleton label="正在读取栏目" /> : <Text>异步栏目已就绪</Text>)}
        {section.startsWith('extra-') && <Text>扩展栏目 {Number(section.slice(6)) + 1}</Text>}
      </Stack>
    </Dialog>
    <Text>已保存名称：{saved}</Text>
    <StableWorkspaceExample />
    <Drawer title="普通抽屉" trigger={<Button variant="secondary">普通抽屉示例</Button>}><TextField label="抽屉输入" /></Drawer>
    <Dialog title="辅助分栏" trigger={<Button variant="secondary">辅助分栏示例</Button>} sidePanel={<Text>辅助内容</Text>}><TextField label="分栏输入" /></Dialog>
    <Dialog title="有界普通表单" height={640} trigger={<Button variant="secondary">有界普通表单示例</Button>} footer={<Button>确认</Button>}><Stack>{Array.from({length:30}, (_,i)=><TextField key={i} label={`表单字段 ${i+1}`} />)}</Stack></Dialog>
    <Dialog title="自动高度操作区" trigger={<Button variant="secondary">自动高度操作区示例</Button>} footer={<>{Array.from({length:20}, (_,i)=><Button key={i}>长操作 {i+1}</Button>)}</>}><Text>短正文仍然可读。</Text></Dialog>
    <Dialog title="纯文本长正文" height={400} trigger={<Button variant="secondary">纯文本长正文示例</Button>} footer={<Button>阅读完成</Button>}><Stack>{Array.from({length:30}, (_,i)=><Text key={i}>合成说明第 {i+1} 段，仅用于键盘滚动验证。</Text>)}</Stack></Dialog>
    <Dialog title="短对话框" trigger={<Button variant="secondary">普通短弹窗</Button>}><TextField label="简短输入" /></Dialog>
  </Stack>;
}

export function SettingsDialogFixture() {
  const params = new URLSearchParams(location.search);
  const zoom = Number(params.get('zoom')) || 1;
  useEffect(() => { document.documentElement.style.zoom = String(zoom); return () => { document.documentElement.style.zoom = ''; }; }, [zoom]);
  return <ThemeProvider defaultTheme={(params.get('theme') || 'rhine') as ThemeName} data-rhine-motion={params.get('motion') || 'reduced'}><div style={{padding:16}}><SettingsDialogGallery /></div></ThemeProvider>;
}

// Layout example only: template ownership and persistence remain in the host.
function StableWorkspaceExample() {
  const [open, setOpen] = useState(false), [section, setSection] = useState('apply');
  const [state, setState] = useState('empty'), [draft, setDraft] = useState('合成模板');
  const [rows, setRows] = useState(0), [message, setMessage] = useState('');
  const items = [{id:'apply', label:'应用配置', href:'#apply'}, {id:'edit', label:'模板编辑', href:'#edit'}, {id:'other', label:'其他设置', href:'#other'}];
  return <>
    <Select label="工作区内容状态" value={state} onChange={e => setState(e.target.value)}><option value="empty">空模板</option><option value="eight">八行编辑</option><option value="loading">加载</option><option value="error">错误</option></Select>
    <Dialog title="配置工作区" height={760} open={open} onOpenChange={setOpen} trigger={<Button>打开稳定工作区</Button>}
      navigation={<SideNav aria-label="工作区栏目" currentId={section} groups={[{label:'配置',items}]} onNavigate={(item,e) => { e.preventDefault(); setSection(item.id); }} />}
      footer={<><Button variant="secondary" onClick={() => {setDraft('合成模板');setMessage('已撤销');}}>撤销</Button><Button variant="secondary" onClick={() => setOpen(false)}>关闭</Button><Button onClick={() => setMessage('已保存演示草稿')}>保存</Button></>}>
      <Stack gap={4}>
        {message && <Text role="status">{message}</Text>}
        {state === 'loading' ? <Skeleton label="正在读取配置" /> : state === 'error' ? <Notice tone="error" title="读取失败，草稿已保留" action={<Button onClick={() => setState('eight')}>重试</Button>} /> : section === 'edit' ? <>
          <TextField label="模板名称" value={draft} onChange={e => setDraft(e.target.value)} />
          {Array.from({length:state === 'eight' ? 8 : rows}, (_,i) => <TextField key={i} label={`编辑条目 ${i+1}`} defaultValue={`合成条目 ${i+1}`} />)}
          {state === 'empty' && rows === 0 && <EmptyState title="模板暂无规则" description="" />}
          <Button onClick={() => {setState('empty');setRows(n => n+1);}}>添加条目</Button>
        </> : section === 'apply' ? <EmptyState title="尚未选择模板" description="" /> : <Checkbox label="保留现有配置" defaultChecked />}
      </Stack>
    </Dialog>
  </>;
}
