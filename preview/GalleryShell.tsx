import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button, Logo, SegmentedControl } from '../components';
import './shell.css';

export const galleryGroups = [
  { label: '开始', items: [['top', '设计总览']] },
  { label: '设计语言', items: [['foundation', '视觉基础'], ['typography', '字体与文字'], ['brand', '品牌标志']] },
  { label: '通用组件', items: [['actions', '按钮与输入'], ['selection', '选择与切换'], ['feedback', '状态与加载'], ['disclosure', '展开与组合'], ['data', '数据与分页'], ['forms', '表单与选择'], ['utilities', '操作与布局'], ['overlays', '浮层与反馈']] },
  { label: '交互与动效', items: [['motion', '动效实验室'], ['startup', '启动动画']] },
] as const;
export type GallerySection = typeof galleryGroups[number]['items'][number][0];
const entries = galleryGroups.flatMap(group => [...group.items]);
function currentSection(): GallerySection {
  const hash = window.location.hash.slice(1);
  return entries.find(([id]) => id === hash)?.[0] ?? 'top';
}

export function GalleryShell({ motion, onMotionChange, children }: {
  motion: string; onMotionChange: (value: string) => void;
  children: (section: GallerySection) => ReactNode;
}) {
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
  return <div className="rhine-theme ds-shell" data-rhine-motion={motion}>
    <a className="ds-skip" href="#gallery-content" onClick={event => { event.preventDefault(); main.current?.focus(); }}>跳到内容</a>
    <aside className="ds-sidebar" data-open={menuOpen} onKeyDown={event => {
      if (event.key === 'Escape' && menuOpen) { setMenuOpen(false); event.currentTarget.querySelector<HTMLButtonElement>('.ds-menu-toggle')?.focus(); }
    }}>
      <div className="ds-sidebar-brand"><a href="#top" aria-label="Rhine Design · 设计总览"><Logo size={32} /><span>莱茵设计<small>RHINE DESIGN</small></span></a>
        <Button className="ds-menu-toggle" variant="secondary" aria-expanded={menuOpen} aria-controls="gallery-navigation" onClick={() => setMenuOpen(value => !value)}>目录</Button>
      </div>
      <nav id="gallery-navigation" className="ds-sidebar-nav" aria-label="组件目录">
        {galleryGroups.map(group => <div className="ds-nav-group" key={group.label}><p>{group.label}</p>{group.items.map(([id, title]) => <a key={id} href={`#${id}`} aria-current={section === id ? 'page' : undefined} onClick={() => {
          setMenuOpen(false);
          if (section === id) main.current?.focus({ preventScroll: true });
        }}>{title}<span aria-hidden="true">↗</span></a>)}</div>)}
      </nav>
      <div className="ds-sidebar-foot"><span>COMPONENT LIBRARY</span><span>40 个组件 · 持续演进</span></div>
    </aside>
    <main className="ds-workspace" id="gallery-content" ref={main} tabIndex={-1} aria-label={label}>
      <header className="ds-workspace-head"><div><span>组件展台 / </span><strong>{label}</strong></div><SegmentedControl label="动效偏好" items={[{value:'system',label:'跟随系统'},{value:'reduced',label:'减少动态'}]} value={motion} onValueChange={onMotionChange} /></header>
      <div className="ds-gallery ds-page" key={section}>{children(section)}<footer className="ds-footer"><span>Rhine Design · 通用设计组件</span><span>演示数据，不执行业务操作。</span></footer></div>
    </main>
  </div>;
}
