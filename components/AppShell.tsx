import { createContext, useContext, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button } from './components';
import { IconButton } from './Actions';
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
  controls?: 'header' | 'inline';
}

interface PanelControl { panel: ShellPanel; overlay: boolean; side: 'left' | 'right'; id: string; drawerOpen: boolean; setDrawerOpen: (open: boolean) => void }
const ShellControls = createContext<{ navigation: PanelControl; secondary?: PanelControl } | null>(null);
export interface AppShellToggleProps { panel?: 'navigation' | 'secondary'; placement: 'panel' | 'content'; iconOnly?: boolean }

export function AppShellToggle({ panel = 'navigation', placement, iconOnly = false }: AppShellToggleProps) {
  const controls = useContext(ShellControls);
  const control = controls?.[panel];
  if (!control) return null;
  const expanded = !control.overlay && !control.drawerOpen && control.panel.open;
  if (placement === 'content') return <Panel {...control} hidden={expanded} iconOnly={iconOnly} />;
  if (!expanded) return null;
  const label = `收起${control.panel.label}`;
  const props = { id: `${control.id}-collapse`, 'aria-controls': control.id, 'aria-expanded': true, onClick: () => control.panel.onOpenChange(false) };
  return iconOnly ? <IconButton {...props} icon="chevronLeft" label={label} title={label} /> : <Button {...props} variant="secondary">{label}</Button>;
}

function Panel({ panel, overlay, side, id, drawerOpen, setDrawerOpen, hidden = false, iconOnly = false }: PanelControl & { hidden?: boolean; iconOnly?: boolean }) {
  const floating = overlay || drawerOpen;
  const label = `${floating ? '' : panel.open ? '收起' : '展开'}${panel.label}`;
  const props = { id: `${id}-toggle`, hidden, 'aria-controls': floating ? undefined : id, 'aria-expanded': floating ? drawerOpen : panel.open,
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => { if (!floating) { event.preventDefault(); panel.onOpenChange(!panel.open); } } };
  return <div className="rhine-shell__panel-control" hidden={hidden}>
    <Drawer title={panel.label} description="关闭后返回当前任务。" side={side} open={drawerOpen} onOpenChange={setDrawerOpen}
      onCloseAutoFocus={event => { if (document.getElementById(`${id}-toggle`)?.hidden) { event.preventDefault(); document.getElementById(`${id}-collapse`)?.focus(); } }}
      trigger={iconOnly ? <IconButton {...props} icon="chevronRight" label={label} title={label} /> : <Button {...props} variant="secondary">{label}</Button>}>{panel.content}</Drawer>
  </div>;
}

export function AppShell({ layout, navigation, secondary, header, children, label = '应用工作区', decoration = 'auto', className = '', style, controls = 'header' }: AppShellProps) {
  const ref = useRef<HTMLDivElement>(null);
  const focusedPanel = useRef<'nav' | 'secondary' | null>(null);
  const focusedToggle = useRef<string | null>(null);
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
    // Inline restore controls disappear after expansion; keep keyboard focus reachable.
    if (controls === 'inline') for (const suffix of ['nav', 'secondary']) {
      const toggle = document.getElementById(`${id}-${suffix}-toggle`);
      if (toggle?.hidden && focusedToggle.current === toggle.id && (document.activeElement === toggle || document.activeElement === document.body)) document.getElementById(`${id}-${suffix}-collapse`)?.focus();
    }
    const suffix = focusedPanel.current;
    if (suffix) {
      const pane = document.getElementById(`${id}-${suffix}`);
      if (pane?.hidden && (document.activeElement === document.body || pane.contains(document.activeElement))) {
        (document.getElementById(`${id}-${suffix}-toggle`) ?? document.getElementById(`${id}-nav-toggle`))?.focus();
        focusedPanel.current = null;
      }
    }
  }, [id, controls, navOverlay, secondaryOverlay, hasSecondary, navigation.open, secondary?.open, navigationDrawer, secondaryDrawer]);
  const navigationControl: PanelControl = { panel: navigation, overlay: navOverlay, side: 'left', id: `${id}-nav`, drawerOpen: navigationDrawer, setDrawerOpen: setNavigationDrawer };
  const secondaryControl: PanelControl | undefined = hasSecondary ? { panel: secondary, overlay: secondaryOverlay, side: layout === 'left-right' ? 'right' : 'left', id: `${id}-secondary`, drawerOpen: secondaryDrawer, setDrawerOpen: setSecondaryDrawer } : undefined;
  return <ShellControls.Provider value={{ navigation: navigationControl, secondary: secondaryControl }}><div className={`rhine-shell ${className}`} style={style} ref={ref} role="region" aria-label={label} data-layout={layout}
    onFocusCapture={event => { focusedToggle.current = event.target.id.endsWith('-toggle') ? event.target.id : null; focusedPanel.current = document.getElementById(`${id}-nav`)?.contains(event.target) ? 'nav' : document.getElementById(`${id}-secondary`)?.contains(event.target) ? 'secondary' : null; }}
    onBlurCapture={event => { if (event.relatedTarget && event.relatedTarget !== document.body && !event.currentTarget.contains(event.relatedTarget)) { focusedPanel.current = null; focusedToggle.current = null; } }}>
    {(controls === 'header' || header) && <header className="rhine-shell__header">
      {controls === 'header' && <><Panel {...navigationControl} />{secondaryControl && <Panel {...secondaryControl} />}</>}
      {header}
    </header>}
    <div className="rhine-shell__body">
      <aside id={`${id}-nav`} className="rhine-shell__nav" style={{ flexBasis: navigation.width }} aria-label={navigation.label} hidden={navOverlay || navigationDrawer || !navigation.open}>{!navigationDrawer && navigation.content}</aside>
      <aside id={`${id}-secondary`} className="rhine-shell__secondary" style={{ flexBasis: secondary?.width }} aria-label={secondary?.label} hidden={!hasSecondary || secondaryOverlay || secondaryDrawer || !secondary?.open}>{hasSecondary && !secondaryDrawer && secondary?.content}</aside>
      <Background className="rhine-shell__content" decoration={decoration} tabIndex={0} role="region" aria-label="正文">{children}</Background>
    </div>
  </div></ShellControls.Provider>;
}
