import { useEffect, useState } from 'react';
import { AppShell, Button, Dialog, Inline, Link, SearchField, Stack, Tabs, Text, TextField } from '../components';
import { ThemeProvider, themes, useTheme, type ThemeName } from '../components/theme';

export function NeutralGallery() {
  const [open, setOpen] = useState(true), [query, setQuery] = useState(''), [result, setResult] = useState('尚未搜索');
  const [tab, setTab] = useState('draft'), [draft, setDraft] = useState('合成工作区'), [error, setError] = useState(false);
  const { theme, setTheme } = useTheme();
  return <Stack gap={4}><Text as="h2" variant="section">中性轻量工作区</Text><Text tone="muted">白色正文、浅灰侧栏和黑灰操作。数据均为合成；搜索与保存只演示本地状态。</Text>
    <AppShell layout="single" style={{ height: 620 }} label="中性组件样例" navigation={{ label: '样例导航', open, onOpenChange: setOpen, content: <Stack gap={3}><Text as="h3" variant="heading">工作区</Text><Button variant="quiet">全部记录</Button><Link href="#neutral">阅读指南</Link></Stack> }} header={<Text>合成项目</Text>}>
      <Stack gap={4}><SearchField label="搜索记录" value={query} onValueChange={setQuery} onSearch={value => setResult(value ? `没有与“${value}”匹配的合成记录` : '显示全部合成记录')} /><Text role="status">{result}</Text>
        <Tabs label="记录内容" value={tab} onValueChange={setTab} items={[
          { value: 'draft', label: '编辑', content: <Stack gap={3}><TextField label="记录名称" value={draft} onChange={event => setDraft(event.target.value)} error={error ? '保存失败，草稿已保留，请重试。' : undefined} /><TextField label="锁定字段" value="仅供查看" disabled /><Inline gap={2}><Button onClick={() => setError(true)}>保存示例</Button><Button variant="secondary" disabled>暂不可用</Button><Button busy busyLabel="等待示例">等待示例</Button></Inline></Stack> },
          { value: 'details', label: '详情', content: <Text>长记录说明保留换行与完整内容。未知进度不代表完成，等待核对时仍可返回编辑草稿。</Text> },
          { value: 'locked', label: '不可用', disabled: true, content: null },
        ]} />
        <Dialog trigger={<Button variant="secondary">打开外观设置</Button>} title="外观设置" description="切换主题保留弹窗、草稿和当前操作。"><Stack gap={3}><TextField label="弹窗草稿" defaultValue="未保存的合成说明" /><Inline gap={2}>{themes.map(item => <Button key={item.name} variant={theme === item.name ? 'primary' : 'quiet'} onClick={() => setTheme(item.name)}>{item.label}</Button>)}</Inline><Link href="#neutral">查看中性主题说明</Link></Stack></Dialog>
      </Stack>
    </AppShell>
  </Stack>;
}

export function NeutralFixture() {
  const params = new URLSearchParams(location.search), zoom = Number(params.get('zoom')) || 1;
  useEffect(() => { document.documentElement.style.zoom = String(zoom); return () => { document.documentElement.style.zoom = ''; }; }, [zoom]);
  return <ThemeProvider defaultTheme={(params.get('theme') || 'neutral') as ThemeName} data-rhine-motion={params.get('motion') === 'manual' ? 'reduced' : undefined}><div style={{ padding: 16 }}><NeutralGallery /></div></ThemeProvider>;
}
