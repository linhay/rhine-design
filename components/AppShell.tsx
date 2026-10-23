import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from './components';
import { Drawer } from './Overlays';
import { Background, type BackgroundDecoration } from './Background';

export interface ShellPanel { label: string; content: ReactNode; open: boolean; onOpenChange: (open: boolean) => void }
export interface AppShellProps {
  layout: 'single' | 'double-left' | 'left-right';
  navigation: ShellPanel; secondary?: ShellPanel;
  header?: ReactNode; children: ReactNode; label?: string; decoration?: BackgroundDecoration;
}

function Panel({ panel, overlay, id, drawerOpen, setDrawerOpen }: { panel: ShellPanel; overlay: boolean; id: string; drawerOpen: boolean; setDrawerOpen: (open: boolean) => void }) {
  const floating = overlay || drawerOpen;
  return <div className="rhine-shell__panel-control">
    <Drawer title={panel.label} description="关闭后返回当前任务。" open={drawerOpen} onOpenChange={setDrawerOpen}
      trigger={<Button id={`${id}-toggle`} variant="secondary" aria-controls={floating ? undefined : id} aria-expanded={floating ? drawerOpen : panel.open}
        onClick={event => { if (!floating) { event.preventDefault(); panel.onOpenChange(!panel.open); } }}>{floating ? '' : panel.open ? '收起' : '展开'}{panel.label}</Button>}>{panel.content}</Drawer>
  </div>;
}

export function AppShell({ layout, navigation, secondary, header, children, label = '应用工作区', decoration = 'auto' }: AppShellProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [navigationDrawer, setNavigationDrawer] = useState(false), [secondaryDrawer, setSecondaryDrawer] = useState(false);
  const id = useId();
  useLayoutEffect(() => {
    if (!ref.current) return;
    const measure = () => setWidth(ref.current?.getBoundingClientRect().width ?? 0);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const navOverlay = width < 760, secondaryOverlay = width < 1120;
  const hasSecondary = layout !== 'single' && !!secondary;
  useEffect(() => {
    for (const suffix of ['nav', 'secondary']) {
      const pane = document.getElementById(`${id}-${suffix}`);
      if (pane?.hidden && pane.contains(document.activeElement)) document.getElementById(`${id}-${suffix}-toggle`)?.focus();
    }
  }, [id, navOverlay, secondaryOverlay, hasSecondary, navigation.open, secondary?.open]);
  return <div className="rhine-shell" ref={ref} role="region" aria-label={label} data-layout={layout}>
    <header className="rhine-shell__header">
      <Panel panel={navigation} overlay={navOverlay} id={`${id}-nav`} drawerOpen={navigationDrawer} setDrawerOpen={setNavigationDrawer} />
      {hasSecondary && <Panel panel={secondary} overlay={secondaryOverlay} id={`${id}-secondary`} drawerOpen={secondaryDrawer} setDrawerOpen={setSecondaryDrawer} />}
      {header}
    </header>
    <div className="rhine-shell__body">
      <aside id={`${id}-nav`} className="rhine-shell__nav" aria-label={navigation.label} hidden={navOverlay || navigationDrawer || !navigation.open}>{!navigationDrawer && navigation.content}</aside>
      <aside id={`${id}-secondary`} className="rhine-shell__secondary" aria-label={secondary?.label} hidden={!hasSecondary || secondaryOverlay || secondaryDrawer || !secondary?.open}>{hasSecondary && !secondaryDrawer && secondary?.content}</aside>
      <Background className="rhine-shell__content" decoration={decoration} tabIndex={0} role="region" aria-label="正文">{children}</Background>
    </div>
  </div>;
}
