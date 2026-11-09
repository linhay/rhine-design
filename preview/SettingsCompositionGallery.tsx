import { useEffect, useRef, useState } from 'react';
import { AppShell, AppShellToggle, Button, Checkbox, Inline, Select, SideNav, Stack, Surface, Text } from '../components';
import { ThemeProvider, type ThemeName } from '../components/theme';

export function SettingsCompositionGallery() {
  const [open, setOpen] = useState(true), [state, setState] = useState('current');
  const [long, setLong] = useState(false), [action, setAction] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const reset = () => { clearTimeout(timer.current); setOpen(true); setState('current'); setLong(false); setAction(false); };
  const check = () => { clearTimeout(timer.current); setState('checking'); timer.current = setTimeout(() => setState('available'), 1200); };
  return <Stack>
    <Text as="h2" variant="section">设置页组合</Text><Text>未发布示例 · 合成更新数据，宿主负责真实检查与安装。</Text>
    <Select label="更新状态" value={state} onChange={e => { clearTimeout(timer.current); setState(e.target.value); }}>
      <option value="current">已是最新</option><option value="checking">检查中</option><option value="available">可安装</option><option value="error">检查失败</option>
    </Select>
    <Inline><Checkbox label="长产品名与状态" checked={long} onChange={e => setLong(e.target.checked)} /><Checkbox label="显示顶部动作" checked={action} onChange={e => setAction(e.target.checked)} /><Button variant="secondary" onClick={reset}>重置设置示例</Button></Inline>
    <div style={{ height: 520 }}>
      <AppShell label="设置组合工作区" layout="single" controls="inline" collapseEmptyContentHeader navigation={{ label: '设置导航', open, onOpenChange: setOpen, content: <Stack><Inline><Text>演示工作区</Text><AppShellToggle placement="panel" iconOnly /></Inline><SideNav currentId="settings" groups={[{ label: '偏好', items: [{ id: 'settings', href: '#settings-composition', label: '设置', icon: 'settings' }] }]} onNavigate={(_, event) => event.preventDefault()} /></Stack> }}
        contentHeader={<><AppShellToggle placement="content" iconOnly />{action && <Button variant="quiet" onClick={() => setAction(false)}>完成顶部操作</Button>}</>}>
        <Stack><Text as="h1" variant="heading">设置</Text><Surface>
          <Inline style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Stack gap={2} style={{ flex: '1 1 180px', minWidth: 0, overflowWrap: 'anywhere' }}><Text as="h2" variant="heading">{long ? 'Rhine Studio · 用于跨地区协作的超长产品身份与版本名称' : 'Rhine Studio'}</Text><Text tone="muted">演示版本 · 关于</Text></Stack>
            <Stack gap={2} data-testid="update-area" style={{ flex: '1 1 200px', minWidth: 0, alignItems: 'flex-end', textAlign: 'end', overflowWrap: 'anywhere' }}>
              <Text role="status">{state === 'checking' ? '正在检查更新，请稍候…' : state === 'error' ? '检查失败，请重试。' : state === 'available' ? '发现可安装的演示更新。' : '当前已是最新版本。'}{long && '此说明包含完整的更新渠道和网络检查信息，会随可用空间自然换行。'}</Text>
              <Button variant="secondary" busy={state === 'checking'} busyLabel="正在检查更新" onClick={() => state === 'available' ? setState('current') : check()}>{state === 'error' ? '重试检查' : state === 'available' ? '安装演示更新' : '检查更新'}</Button>
            </Stack>
          </Inline>
        </Surface></Stack>
      </AppShell>
    </div>
  </Stack>;
}
export function SettingsCompositionFixture() {
  const params = new URLSearchParams(location.search), zoom = Number(params.get('zoom')) || 1;
  useEffect(() => { document.documentElement.style.zoom = String(zoom); return () => { document.documentElement.style.zoom = ''; }; }, [zoom]);
  return <ThemeProvider theme={(params.get('theme') || 'rhine') as ThemeName} data-rhine-motion={params.get('motion') || 'system'}><div style={{ padding: 16 }}><SettingsCompositionGallery /></div></ThemeProvider>;
}
