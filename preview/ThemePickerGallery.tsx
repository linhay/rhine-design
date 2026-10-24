import { useEffect, useState } from 'react';
import { Button, Checkbox, Dialog, Stack, Text, TextField } from '../components';
import { ThemePicker } from '../components/ThemePicker';
import { ThemeProvider, themes, useTheme, type ThemeName } from '../components/theme';

export function ThemePickerGallery() {
  const { theme, setTheme } = useTheme();
  const [disabled, setDisabled] = useState(false), [longNames, setLongNames] = useState(false), [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState('切换主题时保留');
  const options = themes.map(item => ({ value: item.name, label: longNames ? `${item.label} · 适合长时间阅读与资源管理的工作区外观` : item.label, previewSrc: failed ? '/missing-theme-preview.png' : undefined }));
  return <Stack gap={4}><Text as="h2" variant="section">先比较，再应用</Text><Text tone="muted">预览来自同一组官方组件，保持各自的配色。选择即应用；偏好是否保存由宿主管理。</Text>
    <ThemePicker value={theme} onValueChange={setTheme} options={options} disabled={disabled} />
    <Stack gap={2}><Checkbox label="长主题名称" checked={longNames} onChange={event => setLongNames(event.target.checked)} /><Checkbox label="禁用主题选择" checked={disabled} onChange={event => setDisabled(event.target.checked)} /><Checkbox label="模拟预览失败" checked={failed} onChange={event => setFailed(event.target.checked)} /></Stack>
    <TextField label="未保存草稿" value={draft} onChange={event => setDraft(event.target.value)} />
    <Dialog trigger={<Button variant="secondary">弹窗内切换主题</Button>} title="外观设置" description="切换后当前弹窗与草稿保持打开"><Stack gap={4}><TextField label="弹窗草稿" defaultValue="继续编辑" /><ThemePicker value={theme} onValueChange={setTheme} /></Stack></Dialog>
  </Stack>;
}

export function ThemePickerFixture() {
  const params = new URLSearchParams(location.search);
  const zoom = Number(params.get('zoom')) || 1;
  useEffect(() => { document.documentElement.style.zoom = String(zoom); return () => { document.documentElement.style.zoom = ''; }; }, [zoom]);
  return <ThemeProvider defaultTheme={(params.get('theme') || 'rhine') as ThemeName} data-rhine-motion="reduced"><div style={{padding:16}}><ThemePickerGallery /></div></ThemeProvider>;
}
