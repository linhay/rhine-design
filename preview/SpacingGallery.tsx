import { useState } from 'react';
import { Button, DataTable, Grid, Inline, Notice, Select, Stack, Surface, Text, type Spacing } from '../components';
import './spacing.css';

const scale: Spacing[] = [1, 2, 3, 4, 6, 8, 12];
export function SpacingGallery() {
  const [state, setState] = useState('normal');
  const [selected, setSelected] = useState<string[]>(['research']);
  return <section id="spacing">
    <div className="ds-section-title"><span>SPACE</span><h2>间距与组合 · 让关系可见</h2></div>
    <Stack gap={6}>
      <Text tone="muted">同组紧、组间松。间距使用已有 token；gap 的数字是后缀，例如 gap=4 对应16px。</Text>
      <Surface><Stack gap={4}>{scale.map(space => <div className="ds-spacing-scale" key={space}><Text variant="code">space-{space}</Text><span className="ds-spacing-bar" style={{width:`var(--rhine-space-${space})`}} aria-hidden="true"/><Text numeric variant="caption">{space * 4}px</Text></div>)}</Stack></Surface>
      <Select label="卡片内容状态" value={state} onChange={event=>setState(event.target.value)}><option value="normal">默认</option><option value="loading">检查中</option><option value="error">读取失败</option><option value="long">长文案</option></Select>
      <Grid gap={6} minWidth={280}>
        <Stack gap={3}>
          <Text variant="caption" tone="muted">24px 内边距 · 8px 标题/说明 · 16px 内容/操作</Text>
          <Surface><Stack gap={4}>
            <Stack gap={2}><Text as="h3" variant="heading">应用更新</Text><Text tone="muted">{state==='long'?'当前版本已是最新。应用会在后台检查新版本，准备好后通知你；未完成的工作会保留，请在方便时安装。':state==='loading'?'正在检查新版本…':state==='error'?'暂时无法确认版本状态。':'当前版本已是最新。'}</Text></Stack>
            {state==='error'&&<Notice tone="error" title="检查更新失败">请确认网络连接后重试；已安装的版本仍可继续使用。</Notice>}
            <Inline gap={2}><Button variant="secondary" busy={state==='loading'} busyLabel="正在检查" onClick={()=>setState('loading')}>{state==='error'?'重试检查':'检查更新'}</Button>{state==='loading'&&<Button variant="quiet" onClick={()=>setState('normal')}>结束演示</Button>}</Inline>
          </Stack></Surface>
          <Text variant="caption" tone="muted">按钮仅改变合成状态；选择上方状态或结束演示复位，不联网检查更新。</Text>
        </Stack>
        <Surface><Stack gap={4}>
          <Stack gap={2}><Text as="h3" variant="heading">同一套组合，适用于不同内容</Text><Text tone="muted">换行只增加内容高度，不压缩间距。</Text></Stack>
          <Stack gap={3}><Text>标题 + 说明：Stack gap=2</Text><Text>内容 + 操作：Stack gap=4</Text><Text>按钮组：Inline gap=2</Text><Text>卡片之间：Grid / Stack gap=6</Text></Stack>
          <Text variant="caption" tone="muted">Surface只负责边界与内边距。避免父gap与子margin重复累加；不固定卡高，不为空白增加动效。</Text>
        </Stack></Surface>
      </Grid>
      <Stack gap={3}>
        <Text as="h3" variant="heading">纯表格 · 取消容器外围内距</Text>
        <Text variant="caption" tone="muted">Surface padding="none" 自 0.9.1 提供；表头和单元格保留原有间距。切换主题并勾选行，检查边界和文字。</Text>
        <Surface padding="none">
          <DataTable caption="示例部门用量" rows={[
            { id: 'research', name: '研发协作组', requests: 128 },
            { id: 'accessibility', name: '跨部门体验与可访问性协作小组', requests: 42 },
          ]} columns={[
            { key: 'name', header: '部门', render: row => row.name, rowHeader: true },
            { key: 'requests', header: '请求', render: row => row.requests, align: 'right' },
          ]} rowKey={row => row.id} rowLabel={row => row.name} selection={{ keys: selected, onChange: setSelected }} />
        </Surface>
      </Stack>
    </Stack>
  </section>;
}
