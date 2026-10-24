import { Badge, Button, Inline, SideNav, Stack, Surface, Text } from '../components';
import { ThemeProvider, type ThemeName } from '../components/theme';

/** Synthetic, deterministic source for the shipped 960 × 600 theme previews. */
export function ThemeSample() {
  const theme = (new URLSearchParams(location.search).get('theme') || 'rhine') as ThemeName;
  return <ThemeProvider theme={theme} data-rhine-motion="reduced" style={{ boxSizing: 'border-box', width: 960, height: 600, padding: 32, display: 'grid', gridTemplateColumns: '200px minmax(0,1fr)', gap: 28 }}>
    <SideNav aria-label="样本导航" currentId="library" groups={[{ label: '研究工作区', items: [{ id: 'library', label: '资源库', href: '#library' }, { id: 'collections', label: '收藏集', href: '#collections' }, { id: 'activity', label: '最近活动', href: '#activity' }] }]} />
    <Stack gap={4}><Inline><Text as="h1" variant="title">让内容保持清晰</Text><Badge tone="success">已同步</Badge></Inline><Text tone="muted">相同的页面，比较每种主题的表面、文字与操作。</Text>
      <Surface><Stack gap={4}><Text as="h2" variant="heading">本周研究计划</Text><Text>整理资料与发现，在需要时继续工作。</Text><Inline><Button>新建项目</Button><Button variant="secondary">查看详情</Button></Inline></Stack></Surface>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>{['设计与观察', '记录与归档'].map((title, i) => <Surface key={title}><Stack gap={3}><div aria-hidden="true" style={{height:80,background:'var(--rhine-selected)',border:'1px solid var(--rhine-line)',display:'grid',placeItems:'center'}}><span style={{fontSize:40,color:'var(--rhine-green)'}}>{i ? '◷' : '△'}</span></div><Text variant="heading">{title}</Text><Text variant="caption" tone="muted">12 项合成资料 · 随时继续</Text></Stack></Surface>)}</div>
    </Stack>
  </ThemeProvider>;
}
