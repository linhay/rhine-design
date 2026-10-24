import { useEffect, useState } from 'react';
import { Button, Checkbox, OrbitBackdrop, Select, Stack, Surface, Text, TextField } from '../components';
import { ThemeProvider, themes, type ThemeName } from '../components/theme';
import { ListFilterBarGallery } from './ListFilterBarGallery';

export function OrbitEntryExample({ reduced = false, appearance = 'theme' }: { reduced?: boolean; appearance?: 'theme' | 'original' }) {
  return <div className="ds-orbit-entry-container"><div className="ds-orbit-entry">
    <OrbitBackdrop className="ds-orbit-entry-background" appearance={appearance} composition="corner" controls={false} framed={false} reducedMotion={reduced} aria-hidden="true" />
    <Stack gap={4} className="ds-orbit-entry-intro"><Text variant="overline">RHINE STUDIO</Text><Text as="h3" variant="title">从这里，继续创造。</Text><Text>让内容拥有清晰的阅读空间。</Text></Stack>
    <Surface className="ds-orbit-entry-form"><Stack gap={4}><Text as="h3" variant="heading">欢迎回来</Text><TextField label="示例昵称" placeholder="输入你的昵称" /><Button>进入工作空间</Button></Stack></Surface>
  </div></div>;
}

export function BackgroundFiltersFixture() {
  const params = new URLSearchParams(location.search);
  const zoom = Number(params.get('zoom')) || 1;
  const [theme, setTheme] = useState<ThemeName>((params.get('theme') || 'rhine') as ThemeName);
  const [reduced, setReduced] = useState(false), [mounted, setMounted] = useState(true);
  useEffect(() => { document.documentElement.style.zoom = String(zoom); return () => { document.documentElement.style.zoom = ''; }; }, [zoom]);
  return <ThemeProvider theme={theme} onThemeChange={setTheme}><div style={{ padding: 12 }}>
    {params.get('fixture') === 'list-filters' ? <ListFilterBarGallery /> : <Stack gap={4}>
      <Select label="验收主题" value={theme} onChange={event => setTheme(event.target.value as ThemeName)}>{themes.map(item => <option key={item.name} value={item.name}>{item.label}</option>)}</Select>
      <Checkbox label="减少入口动态" checked={reduced} onChange={event => setReduced(event.target.checked)} />
      <Checkbox label="挂载入口" checked={mounted} onChange={event => setMounted(event.target.checked)} />
      {mounted && <OrbitEntryExample reduced={reduced} />}
    </Stack>}
  </div></ThemeProvider>;
}
