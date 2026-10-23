import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button } from './components';
import { Drawer } from './Overlays';
import { Background, type BackgroundDecoration } from './Background';

export interface ShellPanel {
  label: string; content: ReactNode; open: boolean; onOpenChange: (open: boolean) => void;
  drawerOpen?: boolean; defaultDrawerOpen?: boolean; onDrawerOpenChange?: (open: boolean) => void;
  width?: number; breakpoint?: number;
}
export interface AppShellProps {
  layout: 'single' | 'double-left' | 'left-right';
  navigation: ShellPanel; secondary?: ShellPanel;
  header?: ReactNode; children: ReactNode; label?: string; decoration?: BackgroundDecoration;
  className?: string; style?: CSSProperties;
}

function Panel({ panel, overlay, side, id, drawerOpen, setDrawerOpen }: { panel: ShellPanel; overlay: boolean; side: 'left' | 'right'; id: string; drawerOpen: boolean; setDrawerOpen: (open: boolean) => void }) {
  const floating = overlay || drawerOpen;
  return <div className="rhine-shell__panel-control">
    <Drawer title={panel.label} description="关闭后返回当前任务。" side={side} open={drawerOpen} onOpenChange={setDrawerOpen}
      trigger={<Button id={`${id}-toggle`} variant="secondary" aria-controls={floating ? undefined : id} aria-expanded={floating ? drawerOpen : panel.open}
        onClick={event => { if (!floating) { event.preventDefault(); panel.onOpenChange(!panel.open); } }}>{floating ? '' : panel.open ? '收起' : '展开'}{panel.label}</Button>}>{panel.content}</Drawer>
  </div>;
}

export function AppShell({ layout, navigation, secondary, header, children, label = '应用工作区', decoration = 'auto', className = '', style }: AppShellProps) {
  const ref = useRef<HTMLDivElement>(null);
  const focusedPanel = useRef<'nav' | 'secondary' | null>(null);
  const [width, setWidth] = useState(0);
  const [localNavigationDrawer, setLocalNavigationDrawer] = useState(navigation.defaultDrawerOpen ?? false), [localSecondaryDrawer, setLocalSecondaryDrawer] = useState(secondary?.defaultDrawerOpen ?? false);
  const navigationDrawer = navigation.drawerOpen ?? localNavigationDrawer, secondaryDrawer = secondary?.drawerOpen ?? localSecondaryDrawer;
  const setNavigationDrawer = (next: boolean) => { if (navigation.drawerOpen === undefined) setLocalNavigationDrawer(next); navigation.onDrawerOpenChange?.(next); };
  const setSecondaryDrawer = (next: boolean) => { if (secondary?.drawerOpen === undefined) setLocalSecondaryDrawer(next); secondary?.onDrawerOpenChange?.(next); };
  const id = useId();
  useLayoutEffect(() => {
    if (!ref.current) return;
    // CSS layout pixels stay stable under zoom and transforms; visual bounds do not.
    const measure = () => setWidth(ref.current?.clientWidth ?? 0);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const navOverlay = width < (navigation.breakpoint ?? 760), secondaryOverlay = width < (secondary?.breakpoint ?? 1120);
  const hasSecondary = layout !== 'single' && !!secondary;
  useLayoutEffect(() => {
    const suffix = focusedPanel.current;
    if (suffix) {
      const pane = document.getElementById(`${id}-${suffix}`);
      if (pane?.hidden && (document.activeElement === document.body || pane.contains(document.activeElement))) {
        (document.getElementById(`${id}-${suffix}-toggle`) ?? document.getElementById(`${id}-nav-toggle`))?.focus();
        focusedPanel.current = null;
      }
    }
  }, [id, navOverlay, secondaryOverlay, hasSecondary, navigation.open, secondary?.open]);
  return <div className={`rhine-shell ${className}`} style={style} ref={ref} role="region" aria-label={label} data-layout={layout}
    onFocusCapture={event => { focusedPanel.current = document.getElementById(`${id}-nav`)?.contains(event.target) ? 'nav' : document.getElementById(`${id}-secondary`)?.contains(event.target) ? 'secondary' : null; }}
    onBlurCapture={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) focusedPanel.current = null; }}>
    <header className="rhine-shell__header">
      <Panel panel={navigation} overlay={navOverlay} side="left" id={`${id}-nav`} drawerOpen={navigationDrawer} setDrawerOpen={setNavigationDrawer} />
      {hasSecondary && <Panel panel={secondary} overlay={secondaryOverlay} side={layout === 'left-right' ? 'right' : 'left'} id={`${id}-secondary`} drawerOpen={secondaryDrawer} setDrawerOpen={setSecondaryDrawer} />}
      {header}
    </header>
    <div className="rhine-shell__body">
      <aside id={`${id}-nav`} className="rhine-shell__nav" style={{ flexBasis: navigation.width }} aria-label={navigation.label} hidden={navOverlay || navigationDrawer || !navigation.open}>{!navigationDrawer && navigation.content}</aside>
      <aside id={`${id}-secondary`} className="rhine-shell__secondary" style={{ flexBasis: secondary?.width }} aria-label={secondary?.label} hidden={!hasSecondary || secondaryOverlay || secondaryDrawer || !secondary?.open}>{hasSecondary && !secondaryDrawer && secondary?.content}</aside>
      <Background className="rhine-shell__content" decoration={decoration} tabIndex={0} role="region" aria-label="正文">{children}</Background>
    </div>
  </div>;
}
