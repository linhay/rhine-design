import { useEffect, useState } from 'react';
import { Badge, Button, Checkbox, DataTable, Dialog, Grid, Inline, Link, Notice, Select, Stack, Surface, Switch, Text, TextField, ThemePicker } from '../components';
import { ThemeProvider, useTheme, type ThemeName } from '../components/theme';

const records = [
  { id: '01', title: '夜间工作区的阅读笔记', status: '已整理', date: '11 月 02 日' },
  { id: '02', title: '组件状态与错误恢复的观察记录', status: '待复核', date: '11 月 01 日' },
  { id: '03', title: '一条较长的合成记录：保留上下文，方便下次继续阅读与补充', status: '待复核', date: '10 月 31 日' },
];

/** Real public components with local, synthetic state; the host owns the theme. */
export function GraphiteGallery() {
  const { theme, setTheme } = useTheme();
  const [draft, setDraft] = useState('夜间研究工作区'), [save, setSave] = useState('idle');
  const [notify, setNotify] = useState(true), [selected, setSelected] = useState(false);
  const [tableState, setTableState] = useState('normal');
  return <Stack gap={6} className="compact-gallery">
    <Stack gap={3}><Inline><Badge>工作区外观</Badge><Text tone="muted" variant="caption">合成资料 · 仅演示本地状态</Text></Inline>
      <Text as="h1" variant="title">安静地，继续工作。</Text>
      <Text tone="muted">石墨灰区分层次，低饱和绿标记操作。设置、记录与正文使用同一套组件。</Text>
      {theme !== 'graphite' && <Button onClick={() => setTheme('graphite')}>应用石墨夜间主题</Button>}
    </Stack>
    <Grid minWidth={320} gap={6}>
      <Surface><Stack gap={4}>
        <Text as="h2" variant="section">工作区设置</Text>
        <TextField label="工作区名称" value={draft} onChange={event => { setDraft(event.target.value); setSave('idle'); }} error={save === 'error' ? '暂时无法保存，草稿已保留。请重试。' : undefined} hint="先确认名称，再保存本次修改。" />
        <Switch label="接收整理完成提醒" checked={notify} onCheckedChange={setNotify} />
        <Inline><Button busy={save === 'busy'} busyLabel="等待保存" onClick={() => setSave(save === 'error' ? 'saved' : 'error')}>{save === 'error' ? '重试保存' : '保存设置'}</Button>
          <Button variant="secondary" disabled>撤销已同步修改</Button>
          <Button variant="quiet" onClick={() => setSave(save === 'busy' ? 'idle' : 'busy')}>{save === 'busy' ? '取消等待' : '模拟等待'}</Button></Inline>
        {save === 'saved' && <Notice tone="success" title="示例已保存">合成草稿仍保留在当前页面。</Notice>}
        <Dialog trigger={<Button variant="secondary">调整工作区外观</Button>} title="工作区外观" description="切换主题后，弹窗和未保存的草稿继续保留。"><Stack gap={4}><TextField label="外观备注" defaultValue="下次继续整理" /><ThemePicker value={theme} onValueChange={setTheme} /></Stack></Dialog>
      </Stack></Surface>
      <Surface><Stack gap={4}>
        <Inline><Text as="h2" variant="section">阅读片段</Text><Badge tone="success">已归档</Badge></Inline>
        <Text variant="caption" tone="muted">设计笔记 / 约 1 分钟</Text>
        <Text>夜间工作区应该让正文、辅助说明与操作保持清晰。表面之间的细微差别负责划分区域，焦点与选中标记帮助我们找到下一步。</Text>
        <Text>状态不只由颜色表达。等待时仍能取消，出错后可以重试，长标题能够完整换行。离开一个弹窗，也应回到刚才的操作位置。</Text>
        <Stack gap={2}><Checkbox label="加入稍后阅读" checked={selected} onChange={event => setSelected(event.target.checked)} /><Text variant="caption" tone="muted">{selected ? '已加入本地阅读列表，可再次取消。' : '保留这段合成笔记，稍后继续。'}</Text></Stack>
        <Link href="#typography">查看文字与排版样例</Link>
      </Stack></Surface>
    </Grid>
    <Surface><Stack gap={4}>
      <Inline><Text as="h2" variant="section">最近记录</Text><Badge>{tableState === 'empty' ? 0 : records.length} 条记录</Badge></Inline>
      <Select label="记录列表状态" value={tableState} onChange={event => setTableState(event.target.value)}><option value="normal">正常</option><option value="loading">加载中</option><option value="error">读取失败</option><option value="empty">暂无记录</option></Select>
      <DataTable caption="合成研究记录" rows={tableState === 'empty' ? [] : records} rowKey={row => row.id} rowLabel={row => row.title}
        columns={[{ key: 'title', header: '记录', rowHeader: true, render: row => row.title }, { key: 'status', header: '状态', render: row => <Badge tone={row.status === '已整理' ? 'success' : 'warning'}>{row.status}</Badge> }, { key: 'date', header: '最近更新', render: row => row.date }]}
        loading={tableState === 'loading'} error={tableState === 'error' ? '暂时无法读取合成记录，请重试。' : undefined} onRetry={() => setTableState('normal')} />
    </Stack></Surface>
  </Stack>;
}

export function GraphiteFixture() {
  const params = new URLSearchParams(location.search), zoom = Number(params.get('zoom')) || 1;
  useEffect(() => { document.documentElement.style.zoom = String(zoom); return () => { document.documentElement.style.zoom = ''; }; }, [zoom]);
  return <ThemeProvider defaultTheme={(params.get('theme') || 'graphite') as ThemeName} data-rhine-motion={params.get('motion') === 'manual' ? 'reduced' : undefined}><div style={{ padding: 16 }}><GraphiteGallery /></div></ThemeProvider>;
}
