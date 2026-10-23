import { createRef } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppShell, Background, Dialog, Drawer, MediaCard, MediaViewer } from '../components';
import { ThemeProvider } from '../components/theme';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function shellWidth(initialWidth: number) {
  let width = initialWidth, onResize = () => {};
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ width: width * 2 } as DOMRect));
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { onResize = callback; }
    observe() {} disconnect() {}
  });
  return (next: number) => act(() => { width = next; onResize(); });
}

describe('Ant Design / MUI shell and background contracts', () => {
  it('exposes the background DOM ref without creating another theme root or hiding native attributes', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<ThemeProvider><Background ref={ref} role="region" aria-label="局部背景" className="custom" style={{ padding: 12 }} appearance={{ color: 'pink' }} decoration="none">正文</Background></ThemeProvider>);
    expect(ref.current).toBe(screen.getByRole('region', { name: '局部背景' }));
    expect(ref.current).toHaveClass('rhine-background', 'custom');
    expect(ref.current).toHaveStyle({ padding: '12px', '--rhine-background-color': 'pink' });
    expect(container.querySelectorAll('.rhine-theme')).toHaveLength(1);
  });

  it('lets the host control the mobile drawer independently from the desktop open state', async () => {
    shellWidth(400);
    const onDrawerOpenChange = vi.fn(), onOpenChange = vi.fn();
    const navigation = { label: '导航', content: <button>导航项目</button>, open: true, onOpenChange, drawerOpen: false, onDrawerOpenChange };
    const { rerender } = render(<AppShell layout="single" navigation={navigation}>正文</AppShell>);
    fireEvent.click(screen.getByRole('button', { name: '导航' }));
    expect(onDrawerOpenChange).toHaveBeenLastCalledWith(true);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(<AppShell layout="single" navigation={{ ...navigation, drawerOpen: true }}>正文</AppShell>);
    expect(screen.getByRole('dialog', { name: '导航' })).toHaveAttribute('data-side', 'left');
    fireEvent.click(screen.getByRole('button', { name: '关闭抽屉' }));
    expect(onDrawerOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    rerender(<AppShell layout="single" navigation={navigation}>正文</AppShell>);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('supports a default-open drawer and keeps its side aligned with the desktop panel', async () => {
    shellWidth(400);
    const panel = { label: '导航', content: <p>导航内容</p>, open: true, onOpenChange: vi.fn() };
    const secondary = { ...panel, label: '详情', defaultDrawerOpen: true };
    const { rerender } = render(<AppShell layout="left-right" navigation={panel} secondary={secondary}>正文</AppShell>);
    expect(screen.getByRole('dialog', { name: '详情' })).toHaveAttribute('data-side', 'right');
    fireEvent.click(screen.getByRole('button', { name: '关闭抽屉' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    rerender(<AppShell layout="double-left" navigation={panel} secondary={secondary}>正文</AppShell>);
    fireEvent.click(screen.getByRole('button', { name: '详情' }));
    expect(screen.getByRole('dialog', { name: '详情' })).toHaveAttribute('data-side', 'left');
  });

  it('uses custom container breakpoints and widths while returning focus when a pane hides', () => {
    const resize = shellWidth(1000);
    render(<AppShell layout="single" className="custom-shell" style={{ height: 600 }} navigation={{ label: '导航', content: <button>导航项目</button>, open: true, onOpenChange: vi.fn(), width: 300, breakpoint: 900 }}>正文</AppShell>);
    const pane = screen.getByRole('complementary', { name: '导航' });
    expect(pane).toHaveStyle({ flexBasis: '300px' });
    expect(screen.getByRole('region', { name: '应用工作区' })).toHaveClass('custom-shell');
    expect(screen.getByRole('region', { name: '应用工作区' })).toHaveStyle({ height: '600px' });
    screen.getByRole('button', { name: '导航项目' }).focus();
    resize(899);
    expect(pane).not.toBeVisible();
    expect(screen.getByRole('button', { name: '导航' })).toHaveFocus();
    resize(900);
    expect(pane).toBeVisible();
  });

  it('keeps the existing Drawer default on the right and supports an explicit left side', () => {
    const props = { trigger: <button>打开</button>, title: '抽屉', description: '描述', open: true, children: <p>内容</p> };
    const { rerender } = render(<Drawer {...props} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('data-side', 'right');
    rerender(<Drawer {...props} side="left" />);
    expect(screen.getByRole('dialog')).toHaveAttribute('data-side', 'left');
  });
});

describe('Ant Design / MUI media contracts', () => {
  it('keeps card actions separate from selection and opening, including an error retry', () => {
    const onOpen = vi.fn(), onSelectedChange = vi.fn(), retry = vi.fn(), ref = createRef<HTMLElement>();
    const { rerender } = render(<MediaCard ref={ref} title="照片" kind="photo" state="error" onOpen={onOpen} onSelectedChange={onSelectedChange} className="custom-card" style={{ maxWidth: 320 }} actions={<button onClick={retry}>重新加载</button>} />);
    fireEvent.click(screen.getByRole('button', { name: '重新加载' }));
    expect(retry).toHaveBeenCalledOnce(); expect(onOpen).not.toHaveBeenCalled(); expect(onSelectedChange).not.toHaveBeenCalled();
    expect(ref.current).toHaveClass('custom-card'); expect(ref.current).toHaveStyle({ maxWidth: '320px' });
    fireEvent.click(screen.getByRole('checkbox')); expect(onSelectedChange).toHaveBeenCalledWith(true);
    rerender(<MediaCard title="照片" kind="photo" onOpen={onOpen} onSelectedChange={onSelectedChange} disabled />);
    expect(screen.getByRole('button', { name: '打开照片' })).toBeDisabled(); expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('has an uncontrolled default-open viewer and a working uncontrolled metadata toggle', async () => {
    render(<MediaViewer trigger={<button>打开</button>} title="照片" description="描述" defaultOpen defaultMetadataOpen metadata={0} className="custom-viewer" style={{ paddingTop: 4 }}><p>预览</p></MediaViewer>);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('custom-viewer'); expect(dialog).toHaveStyle({ paddingTop: '4px' });
    const information = screen.getByRole('complementary', { name: '媒体信息' });
    expect(information).toHaveTextContent('0');
    expect(screen.getByRole('button', { name: '收起信息' })).toHaveAttribute('aria-controls', information.id);
    fireEvent.click(screen.getByRole('button', { name: '收起信息' })); expect(information).not.toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '显示信息' })); expect(information).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '关闭媒体查看器' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('does not mutate controlled metadata until the host updates the prop', () => {
    const change = vi.fn();
    const props = { trigger: <button>打开</button>, title: '照片', description: '描述', open: true, metadata: <p>详细信息</p>, onMetadataOpenChange: change, children: <p>预览</p> };
    const { rerender } = render(<MediaViewer {...props} metadataOpen={false} />);
    fireEvent.click(screen.getByRole('button', { name: '显示信息' }));
    expect(change).toHaveBeenCalledWith(true); expect(screen.getByText('详细信息')).not.toBeVisible();
    rerender(<MediaViewer {...props} metadataOpen />);
    expect(screen.getByRole('complementary', { name: '媒体信息' })).toBeVisible();
  });

  it('navigates by arrow keys, respects independent boundaries, and allows opting out', () => {
    const previous = vi.fn(), next = vi.fn();
    const props = { trigger: <button>打开</button>, title: '照片', description: '描述', open: true, onPrevious: previous, onNext: next, children: <p>预览</p> };
    const { rerender } = render(<MediaViewer {...props} previousDisabled />);
    const dialog = screen.getByRole('dialog');
    expect(screen.getByRole('button', { name: '上一项' })).toBeDisabled();
    fireEvent.keyDown(dialog, { key: 'ArrowLeft' }); expect(previous).not.toHaveBeenCalled();
    fireEvent.keyDown(dialog, { key: 'ArrowRight' }); expect(next).toHaveBeenCalledOnce();
    screen.getByRole('button', { name: '下一项' }).focus();
    rerender(<MediaViewer {...props} nextDisabled />);
    expect(dialog).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'ArrowLeft' }); expect(previous).toHaveBeenCalledOnce();
    fireEvent.keyDown(dialog, { key: 'ArrowRight' }); expect(next).toHaveBeenCalledOnce();
    rerender(<MediaViewer {...props} keyboardNavigation={false} />);
    fireEvent.keyDown(dialog, { key: 'ArrowLeft' }); expect(previous).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: '上一项' })).not.toHaveAttribute('aria-keyshortcuts');
    fireEvent.click(screen.getByRole('button', { name: '下一项' })); expect(next).toHaveBeenCalledTimes(2);
  });

  it('leaves editor, media, modified, composition and nested dialog arrow keys to their owners', () => {
    const next = vi.fn();
    render(<MediaViewer trigger={<button>打开</button>} title="照片" description="描述" open onNext={next} actions={<Dialog trigger={<button>编辑详情</button>} title="编辑" description="编辑媒体"><button>内部按钮</button></Dialog>}>
      <input aria-label="文件名" /><video aria-label="播放视频" controls /><div contentEditable suppressContentEditableWarning aria-label="注释">文字</div><div role="slider" aria-label="缩放" tabIndex={0} />
    </MediaViewer>);
    for (const control of [screen.getByRole('textbox'), screen.getByLabelText('播放视频'), screen.getByLabelText('注释'), screen.getByRole('slider')]) fireEvent.keyDown(control, { key: 'ArrowRight' });
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'ArrowRight', ctrlKey: true });
    fireEvent.keyDown(dialog, { key: 'ArrowRight', isComposing: true });
    fireEvent.click(screen.getByRole('button', { name: '编辑详情' }));
    fireEvent.keyDown(within(screen.getByRole('dialog', { name: '编辑' })).getByRole('button', { name: '内部按钮' }), { key: 'ArrowRight' });
    expect(next).not.toHaveBeenCalled();
  });
});
