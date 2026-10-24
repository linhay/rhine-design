import { useState } from 'react';
import { Button, Dialog, Inline, Notice, Select, Skeleton, Stack, StatusTimelineList, Surface, Text, TimelineLegend, type StatusTimelineItem, type TimelineSegment } from '../components';

export function TimelineListGallery() {
  const [state, setState] = useState('ready');
  const segments: TimelineSegment[] = Array.from({ length: 96 }, (_, i) => ({
    id: String(i), label: `10/23 ${String(Math.floor(i / 4)).padStart(2, '0')}:${String(i % 4 * 15).padStart(2, '0')} · UTC+8`,
    status: i % 29 === 0 ? 'failed' : i % 17 === 0 ? 'degraded' : i % 13 === 0 ? 'recovered' : i % 7 === 0 ? 'unknown' : 'healthy',
  }));
  const items: StatusTimelineItem[] = state === 'empty' ? [] : ['资源 A', '资源 B'].map((title, i) => ({
    id: String(i), title: state === 'long' ? `${title} · 跨区域协作工作空间 / very-long-resource-name-without-a-break-2026` : title,
    summary: <>7 日剩余 <strong>{i ? '—' : '78%'}</strong></>,
    note: state === 'partial' ? '记录不完整，仅展示已确认的时段。' : undefined,
    timeline: state === 'unavailable' ? null : { startLabel: '10/23 00:00 · UTC+8', endLabel: '10/24 00:00 · UTC+8', segments, disabled: state === 'disabled' },
  }));
  const content = <Stack gap={3}>
    {state === 'loading' ? <Skeleton label="正在读取历史记录" lines={3} /> : <>
      {state === 'error' && <Notice tone="error" title="读取失败，保留上次记录">请重试或检查数据来源；旧记录不代表当前状态。</Notice>}
      <StatusTimelineList label="资源历史记录" items={items} />
    </>}
  </Stack>;
  return <Surface className="ds-gap-top"><Stack gap={4}>
    <Text as="h3" variant="section">多条历史记录</Text>
    <Text tone="muted">标题、摘要、分隔、紧凑时间条与详情统一组合；同一列表只展开一条详情。示例数据不连接任何服务。</Text>
    <Select label="历史列表状态" value={state} onChange={event => setState(event.target.value)}>
      <option value="ready">默认</option><option value="loading">首次加载</option><option value="error">读取失败 / 保留旧记录</option>
      <option value="empty">空列表</option><option value="unavailable">历史未知</option><option value="partial">不完整</option>
      <option value="disabled">禁用</option><option value="long">长名称</option>
    </Select>
    {content}<TimelineLegend />
    <Dialog title="资源范围" description="左侧操作，右侧查看当前范围的记录；纯演示，不保存设置。" trigger={<Button variant="secondary">在分栏弹窗中查看</Button>}
      sidePanel={closeButton => <Stack gap={4}><Inline style={{ justifyContent: 'space-between' }}><Text as="h3">资源 · {items.length}</Text>{closeButton}</Inline>{content}</Stack>}>
      <Text>同一组件也可嵌入侧栏；在两条时间轴间悬停或按 Tab，检查详情互斥与焦点。</Text>
    </Dialog>
  </Stack></Surface>;
}
