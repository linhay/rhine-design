import { useEffect, useState } from 'react';
import { Button, DateRangePicker, Inline, Menu, Popover, Select, Stack, Text, TextField, Tooltip } from '../components';
import { ThemeProvider, themes, type ThemeName } from '../components/theme';

export function OverlayBoundsFixture() {
  const query = new URLSearchParams(location.search);
  const theme = query.get('theme') as ThemeName || 'rhine';
  const zoom = Number(query.get('zoom')) || 1;
  const scope = query.get('scope') || 'document';
  const edge = query.get('edge') || 'bottom-right';
  const side = (query.get('side') || 'top') as 'top' | 'bottom' | 'left' | 'right';
  const [draft, setDraft] = useState('研究工作区');
  const [range, setRange] = useState({ start: '', end: '' });
  const [action, setAction] = useState('尚未操作');
  useEffect(() => {
    const previous = document.documentElement.style.zoom;
    document.documentElement.style.zoom = scope === 'document' ? String(zoom) : '1';
    return () => { document.documentElement.style.zoom = previous; };
  }, [scope, zoom]);
  const scale = scope === 'content' ? 1 : zoom;
  return <ThemeProvider theme={theme} data-rhine-motion="reduced" style={{ zoom: scope === 'theme' ? zoom : 1 }}>
    <div data-testid="overlay-bounds" style={{ display: 'grid', alignItems: edge.startsWith('top') ? 'start' : 'end', justifyItems: edge.endsWith('left') ? 'start' : 'end', padding: 12, width: `calc(100vw / ${scale})`, height: `calc(100dvh / ${scale})`, boxSizing: 'border-box' }}>
      <Stack gap={2} style={{ maxWidth: '100%', zoom: scope === 'content' ? zoom : 1 }}>
        <Popover title="工作区与日期详情" side={side} trigger={<Button variant="secondary">账号与日期</Button>}>
          <Stack gap={3}><Text>研究工作区的长名称与说明，测试换行和完整阅读。</Text><Text>long-unbroken-account-address@example.invalid</Text>
            <TextField label="草稿名称" value={draft} onChange={event => setDraft(event.target.value)} />
            <DateRangePicker label="日期范围" value={range} onValueChange={setRange} />
            <Text>内容超出可用高度时在浮层内滚动；缩放不清空草稿。</Text>
            <Inline><Button variant="secondary" onClick={() => setAction('已取消')}>取消日期</Button><Button onClick={() => setAction('已应用')}>应用日期</Button></Inline>
          </Stack>
        </Popover>
        <Menu label="对象操作" side={side} trigger={<Button variant="secondary">对象操作</Button>} items={['查看完整信息', '复制演示地址', '导出演示内容', '暂不可用', '最后一项操作'].map((label, i) => ({ id: String(i), label, disabled: i === 3, onSelect: () => setAction(label) }))} />
        <Tooltip side={side} content="很长的辅助说明也应在可用范围内换行，保留用户需要的字体大小。"><Button variant="quiet">辅助说明</Button></Tooltip>
        <Text role="status" variant="caption">{action}</Text>
      </Stack>
    </div>
  </ThemeProvider>;
}

export function OverlayBoundsGallery() {
  const [theme, setTheme] = useState('neo-brutalism'), [width, setWidth] = useState('400'), [zoom, setZoom] = useState('2');
  const [scope, setScope] = useState('document'), [edge, setEdge] = useState('bottom-right'), [side, setSide] = useState('top');
  const choices = (label: string, value: string, set: (value: string) => void, values: string[]) => <Select label={label} value={value} onChange={event => set(event.target.value)}>{values.map(item => <option key={item}>{item}</option>)}</Select>;
  const params = new URLSearchParams({ fixture: 'overlay-bounds', theme, zoom, scope, edge, side });
  return <Stack gap={4}><Text as="h2" variant="section">浮层缩放与边界</Text><Text tone="muted">独立文档验证 CSS zoom；它不等同于浏览器原生缩放。示例不访问业务数据。</Text>
    <Inline>{choices('样机主题', theme, setTheme, themes.map(item => item.name))}{choices('样机宽度', width, setWidth, ['400', '520', '880'])}{choices('CSS zoom', zoom, setZoom, ['1', '2'])}{choices('缩放范围', scope, setScope, ['document', 'theme', 'content'])}{choices('锚点位置', edge, setEdge, ['top-left', 'top-right', 'bottom-left', 'bottom-right'])}{choices('优先方向', side, setSide, ['top', 'right', 'bottom', 'left'])}</Inline>
    <iframe title="浮层边界样机" src={`?${params}`} style={{ width: Number(width), maxWidth: '100%', height: 758, border: '1px solid var(--rhine-line)', background: 'var(--rhine-bg)' }} />
  </Stack>;
}
