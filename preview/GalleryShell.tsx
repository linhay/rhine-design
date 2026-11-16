import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Breadcrumbs, Button, Logo, SegmentedControl, Select, SideNav, type NavGroup } from '../components';
import { ThemeProvider, themes, useTheme, type ThemeName } from '../components/theme';
import { packageVersion } from './packageInfo';
import { galleryGroups, isKnownGallerySection, legacySections, menuCurrentId, sectionLabel } from './antd-overview';
import { chatFoundationPages, isChatFoundationComponent, type ChatFoundationComponentId } from './chat-foundation-navigation';
import './shell.css';
import './theme-arknights.css';
import './theme-neo-brutalism.css';

export { galleryGroups };
export type GallerySection = typeof galleryGroups[number]['items'][number][0] | keyof typeof legacySections | ChatFoundationComponentId;
interface GalleryLocation { section: GallerySection; anchorId?: string }
function currentLocation(): GalleryLocation {
  const hash = window.location.hash.slice(1);
  // Accept old exhibit links while keeping new chapter/target fragments distinct.
  if (hash === 'anchor-a' || hash === 'anchor-b') return { section:'anchor', anchorId:hash };
  const separator = hash.indexOf('::'), chapter = separator < 0 ? hash : hash.slice(0, separator);
  const known = isKnownGallerySection(chapter) || chatFoundationPages.some(page => page.id === chapter);
  let anchorId: string | undefined;
  if (known && separator >= 0) {
    try { anchorId = decodeURIComponent(hash.slice(separator + 2)) || undefined; } catch { /* Invalid target encoding cannot break the chapter. */ }
  }
  return { section:(known ? chapter : 'top') as GallerySection, anchorId };
}

export function filterGalleryNavigation(query: string): NavGroup[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matches = (text: string) => terms.every(term => text.toLocaleLowerCase().includes(term));
  return galleryGroups.map(group => ({ label: group.label, items: group.items.flatMap(([id, label]) => {
    const children = id === 'chat-foundation' ? chatFoundationPages.map(page => ({ id: page.id, label: page.label, href: `#${page.id}` })) : undefined;
    const ownMatch = matches(`${group.label} ${id} ${label}`);
    const matchingChildren = children?.filter(child => matches(`${group.label} ${id} ${child.label}`));
    return ownMatch || matchingChildren?.length ? [{ id, label, href: `#${id}`, children: ownMatch ? children : matchingChildren }] : [];
  }) })).filter(group => group.items.length);
}

interface GalleryShellProps {
  motion: string; onMotionChange: (value: string) => void;
  children: (section: GallerySection) => ReactNode;
}

function initialTheme(): ThemeName {
  let stored: string | null = null;
  try { stored = window.localStorage.getItem('rhine-preview-theme'); } catch { /* Storage is optional in the host. */ }
  const requested = new URLSearchParams(window.location.search).get('theme');
  return themes.find(item => item.name === requested)?.name
    ?? themes.find(item => item.name === stored)?.name ?? 'rhine';
}

export function GalleryShell(props: GalleryShellProps) {
  const [theme, setTheme] = useState(initialTheme);
  const [location, setLocation] = useState(currentLocation);
  const { section, anchorId } = location;
  useEffect(() => { const navigate = () => setLocation(currentLocation()); window.addEventListener('hashchange', navigate); return () => window.removeEventListener('hashchange', navigate); }, []);
  useEffect(() => {
    try { window.localStorage.setItem('rhine-preview-theme', theme); } catch { /* Keep switching available without storage. */ }
  }, [theme]);
  return <ThemeProvider theme={section === 'editorial-layout' ? 'neutral' : theme} onThemeChange={next => {
    setTheme(next);
    const url = new URL(window.location.href);
    url.searchParams.delete('theme');
    window.history.replaceState(null, '', url);
  }} className="ds-shell" data-rhine-motion={props.motion}>
    <GalleryContent {...props} section={section} anchorId={anchorId} />
  </ThemeProvider>;
}

function GalleryContent({ motion, onMotionChange, children, section, anchorId }: GalleryShellProps & { section: GallerySection; anchorId?: string }) {
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const search = useRef<HTMLInputElement>(null);
  const filtered = filterGalleryNavigation(query);
  const resultCount = filtered.reduce((count, group) => count + group.items.reduce((sum, item) => sum + 1 + (item.children?.length ?? 0), 0), 0);
  const main = useRef<HTMLElement>(null);
  const first = useRef(true);
  const label = sectionLabel(section);
  useEffect(() => {
    const navigate = () => { setMenuOpen(false); };
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  useEffect(() => {
    document.title = `${label} · 莱茵设计`;
    if (main.current) main.current.scrollTop = 0;
    if (!first.current) main.current?.focus({ preventScroll: true });
    first.current = false;
  }, [section, label]);
  useEffect(() => {
    if (!anchorId) return;
    const target = document.getElementById(anchorId);
    if (!target || !main.current?.contains(target)) return;
    target.scrollIntoView?.({ block:'start', behavior:'auto' });
    target.focus({ preventScroll:true });
  }, [section, anchorId]);
  useEffect(() => {
    const nav = document.getElementById('gallery-navigation');
    const current = nav?.querySelector<HTMLElement>('[aria-current=page]');
    if (!nav || !current || !nav.clientHeight) return;
    const bounds = nav.getBoundingClientRect(), item = current.getBoundingClientRect();
    // Reveal deep-linked chapters inside the directory without scrolling the workspace.
    if (item.top < bounds.top) nav.scrollTop += item.top - bounds.top;
    else if (item.bottom > bounds.bottom) nav.scrollTop += item.bottom - bounds.bottom;
  }, [section, menuOpen]);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (theme !== 'arknights') return;
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [theme]);
  const utcOffset = -now.getTimezoneOffset() / 60;
  const readout = `LOCAL ${now.toLocaleTimeString('zh-CN', { hour12: false })} // UTC${utcOffset >= 0 ? '+' : ''}${utcOffset}`;
  return <>
    <a className="ds-skip" href="#gallery-content" onClick={event => { event.preventDefault(); main.current?.focus(); }}>跳到内容</a>
    <div className="ak-hud" aria-hidden="true"><i /><i /><i /><i /></div>
    <aside className="ds-sidebar" data-open={menuOpen} onKeyDown={event => {
      if (event.key === 'Escape' && menuOpen) { setMenuOpen(false); event.currentTarget.querySelector<HTMLButtonElement>('.ds-menu-toggle')?.focus(); }
    }}>
      <div className="ds-sidebar-brand"><a href="#top" aria-label="Rhine Design · 设计总览"><Logo size={32} /><span>莱茵设计<small>RHINE DESIGN</small></span></a>
        <Button className="ds-menu-toggle" variant="secondary" aria-expanded={menuOpen} aria-controls="gallery-directory" onClick={() => setMenuOpen(value => !value)}>目录</Button>
      </div>
      <div id="gallery-directory" className="ds-sidebar-directory">
        <div className="ds-directory-search rhine-field" role="search" aria-label="目录筛选"><label htmlFor="gallery-search">搜索组件</label><div className="ds-directory-search__input"><input ref={search} id="gallery-search" type="search" placeholder="中文 / English" value={query} aria-controls="gallery-navigation" onChange={event => setQuery(event.target.value)} onKeyDown={event => {
          if (event.nativeEvent.isComposing || event.keyCode === 229) return;
          if (event.key === 'Escape' && query) { event.preventDefault(); event.stopPropagation(); setQuery(''); }
          if (event.key === 'Enter') { event.preventDefault(); document.getElementById('gallery-navigation')?.querySelector<HTMLAnchorElement>('a[href]')?.click(); }
        }} />{query && <Button variant="quiet" aria-label="清空目录搜索" onClick={() => { setQuery(''); search.current?.focus(); }}>清空</Button>}</div>{query && <span role="status">{resultCount ? `${resultCount} 个目录项` : '没有匹配的组件'}</span>}</div>
        <SideNav id="gallery-navigation" className="ds-sidebar-nav" aria-label="组件目录" currentId={menuCurrentId(section)} groups={filtered} onNavigate={item => {
          setMenuOpen(false); if (section === item.id) main.current?.focus({ preventScroll: true });
        }} />
      </div>
      <div className="ds-sidebar-foot"><span>COMPONENT LIBRARY</span><span>分类对标组件总览 · 源码包版本 {packageVersion}</span><span>发布范围见版本记录</span><span className="ak-readout">{readout}</span></div>
    </aside>
    <main className="ds-workspace" id="gallery-content" ref={main} tabIndex={-1} aria-label={label}>
      <header className="ds-workspace-head"><Breadcrumbs label="展台位置" items={[{label:"组件展台",href:"#top"},...(isChatFoundationComponent(section)?[{label:"Chat 基石",href:"#chat-foundation"}]:[]),{label}]} /><div className="ds-head-controls"><SegmentedControl label="动效偏好" items={[{value:'system',label:'跟随系统'},{value:'reduced',label:'减少动态'}]} value={motion} onValueChange={onMotionChange} /><Select label="界面主题" disabled={section === 'editorial-layout'} title={section === 'editorial-layout' ? '此配方固定以中性主题为基础；可在内容区选择局部配色' : undefined} value={theme} onChange={event => {
        const next = themes.find(item => item.name === event.target.value);
        if (next) setTheme(next.name);
      }}>{themes.map(item => <option key={item.name} value={item.name}>{item.label}</option>)}</Select></div></header>
      <div className="ds-gallery ds-page" key={section}>{children(section)}<footer className="ds-footer"><span>Rhine Design · 通用设计组件</span><span>演示数据，不执行业务操作。</span></footer></div>
    </main>
  </>;
}
