import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Breadcrumbs, Button, Logo, SegmentedControl, Select, SideNav } from '../components';
import { ThemeProvider, themes, useTheme, type ThemeName } from '../components/theme';
import { componentCount, packageVersion } from './packageInfo';
import './shell.css';
import './theme-arknights.css';
import './theme-neo-brutalism.css';

export const galleryGroups = [
  { label: '开始', items: [['top', '设计总览'], ['subscriptions', '订阅管理示例'], ['compact-filters', '紧凑与大量筛选'], ['checkbox-rows', '侧栏双行多选'], ['component-typography', '组件文字配对']] },
  { label: '应用能力', items: [['app-shell', '背景与多侧栏'], ['advanced-forms', '复杂表单'], ['advanced-data', '受控数据表'], ['media', '媒体卡片与查看器'], ['monitoring', '健康详情与图表']] },
  { label: '设计语言', items: [['foundation', '视觉基础'], ['backgrounds', '场景背景'], ['spacing', '间距与组合'], ['typography', '字体与文字'], ['brand', '品牌标志']] },
  { label: '通用组件', items: [['button-actions', '动作语义与尺寸'], ['actions', '按钮与输入'], ['selection', '选择与切换'], ['summary-tabs', '带摘要的页签'], ['feedback', '状态与加载'], ['disclosure', '展开与组合'], ['data', '数据与分页'], ['forms', '表单与选择'], ['utilities', '操作与布局'], ['overlays', '浮层与反馈'], ['overlay-bounds', '浮层缩放与边界'], ['tray-usage', '托盘用量组合'], ['settings-composition', '设置页组合'], ['settings-dialog', '设置导航弹窗'], ['theme-picker', '主题预览与选择'], ['nav-actions', '导航行操作'], ['navigation', '导航与步骤'], ['form-workflow', '表单流程']] },
  { label: '交互与动效', items: [['patterns', '场景与交互指南'], ['agent-chat', '聊天消息与记录'], ['compact-selection', '紧凑选择与保存'], ['compact-account', '紧凑账号与凭证'], ['single-search', '单输入搜索'], ['list-filter-bar', '列表筛选栏'], ['date-range-filter', '日期筛选组合'], ['motion', '动效实验室'], ['startup', '启动动画'], ['orbit', '轨道星空'], ['neutron-star', '中子星']] },
] as const;
export type GallerySection = typeof galleryGroups[number]['items'][number][0];
const entries = galleryGroups.flatMap(group => [...group.items]);
function currentSection(): GallerySection {
  const hash = window.location.hash.slice(1);
  return entries.find(([id]) => id === hash)?.[0] ?? 'top';
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
  useEffect(() => {
    try { window.localStorage.setItem('rhine-preview-theme', theme); } catch { /* Keep switching available without storage. */ }
  }, [theme]);
  return <ThemeProvider theme={theme} onThemeChange={next => {
    setTheme(next);
    const url = new URL(window.location.href);
    url.searchParams.delete('theme');
    window.history.replaceState(null, '', url);
  }} className="ds-shell" data-rhine-motion={props.motion}>
    <GalleryContent {...props} />
  </ThemeProvider>;
}

function GalleryContent({ motion, onMotionChange, children }: GalleryShellProps) {
  const { theme, setTheme } = useTheme();
  const [section, setSection] = useState(currentSection);
  const [menuOpen, setMenuOpen] = useState(false);
  const main = useRef<HTMLElement>(null);
  const first = useRef(true);
  const label = entries.find(([id]) => id === section)![1];
  useEffect(() => {
    const navigate = () => { setSection(currentSection()); setMenuOpen(false); };
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
        <Button className="ds-menu-toggle" variant="secondary" aria-expanded={menuOpen} aria-controls="gallery-navigation" onClick={() => setMenuOpen(value => !value)}>目录</Button>
      </div>
      <SideNav id="gallery-navigation" className="ds-sidebar-nav" aria-label="组件目录" currentId={section} groups={galleryGroups.map(group=>({label:group.label,items:group.items.map(([id,label])=>({id,label,href:`#${id}`}))}))} onNavigate={item=>{
        setMenuOpen(false); if(section===item.id) main.current?.focus({preventScroll:true});
      }}/>
      <div className="ds-sidebar-foot"><span>COMPONENT LIBRARY</span><span>{componentCount} 个组件 · 源码包版本 {packageVersion}</span><span>发布范围见版本记录</span><span className="ak-readout">{readout}</span></div>
    </aside>
    <main className="ds-workspace" id="gallery-content" ref={main} tabIndex={-1} aria-label={label}>
      <header className="ds-workspace-head"><Breadcrumbs label="展台位置" items={[{label:"组件展台",href:"#top"},{label}]} /><div className="ds-head-controls"><SegmentedControl label="动效偏好" items={[{value:'system',label:'跟随系统'},{value:'reduced',label:'减少动态'}]} value={motion} onValueChange={onMotionChange} /><Select label="界面主题" value={theme} onChange={event => {
        const next = themes.find(item => item.name === event.target.value);
        if (next) setTheme(next.name);
      }}>{themes.map(item => <option key={item.name} value={item.name}>{item.label}</option>)}</Select></div></header>
      <div className="ds-gallery ds-page" key={section}>{children(section)}<footer className="ds-footer"><span>Rhine Design · 通用设计组件</span><span>演示数据，不执行业务操作。</span></footer></div>
    </main>
  </>;
}
