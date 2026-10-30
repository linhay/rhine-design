import { useEffect, useState } from 'react';
import { Button, Select, Text } from '../components';
import { ThemeProvider, themes } from '../components/theme';
import { ResidentTreeWorkspace } from './ResidentTreeRecipe';

export function ResidentTreeGallery() {
  const [mounted, setMounted] = useState(true);
  return <><Text as="h2" variant="section">常驻层级浏览树与画布</Text><Text tone="muted">语义 HTML 与公开组件组成的只读配方；数据、目标与选择由宿主控制。此展台不调用设备或业务接口。</Text>
    <Button variant="quiet" onClick={() => setMounted(value => !value)}>{mounted ? '卸载工作台' : '挂载工作台'}</Button>
    {mounted && <ResidentTreeWorkspace />}</>;
}
export function ResidentTreeFixture() {
  const params = new URLSearchParams(location.search), zoom = Number(params.get('zoom')) === 2 ? 2 : 1;
  useEffect(() => { document.documentElement.style.zoom = String(zoom); return () => { document.documentElement.style.zoom = ''; }; }, [zoom]);
  const [theme, setTheme] = useState(() => themes.find(item => item.name === params.get('theme'))?.name ?? 'rhine');
  return <ThemeProvider theme={theme} data-rhine-motion={params.get('motion') === 'reduced' ? 'reduced' : 'system'} style={{ padding: 12, minHeight: '100vh', boxSizing: 'border-box' }}><Select label="配方主题" value={theme} onChange={event => { const next = themes.find(item => item.name === event.target.value); if (next) setTheme(next.name); }}>{themes.map(item => <option key={item.name} value={item.name}>{item.label}</option>)}</Select><ResidentTreeGallery /></ThemeProvider>;
}
