import { useEffect } from 'react';
import { ThemeProvider, type ThemeName } from '../components/theme';
import { ChatMemberLinkGallery } from './ChatMemberLinkGallery';

/** Production showcase entry with the same public components as the main gallery. */
export function ChatMemberLinkFixture() {
  const params = new URLSearchParams(location.search), zoom = Number(params.get('zoom')) || 1;
  useEffect(() => { document.documentElement.style.zoom = String(zoom); return () => { document.documentElement.style.zoom = ''; }; }, [zoom]);
  return <ThemeProvider defaultTheme={(params.get('theme') || 'rhine') as ThemeName} data-rhine-motion={params.get('motion') === 'manual' ? 'reduced' : undefined}>
    <main style={{ padding: 16 }}><ChatMemberLinkGallery initialScene={params.get('scene') || 'pair'} initialAppearance={params.get('appearance') === 'bubble' ? 'bubble' : 'plain'} /></main>
  </ThemeProvider>;
}
