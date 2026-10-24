import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { AppShell, AppShellToggle } from '../components';
import { ThemeProvider } from '../components/theme';

function Demo({ navigationBar = false }: { navigationBar?: boolean }) {
  const [open, setOpen] = useState(true);
  return <ThemeProvider><AppShell controls="inline" layout="single" navigation={{ label: '导航', open, onOpenChange: setOpen,
    content: <div aria-label="品牌区"><strong>Workspace</strong><AppShellToggle placement="panel" iconOnly /><button>导航项</button></div> }}
    contentHeader={navigationBar ? <nav aria-label="工作区导航"><AppShellToggle placement="content" iconOnly /><h1>收件箱</h1></nav> : undefined}>
    {!navigationBar && <AppShellToggle placement="content" iconOnly />}<input aria-label="草稿" defaultValue="保留" />
  </AppShell></ThemeProvider>;
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe('inline shell controls', () => {
  it('keeps navigation outside the body and preserves drafts when navigation changes', () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1040);
    const { rerender } = render(<Demo navigationBar />);
    const input = screen.getByLabelText('草稿');
    fireEvent.change(input, { target: { value: '未保存的编辑' } });
    expect(screen.getByRole('region', { name: '正文' })).not.toContainElement(screen.getByRole('navigation', { name: '工作区导航' }));
    const collapse = screen.getByRole('button', { name: '收起导航' });
    collapse.focus(); fireEvent.click(collapse);
    const expand = within(screen.getByRole('navigation', { name: '工作区导航' })).getByRole('button', { name: '展开导航' });
    expect(expand).toHaveFocus();
    fireEvent.click(expand);
    rerender(<Demo />);
    expect(screen.getByLabelText('草稿')).toBe(input);
    expect(input).toHaveValue('未保存的编辑');
  });
  it('collapses from the brand and restores focus without a standalone header', () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1040);
    const { container } = render(<Demo />);
    expect(container.querySelector('.rhine-shell__header')).toBeNull();
    const input = screen.getByLabelText('草稿');
    const collapse = within(screen.getByLabelText('品牌区')).getByRole('button', { name: '收起导航' });
    collapse.focus(); fireEvent.click(collapse);
    const expand = screen.getByRole('button', { name: '展开导航' });
    expect(expand).toHaveFocus();
    fireEvent.click(expand);
    expect(screen.getByRole('button', { name: '收起导航' })).toHaveFocus();
    expect(screen.getByLabelText('草稿')).toBe(input);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('opens the narrow drawer and returns focus after Escape', async () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400);
    render(<Demo />);
    const trigger = screen.getByRole('button', { name: '导航' });
    trigger.focus(); fireEvent.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: '导航' });
    expect(within(dialog).getByText('Workspace')).toBeVisible();
    expect(screen.queryByRole('button', { name: '收起导航' })).toBeNull();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(trigger).toHaveFocus());
  });
  it('moves focused navigation to the content trigger when the container becomes narrow', () => {
    let resize = () => {};
    vi.stubGlobal('ResizeObserver', class { constructor(callback: () => void) { resize = callback; } observe() {} disconnect() {} });
    const width = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1040);
    render(<Demo />);
    screen.getByRole('button', { name: '导航项' }).focus();
    width.mockReturnValue(400); act(resize);
    expect(screen.getByRole('button', { name: '导航' })).toHaveFocus();
  });
  it('returns to the brand after closing a drawer that was resized to desktop', async () => {
    let resize = () => {};
    vi.stubGlobal('ResizeObserver', class { constructor(callback: () => void) { resize = callback; } observe() {} disconnect() {} });
    const width = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400);
    render(<Demo />);
    fireEvent.click(screen.getByRole('button', { name: '导航' }));
    const dialog = await screen.findByRole('dialog', { name: '导航' });
    width.mockReturnValue(1040); act(resize);
    expect(dialog).toBeVisible();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(screen.getByRole('button', { name: '收起导航' })).toHaveFocus());
  });
});
