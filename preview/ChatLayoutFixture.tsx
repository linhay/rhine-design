import { useEffect } from 'react';
import { ChatThread, Text, type ChatEntry } from '../components';
import { ThemeProvider, type ThemeName } from '../components/theme';
import { ChatGallery } from './ChatGallery';

/** Isolated synthetic host. The 640px frame supplies the bounded height required by fill. */
export function ChatLayoutFixture() {
  const params = new URLSearchParams(location.search), zoom = Number(params.get('zoom')) || 1;
  useEffect(() => { document.documentElement.style.zoom = String(zoom); return () => { document.documentElement.style.zoom = ''; }; }, [zoom]);
  if (params.has('viewport')) return <ChatViewportExample zoom={zoom} theme={(params.get('theme') || 'neutral') as ThemeName} appearance={params.get('appearance') === 'plain' ? 'plain' : 'bubble'} />;
  return <ThemeProvider defaultTheme={(params.get('theme') || 'neutral') as ThemeName} data-rhine-motion={params.get('motion') === 'manual' ? 'reduced' : undefined}>
    <div style={{padding:16}}><ChatGallery initialLayout={params.get('layout') === 'standalone' ? 'standalone' : 'fill'} initialAppearance={params.get('appearance') === 'plain' ? 'plain' : 'bubble'} initialScene={params.get('scene') || 'pair'} /></div>
  </ThemeProvider>;
}


/** A true viewport host with a fixed header and one remaining-height reading region. */
export function ChatViewportExample({ zoom = 1, theme = 'neutral', appearance = 'bubble' }: { zoom?: number; theme?: ThemeName; appearance?: 'plain' | 'bubble' }) {
  const entries: ChatEntry[] = Array.from({ length: 24 }, (_, index) => ({
    id: `viewport-${index}`, kind: 'message', day: '今天', member: { id: index % 2 ? 'b' : 'a', name: index % 2 ? '成员 B' : '成员 A' },
    dateTime: `2026-10-29T10:${String(index).padStart(2, '0')}:00+08:00`, time: `10:${String(index).padStart(2, '0')}`,
    content: <p>合成消息 {index + 1}：保留完整内容与未知结果。运行结束不表示任务完成。</p>,
  }));
  return <ThemeProvider theme={theme} style={{ height: `calc(100dvh / ${zoom})`, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
    <header style={{ flex: 'none', padding: 12 }}><Text as="h1" variant="heading">剩余高度会话 · 合成数据</Text></header>
    <ChatThread label="全高聊天消息" layout="fill" appearance={appearance} controls="compact" style={{ flex: 1 }} entries={entries}
      memberAppearance={{ a: { align: 'end', tone: 'strong' }, b: { align: 'start', tone: 'subtle' } }} readOnly />
  </ThemeProvider>;
}
