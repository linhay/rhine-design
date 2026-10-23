import { useState } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppShell, Background, DataTable, DateRangePicker, Dialog, MediaCard, MediaViewer, NumberField, Pagination, RemoteMultiSelect, TreeSelect } from '../components';
import { ThemeProvider } from '../components/theme';

describe('controlled form extensions', () => {
  it('blocks global disabled tree expansion while keeping disabled nodes browsable in enabled trees', () => {
    const expand = vi.fn();
    const props = { label: '树', nodes: [{ id: 'root', label: '根', disabled: true, children: [{ id: 'child', label: '子' }] }], value: [], onValueChange: () => {}, expandedKeys: [], onExpandedChange: expand };
    const { rerender } = render(<TreeSelect {...props} disabled />);
    fireEvent.keyDown(screen.getByRole('treeitem', { name: '根' }), { key: 'ArrowRight' });
    expect(expand).not.toHaveBeenCalled(); expect(screen.getByRole('button', { name: '展开根' })).toBeDisabled();
    rerender(<TreeSelect {...props} />);
    fireEvent.keyDown(screen.getByRole('treeitem', { name: '根' }), { key: 'ArrowRight' }); expect(expand).toHaveBeenCalledWith(['root']);
  });
  it('retains intermediate number input and commits precision only on blur or Enter', () => {
    const change = vi.fn();
    render(<NumberField label="金额" value={1} onValueChange={change} min={-10} max={20} precision={2} step={0.25} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '-' } });
    expect(input).toHaveValue('-'); expect(change).not.toHaveBeenCalled();
    fireEvent.blur(input); expect(screen.getByRole('alert')).toHaveTextContent('有效数字');
    fireEvent.change(input, { target: { value: '1.' } }); expect(input).toHaveValue('1.');
    fireEvent.change(input, { target: { value: '1.238' } }); fireEvent.keyDown(input, { key: 'Enter' });
    expect(change).toHaveBeenLastCalledWith(1.24);
    fireEvent.change(input, { target: { value: '21' } }); fireEvent.blur(input);
    expect(input).toHaveValue('21'); expect(change).toHaveBeenCalledTimes(1);
    fireEvent.change(input, { target: { value: '' } }); fireEvent.blur(input);
    expect(change).toHaveBeenLastCalledWith(null);
  });
  it('steps with decimal precision and protects number IME input', () => {
    const change = vi.fn(); render(<NumberField label="金额" value={0.1} onValueChange={change} step={0.2} precision={2} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.compositionStart(input); fireEvent.keyDown(input, { key: 'Enter' }); expect(change).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input); fireEvent.keyDown(input, { key: 'ArrowUp' }); expect(change).toHaveBeenLastCalledWith(0.3);
  });
  it('uses date-only controlled values, range limits, presets and clear intent', () => {
    const change = vi.fn();
    render(<DateRangePicker label="范围" value={{ start: '2026-10-01', end: '2026-10-23' }} min="2026-01-01" max="2026-12-31" onValueChange={change} presets={[{ label: '超出范围', value: { start: '2025-01-01', end: '2025-12-31' } }]} />);
    expect(screen.getByLabelText('结束日期')).toHaveAttribute('min', '2026-10-01');
    expect(screen.getByRole('button', { name: '超出范围' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('开始日期'), { target: { value: '2026-10-05' } });
    expect(change).toHaveBeenLastCalledWith({ start: '2026-10-05', end: '2026-10-23' });
    fireEvent.click(screen.getByRole('button', { name: '清空日期' })); expect(change).toHaveBeenLastCalledWith({ start: '', end: '' });
  });
  it('keeps remote selections outside the current result set and does not locally filter', () => {
    const change = vi.fn(), query = vi.fn();
    const { rerender } = render(<RemoteMultiSelect label="远程" query="不匹配标签" onQueryChange={query} value={[{ value: 'old', label: '旧结果' }]} onValueChange={change} options={[{ value: 'new', label: '新结果' }]} />);
    const input = screen.getByRole('combobox'); fireEvent.focus(input); fireEvent.keyDown(input, { key: 'ArrowDown' }); fireEvent.keyDown(input, { key: 'Enter' });
    expect(change).toHaveBeenLastCalledWith([{ value: 'old', label: '旧结果' }, { value: 'new', label: '新结果' }]);
    rerender(<RemoteMultiSelect label="远程" query="" onQueryChange={query} value={[{ value: 'old', label: '旧结果' }]} onValueChange={change} options={[]} loading />);
    expect(screen.getByText('旧结果')).toBeVisible();
    fireEvent.compositionStart(input); fireEvent.change(input, { target: { value: '中' } }); expect(query).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input); expect(query).toHaveBeenLastCalledWith('中');
  });
  it('navigates tree hierarchy and selects parents independently of children', () => {
    function Demo() {
      const [value, setValue] = useState<string[]>(['child']), [expanded, setExpanded] = useState<string[]>([]);
      return <TreeSelect label="树" nodes={[{ id: 'root', label: '父节点', children: [{ id: 'child', label: '子节点' }, { id: 'locked', label: '禁选', disabled: true }] }]} value={value} onValueChange={setValue} expandedKeys={expanded} onExpandedChange={setExpanded} multiple />;
    }
    render(<Demo />); const parent = screen.getByRole('treeitem', { name: '父节点' }); parent.focus();
    fireEvent.keyDown(parent, { key: 'ArrowRight' }); expect(parent).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(parent, { key: ' ' }); expect(parent).toHaveAttribute('aria-checked', 'true');
    fireEvent.keyDown(parent, { key: 'ArrowRight' }); const child = screen.getByRole('treeitem', { name: '子节点' });
    expect(child).toHaveFocus(); expect(child).toHaveAttribute('aria-checked', 'true');
    fireEvent.keyDown(child, { key: 'ArrowDown' }); const locked = screen.getByRole('treeitem', { name: '禁选' }); expect(locked).toHaveFocus();
    fireEvent.keyDown(locked, { key: ' ' }); expect(locked).toHaveAttribute('aria-checked', 'false');
    fireEvent.keyDown(locked, { key: 'ArrowLeft' }); expect(parent).toHaveFocus();
  });
});

describe('server-owned data', () => {
  it('renders a numeric zero detail inside a region and associates its expansion control', () => {
    render(<DataTable caption="记录" rows={[{ id: 'a' }]} rowKey={row => row.id} columns={[{ key: 'id', header: 'ID', render: row => row.id }]} expansion={{ keys: ['a'], onChange: () => {}, renderDetail: () => 0 }} />);
    const detail = screen.getByRole('region', { name: 'a详情' }); expect(detail).toHaveTextContent('0');
    expect(screen.getByRole('button', { name: '收起a' })).toHaveAttribute('aria-controls', detail.id);
  });
  it('preserves off-page selection and disabled keys while selecting visible rows', () => {
    const change = vi.fn();
    const props = { caption: '记录', rows: [{ id: 'a' }, { id: 'b' }, { id: 'locked' }], rowKey: (row: { id: string }) => row.id, columns: [{ key: 'id', header: 'ID', render: (row: { id: string }) => row.id }] };
    const { rerender } = render(<DataTable {...props} selection={{ keys: ['off-page', 'a', 'locked'], onChange: change, isDisabled: row => row.id === 'locked' }} />);
    expect(screen.getByRole('checkbox', { name: '选择当前可见行' })).toBePartiallyChecked();
    fireEvent.click(screen.getByRole('checkbox', { name: '选择当前可见行' })); expect(change).toHaveBeenLastCalledWith(['off-page', 'a', 'locked', 'b']);
    rerender(<DataTable {...props} selection={{ keys: ['off-page', 'a', 'locked', 'b'], onChange: change, isDisabled: row => row.id === 'locked' }} />);
    fireEvent.click(screen.getByRole('checkbox', { name: '选择当前可见行' })); expect(change).toHaveBeenLastCalledWith(['off-page', 'locked']);
    expect(screen.getByRole('checkbox', { name: '选择locked' })).toBeDisabled();
  });
  it('renders controlled child rows and independent details without sorting', () => {
    const change = vi.fn(); const parent = { id: 'parent' };
    const { rerender } = render(<DataTable caption="层级" rows={[parent]} rowKey={row => row.id} columns={[{ key: 'id', header: 'ID', render: row => row.id }]} expansion={{ keys: [], onChange: change, getChildren: row => row.id === 'parent' ? [{ id: 'child' }] : [] }} />);
    fireEvent.click(screen.getByRole('button', { name: '展开parent' })); expect(change).toHaveBeenCalledWith(['parent']); expect(screen.queryByText('child')).not.toBeInTheDocument();
    rerender(<DataTable caption="层级" rows={[parent]} rowKey={row => row.id} columns={[{ key: 'id', header: 'ID', render: row => row.id }]} expansion={{ keys: ['parent'], onChange: change, getChildren: row => row.id === 'parent' ? [{ id: 'child' }] : [], renderDetail: row => <p>{row.id}详情内容</p> }} />);
    expect(screen.getByText('child')).toBeVisible(); expect(screen.getByRole('region', { name: 'parent详情' })).toHaveTextContent('详情内容');
    expect(screen.getByText('第 2 层')).toBeVisible();
  });
  it('emits page-size intent without implicitly changing the page', () => {
    const page = vi.fn(), size = vi.fn(); render(<Pagination page={2} pageSize={10} hasNext onPageChange={page} onPageSizeChange={size} />);
    fireEvent.change(screen.getByLabelText('每页条数'), { target: { value: '25' } }); expect(size).toHaveBeenCalledWith(25); expect(page).not.toHaveBeenCalled();
  });
});

describe('layout and media', () => {
  it('returns focus to a surviving shell control when the focused secondary panel is removed', () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    const bounds = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1200);
    const props = { navigation: { label: '导航', content: <button>导航条目</button>, open: true, onOpenChange: () => {} }, secondary: { label: '详情', content: <button>详情操作</button>, open: true, onOpenChange: () => {} }, children: <p>正文</p> };
    try {
      const { rerender } = render(<AppShell {...props} layout="left-right" />); screen.getByRole('button', { name: '详情操作' }).focus();
      rerender(<AppShell {...props} layout="single" />); expect(screen.getByRole('button', { name: '收起导航' })).toHaveFocus();
    } finally { bounds.mockRestore(); vi.unstubAllGlobals(); }
  });
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
  it('keeps media selection separate from opening and labels failed previews', () => {
    const open = vi.fn(), select = vi.fn(); render(<MediaCard title="文件" kind="RAW" state="error" onOpen={open} selected onSelectedChange={select} />);
    fireEvent.click(screen.getByRole('checkbox')); expect(select).toHaveBeenCalledWith(false); expect(open).not.toHaveBeenCalled();
    expect(screen.getByText('预览无法解码')).toBeVisible(); expect(screen.getByRole('status')).toHaveTextContent('预览失败');
    const opener = screen.getByRole('button', { name: '打开文件' }); fireEvent.click(opener); expect(open).toHaveBeenCalledOnce(); expect(opener).toHaveFocus();
  });
  it('closes nested dialogs in layers and returns focus to the media opener', async () => {
    render(<ThemeProvider><MediaViewer trigger={<button>打开媒体</button>} title="照片" description="演示" metadataOpen metadata={<Dialog trigger={<button>资源信息</button>} title="资源详情" description="嵌套"><p>信息</p></Dialog>}><img alt="演示" /></MediaViewer></ThemeProvider>);
    const trigger = screen.getByRole('button', { name: '打开媒体' }); trigger.focus(); fireEvent.click(trigger);
    const viewer = await screen.findByRole('dialog', { name: '照片' });
    const details = within(viewer).getByRole('button', { name: '资源信息' }); details.focus(); fireEvent.click(details);
    const nested = await screen.findByRole('dialog', { name: '资源详情' });
    fireEvent.keyDown(nested, { key: 'Escape' }); await waitFor(() => expect(screen.queryByRole('dialog', { name: '资源详情' })).not.toBeInTheDocument());
    await waitFor(() => expect(details).toHaveFocus()); expect(viewer).toBeVisible();
    fireEvent.keyDown(viewer, { key: 'Escape' }); await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    await act(async () => {});
  });
});
