import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AppShell, Background } from '../components';
import { ThemeProvider } from '../components/theme';

describe('background integration', () => {
  it('does not introduce a theme root for a local background', () => {
    const { container } = render(<ThemeProvider defaultTheme="neo-brutalism"><Background decoration="none"><p>正文</p></Background></ThemeProvider>);
    expect(container.querySelectorAll('.rhine-theme')).toHaveLength(1); expect(container.querySelector('.rhine-background')).toHaveAttribute('data-decoration', 'none');
  });
  it('retains body input through layout, panel and theme changes', () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    const bounds = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1200);
    function Demo() {
      const [layout, setLayout] = useState<'single' | 'left-right'>('single'), [open, setOpen] = useState(true), [dark, setDark] = useState(false);
      return <ThemeProvider theme={dark ? 'arknights' : 'rhine'}><button onClick={() => { setLayout('left-right'); setDark(true); }}>切换</button><AppShell layout={layout} navigation={{ label: '导航', open, onOpenChange: setOpen, content: <p>导航内容</p> }}><input aria-label="草稿" defaultValue="保留" /></AppShell></ThemeProvider>;
    }
    try { render(<Demo />); const input = screen.getByLabelText('草稿'); fireEvent.change(input, { target: { value: '已修改' } }); fireEvent.click(screen.getByRole('button', { name: '收起导航' })); fireEvent.click(screen.getByText('切换')); expect(screen.getByLabelText('草稿')).toBe(input); expect(input).toHaveValue('已修改'); }
    finally { bounds.mockRestore(); vi.unstubAllGlobals(); }
  });
});
