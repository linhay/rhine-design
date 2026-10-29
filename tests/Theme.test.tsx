import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider, themes, useTheme, type ThemeName } from '@linhey/rhine-design/theme';
import { Button, Dialog } from '../components';

function Controls() {
  const { theme, setTheme } = useTheme();
  const [count, setCount] = useState(0);
  return <>
    <output aria-label="当前主题">{theme}</output>
    {themes.map(item => <button key={item.name} onClick={() => setTheme(item.name)}>{item.label}</button>)}
    <button onClick={() => setCount(count + 1)}>计数 {count}</button>
    <input aria-label="草稿" defaultValue="" />
  </>;
}

describe('public theme API', () => {
  it('defaults to rhine and preserves the DOM, state and input across all themes', () => {
    const onThemeChange = vi.fn();
    render(<ThemeProvider onThemeChange={onThemeChange} className="host" id="app" data-rhine-motion="reduced"><Controls /></ThemeProvider>);
    const root = document.getElementById('app')!;
    expect(root).toHaveClass('rhine-theme', 'host');
    expect(root).toHaveAttribute('data-rhine-motion', 'reduced');
    expect(root).toHaveAttribute('data-rhine-theme', 'rhine');
    fireEvent.click(screen.getByRole('button', { name: '计数 0' }));
    const input = screen.getByRole('textbox', { name: '草稿' });
    fireEvent.change(input, { target: { value: '未保存的内容' } });
    for (const name of ['arknights', 'neo-brutalism', 'neutral', 'rhine'] as const) {
      fireEvent.click(screen.getByRole('button', { name: themes.find(item => item.name === name)!.label }));
      expect(root).toHaveAttribute('data-rhine-theme', name);
      expect(screen.getByLabelText('当前主题')).toHaveTextContent(name);
      expect(screen.getByRole('textbox')).toBe(input);
      expect(input).toHaveValue('未保存的内容');
      expect(screen.getByRole('button', { name: '计数 1' })).toBeInTheDocument();
    }
    expect(onThemeChange.mock.calls).toEqual([['arknights'], ['neo-brutalism'], ['neutral'], ['rhine']]);
    fireEvent.click(screen.getByRole('button', { name: '莱茵 · 纸面' }));
    expect(onThemeChange).toHaveBeenCalledTimes(4);
  });

  it('uses defaultTheme only on mount', () => {
    const { rerender } = render(<ThemeProvider defaultTheme="arknights"><Controls /></ThemeProvider>);
    expect(screen.getByLabelText('当前主题')).toHaveTextContent('arknights');
    rerender(<ThemeProvider defaultTheme="neo-brutalism"><Controls /></ThemeProvider>);
    expect(screen.getByLabelText('当前主题')).toHaveTextContent('arknights');
  });

  it('leaves controlled updates to the host and follows subsequent props', () => {
    const onThemeChange = vi.fn();
    const { rerender } = render(<ThemeProvider theme="rhine" onThemeChange={onThemeChange}><Controls /></ThemeProvider>);
    fireEvent.click(screen.getByRole('button', { name: '明日方舟 · 战术终端' }));
    expect(onThemeChange).toHaveBeenCalledWith('arknights');
    expect(screen.getByLabelText('当前主题')).toHaveTextContent('rhine');
    rerender(<ThemeProvider theme="arknights" onThemeChange={onThemeChange}><Controls /></ThemeProvider>);
    expect(screen.getByLabelText('当前主题')).toHaveTextContent('arknights');
    expect(onThemeChange).toHaveBeenCalledTimes(1);
  });

  it('keeps sibling providers independent', () => {
    render(<><ThemeProvider aria-label="A"><Controls /></ThemeProvider><ThemeProvider aria-label="B" defaultTheme="neo-brutalism"><Controls /></ThemeProvider></>);
    const a = screen.getByLabelText('A'), b = screen.getByLabelText('B');
    fireEvent.click(within(a).getByRole('button', { name: '明日方舟 · 战术终端' }));
    expect(a).toHaveAttribute('data-rhine-theme', 'arknights');
    expect(b).toHaveAttribute('data-rhine-theme', 'neo-brutalism');
    expect(within(b).getByLabelText('当前主题')).toHaveTextContent('neo-brutalism');
  });

  it('does not read or write host storage', () => {
    const read = vi.spyOn(Storage.prototype, 'getItem');
    const write = vi.spyOn(Storage.prototype, 'setItem');
    try {
      render(<ThemeProvider><Controls /></ThemeProvider>);
      fireEvent.click(screen.getByRole('button', { name: '明日方舟 · 战术终端' }));
      expect(read).not.toHaveBeenCalled();
      expect(write).not.toHaveBeenCalled();
    } finally { read.mockRestore(); write.mockRestore(); }
  });

  it('keeps an open dialog in the same theme root, preserving its draft and focus', () => {
    render(<ThemeProvider><Dialog trigger={<Button>打开</Button>} title="主题测试" description="保持浮层状态"><Controls /></Dialog></ThemeProvider>);
    const trigger = screen.getByRole('button', { name: '打开' });
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog');
    const root = trigger.closest('.rhine-theme');
    expect(dialog.closest('.rhine-theme')).toBe(root);
    fireEvent.change(within(dialog).getByRole('textbox'), { target: { value: '浮层草稿' } });
    const switcher = within(dialog).getByRole('button', { name: '明日方舟 · 战术终端' });
    switcher.focus();
    fireEvent.click(switcher);
    expect(root).toHaveAttribute('data-rhine-theme', 'arknights');
    expect(screen.getByRole('dialog')).toBe(dialog);
    expect(within(dialog).getByRole('textbox')).toHaveValue('浮层草稿');
    expect(switcher).toHaveFocus();
  });

  it('explains missing providers, nested providers and invalid theme names', () => {
    expect(() => render(<Controls />)).toThrow('useTheme must be used within');
    expect(() => render(<ThemeProvider><ThemeProvider /></ThemeProvider>)).toThrow('Nested Rhine ThemeProvider is not supported');
    expect(() => render(<ThemeProvider theme={'unknown' as ThemeName} />)).toThrow('Unknown Rhine theme');
  });

  it('rejects invalid imperative requests without updating state or notifying the host', () => {
    let setTheme: (theme: ThemeName) => void = () => {};
    function Capture() { setTheme = useTheme().setTheme; return null; }
    const onThemeChange = vi.fn();
    render(<ThemeProvider onThemeChange={onThemeChange}><Capture /><Controls /></ThemeProvider>);
    expect(() => setTheme('unknown' as ThemeName)).toThrow('Unknown Rhine theme');
    expect(screen.getByLabelText('当前主题')).toHaveTextContent('rhine');
    expect(onThemeChange).not.toHaveBeenCalled();
  });
});
