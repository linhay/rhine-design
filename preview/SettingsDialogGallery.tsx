import { useEffect, useRef, useState } from 'react';
import { Button, Dialog, EmptyState, Notice, Select, SideNav, Skeleton, Stack, Text, TextField, Tooltip } from '../components';
import { ThemeProvider, type ThemeName } from '../components/theme';

export function SettingsDialogGallery() {
  const [section, setSection] = useState('account'), [state, setState] = useState('normal');
  const [draft, setDraft] = useState('研究工作区'), [saved, setSaved] = useState('研究工作区');
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);
  const draftEdited = useRef(false);
  const save = async () => { const submitted = draft; draftEdited.current = false; setBusy(true); await new Promise(resolve => setTimeout(resolve, 300)); setSaved(submitted); if (!draftEdited.current) setDraft(submitted); setBusy(false); setMessage('已保存演示草稿'); };
  return <Stack gap={4}><Text as="h2" variant="section">设置导航对话框</Text><Text>窄导航与宽任务内容。这里只操作合成数据；切换栏目不会改变宿主地址。</Text>
    <TextField label="宿主查询" defaultValue="保留这条查询" />
    <Dialog title="设置" description="管理演示账号与公开项目" trigger={<Button>打开设置</Button>} open={open} onOpenChange={next => { setOpen(next); if (next) { draftEdited.current = false; setDraft(saved); setMessage(''); } }}
      navigation={<SideNav aria-label="设置导航" currentId={section} groups={[{ label: '偏好与管理', items: [{ id: 'account', label: '账号', href: '#account' }, { id: 'users', label: '用户管理与权限', href: '#users' }, { id: 'public', label: '公开项目', href: '#public' }] }]} onNavigate={(item, event) => { event.preventDefault(); setSection(item.id); }} />}>
      <Stack gap={4}>
        <Tooltip content="选择栏目以管理设置；保存后生效，取消仅丢弃未保存的修改。"><Button variant="quiet">设置帮助</Button></Tooltip>
        {section === 'account' && <><Text as="h3" variant="heading">账号</Text><TextField label="工作区名称" value={draft} onChange={event => { draftEdited.current = true; setDraft(event.target.value); }} /><Button busy={busy} onClick={save}>保存设置</Button><Button variant="secondary" onClick={() => { draftEdited.current = false; setDraft(saved); setMessage('已撤销未保存修改'); }}>取消草稿</Button></>}
        {section === 'users' && <><Text as="h3" variant="heading">用户管理</Text>{Array.from({length: 12}, (_, i) => <Stack key={i} gap={2}><Text>演示成员 {i + 1} · 长名称研究工作组</Text><Dialog trigger={<Button variant="secondary">编辑成员 {i + 1}</Button>} title={`编辑成员 ${i + 1}`} description="内层 Escape 只关闭当前编辑"><TextField label="成员备注" defaultValue="合成备注" /></Dialog></Stack>)}</>}
        {section === 'public' && <><Text as="h3" variant="heading">公开项目</Text><Select label="项目状态" value={state} onChange={event => setState(event.target.value)}><option value="normal">正常</option><option value="loading">加载</option><option value="error">失败</option><option value="empty">空态</option></Select>{state === 'loading' ? <Skeleton label="正在读取项目" /> : state === 'error' ? <Notice tone="error" title="项目读取失败" action={<Button onClick={() => setState('normal')}>重试</Button>} /> : state === 'empty' ? <EmptyState title="暂无公开项目" description="添加项目后会显示在这里。" /> : <TextField label="项目标题" defaultValue="公开研究计划" />}</>}
        {message && <Text role="status">{message}</Text>}
      </Stack>
    </Dialog>
    <Text>已保存名称：{saved}</Text>
  </Stack>;
}

export function SettingsDialogFixture() {
  const params = new URLSearchParams(location.search);
  const zoom = Number(params.get('zoom')) || 1;
  useEffect(() => { document.documentElement.style.zoom = String(zoom); return () => { document.documentElement.style.zoom = ''; }; }, [zoom]);
  return <ThemeProvider theme={(params.get('theme') || 'rhine') as ThemeName} data-rhine-motion="reduced"><div style={{padding:16}}><SettingsDialogGallery /></div></ThemeProvider>;
}
