import { useState } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox, DataTable, Pagination } from '../components';

const rows = [{ id: 'b' }, { id: 'a' }, { id: 'locked' }];
const columns = [{ key: 'id', header: '标识', render: (row: { id: string }) => row.id }];
const base = { caption: '记录', rows, columns, rowKey: (row: { id: string }) => row.id };

describe('DataTable framework parity', () => {
  it.each(['multiple', 'single'] as const)('retains full %s row names, native labels and disabled state beside ordinary visible labels', mode => {
    const name = '跨区域协作资料'.repeat(12) + 'WorkspaceArchiveABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    render(<><Checkbox label="普通表单标签" /><DataTable {...base} rowLabel={row => row.id === 'b' ? name : row.id}
      selection={{ mode, keys: ['b'], onChange: () => {}, isDisabled: row => row.id === 'locked' }} /></>);
    const input = screen.getByRole(mode === 'single' ? 'radio' : 'checkbox', { name: `选择${name}` });
    expect(input).toBeChecked();
    expect(input.closest('label')).toHaveTextContent(`选择${name}`);
    expect(input.closest('td')).toHaveClass('rhine-table__selection');
    expect(screen.getByRole(mode === 'single' ? 'radio' : 'checkbox', { name: '选择locked' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: '普通表单标签' }).closest('label')).toHaveTextContent('普通表单标签');
    expect(screen.getByText('普通表单标签').closest('.rhine-table__selection')).toBeNull();
  });

  it('keeps native table and scroll-region names when a duplicate caption is visually hidden', () => {
    const {rerender} = render(<DataTable {...base} />);
    const table = screen.getByRole('table',{name:'记录'});
    const region = screen.getByRole('region',{name:'记录，可横向滚动'});
    const caption = table.querySelector('caption')!;
    expect(caption).toHaveTextContent('记录');
    expect(caption).not.toHaveClass('rhine-sr-only');
    expect(region).toHaveAttribute('tabindex','0');
    rerender(<DataTable {...base} captionVisibility="hidden" />);
    expect(screen.getByRole('table',{name:'记录'})).toBe(table);
    expect(screen.getByRole('region',{name:'记录，可横向滚动'})).toBe(region);
    expect(table.querySelector('caption')).toBe(caption);
    expect(caption).toHaveClass('rhine-sr-only');
    expect(caption).not.toHaveAttribute('hidden');
    expect(caption).not.toHaveAttribute('aria-hidden');
    region.focus();expect(region).toHaveFocus();
    rerender(<DataTable {...base} captionVisibility="visible" />);
    expect(caption).not.toHaveClass('rhine-sr-only');
    expect(screen.getByRole('table',{name:'记录'})).toBe(table);
    expect(region).toHaveFocus();
  });

  it('offers controlled native single selection without a misleading select-all action', () => {
    const change = vi.fn();
    render(<DataTable {...base} selection={{ mode: 'single', keys: ['off-page'], onChange: change, isDisabled: row => row.id === 'locked' }} />);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '选择locked' })).toBeDisabled();
    fireEvent.click(screen.getByRole('radio', { name: '选择b' }));
    expect(change).toHaveBeenLastCalledWith(['b']);
    expect(screen.getByRole('radio', { name: '选择b' })).not.toBeChecked();
    expect(new Set(screen.getAllByRole('radio').map(input => input.getAttribute('name'))).size).toBe(1);
  });

  it('can hide bulk selection while retaining controlled off-page keys', () => {
    const change = vi.fn();
    render(<DataTable {...base} selection={{ keys: ['off-page', 'locked'], hideSelectAll: true, onChange: change }} />);
    expect(screen.queryByRole('checkbox', { name: '选择当前可见行' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: '选择b' }));
    expect(change).toHaveBeenLastCalledWith(['off-page', 'locked', 'b']);
  });

  it('offers an explicit sort reset without reordering supplied rows or altering the legacy sort callback', () => {
    const sort = vi.fn(), reset = vi.fn();
    const props = { ...base, columns: [{ ...columns[0], sortable: true }] };
    const { rerender } = render(<DataTable {...props} sort={{ key: 'id', direction: 'desc' }} onSortChange={sort} onSortReset={reset} />);
    expect(screen.getByRole('columnheader', { name: '标识' })).toHaveAttribute('aria-sort', 'descending');
    fireEvent.click(screen.getByRole('button', { name: '清除排序' }));
    expect(reset).toHaveBeenCalledOnce(); expect(sort).not.toHaveBeenCalled();
    expect(screen.getAllByRole('cell').map(cell => cell.textContent)).toEqual(['b', 'a', 'locked']);
    rerender(<DataTable {...props} onSortChange={sort} onSortReset={reset} />);
    expect(screen.queryByRole('button', { name: '清除排序' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '标识' }));
    expect(sort).toHaveBeenLastCalledWith({ key: 'id', direction: 'asc' });
  });

  it('honors expansion eligibility even when stale controlled keys still contain the row', () => {
    const detail = vi.fn(() => '详情');
    render(<DataTable {...base} expansion={{ keys: ['b'], onChange: () => {}, getChildren: () => [{ id: 'child' }], renderDetail: detail, canExpand: () => false }} />);
    expect(screen.queryByRole('button', { name: '收起b' })).not.toBeInTheDocument();
    expect(screen.queryByText('child')).not.toBeInTheDocument();
    expect(detail).not.toHaveBeenCalled();
  });

  it('returns reset focus to the column control before a controlled update removes the reset action', () => {
    function Demo() {
      const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | undefined>({ key: 'id', direction: 'asc' });
      return <DataTable {...base} columns={[{ ...columns[0], sortable: true }]} sort={sort} onSortChange={setSort} onSortReset={() => setSort(undefined)} />;
    }
    render(<Demo />);
    const reset = screen.getByRole('button', { name: '清除排序' }); reset.focus(); fireEvent.click(reset);
    expect(screen.queryByRole('button', { name: '清除排序' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '标识' })).toHaveFocus();
  });

  it('retains detail associations across server reorder and exposes optional row headers', () => {
    const props = { ...base, columns: [{ ...columns[0], rowHeader: true }], expansion: { keys: ['b'], onChange: () => {}, renderDetail: () => 0 } };
    const { rerender } = render(<DataTable {...props} />);
    const detail = screen.getByRole('region', { name: 'b详情' }), detailId = detail.id;
    expect(screen.getByRole('rowheader', { name: 'b' })).toHaveAttribute('scope', 'row');
    expect(detail).toHaveTextContent('0');
    rerender(<DataTable {...props} rows={[rows[1], rows[0]]} />);
    expect(screen.getByRole('region', { name: 'b详情' }).id).toBe(detailId);
    expect(screen.getByRole('button', { name: '收起b' })).toHaveAttribute('aria-controls', detailId);
  });

  it('observes the scroll viewport, reserves the widest body column and restores offsets without remounting rows', () => {
    let resize: (() => void) | undefined, available = 600;
    const observed: Element[] = [];
    const disconnect = vi.fn();
    const widths: Record<string, number> = { first: 100, name: 300, last: 100 };
    vi.stubGlobal('ResizeObserver', class { constructor(callback: () => void) { resize = callback; } observe(el: Element) { observed.push(el); } disconnect = disconnect; });
    const measure = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function(this: HTMLElement) { return widths[this.dataset.columnKey ?? ''] ?? 76; });
    const viewport = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => available);
    try {
      const pinned = [
        { ...columns[0], key: 'first', header: '首列', sticky: 'left' as const, stickyOffset: 12 },
        { ...columns[0], key: 'name', header: '正文' },
        { ...columns[0], key: 'last', header: '末列', sticky: 'right' as const, stickyOffset: 8 },
      ];
      const { unmount } = render(<DataTable {...base} columns={pinned} selection={{ keys: [], onChange: () => {} }} />);
      const region = screen.getByRole('region'), first = screen.getByRole('columnheader', { name: '首列' });
      const input = screen.getByRole('checkbox', { name: '选择b' });
      const reveal = vi.fn(); input.scrollIntoView = reveal; input.focus();
      expect(reveal).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' }); reveal.mockClear();
      expect(observed).toContain(region);
      expect(first).toHaveAttribute('data-sticky', 'left');
      expect(region).toHaveStyle({ scrollPaddingLeft: '112px', scrollPaddingRight: '108px' });
      available = 500; act(() => resize?.()); // 112 + 108 + 300 exceeds 500 despite 76px selection fitting.
      expect(first).not.toHaveAttribute('data-sticky');
      expect(first.style.left).toBe('');
      expect(input).toHaveFocus(); expect(screen.getByRole('checkbox', { name: '选择b' })).toBe(input);
      expect(reveal).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
      available = 700; act(() => resize?.());
      expect(first).toHaveAttribute('data-sticky', 'left'); expect(first).toHaveStyle({ left: '12px' });
      widths.name = 520; act(() => resize?.());
      expect(first).not.toHaveAttribute('data-sticky'); // Actual content width wins over the host's old budget.
      unmount(); expect(disconnect).toHaveBeenCalled();
    } finally { measure.mockRestore(); viewport.mockRestore(); vi.unstubAllGlobals(); }
  });

  it('reserves implicit selection and detail columns even when every data column is pinned', () => {
    let resize: (() => void) | undefined, available = 260;
    vi.stubGlobal('ResizeObserver', class { constructor(callback: () => void) { resize = callback; } observe() {} disconnect() {} });
    const measure = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function(this: HTMLElement) { return this.dataset.columnKey ? 100 : this.classList.contains('rhine-table__selection') ? 76 : 96; });
    const viewport = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => available);
    try {
      render(<DataTable {...base} columns={[{ ...columns[0], key: 'left', sticky: 'left' }, { ...columns[0], key: 'right', sticky: 'right' }]}
        selection={{ keys: [], onChange: () => {} }} expansion={{ keys: [], onChange: () => {}, renderDetail: row => row.id }} />);
      expect(screen.getByRole('table').querySelector('[data-sticky]')).toBeNull();
      available = 300; act(() => resize?.());
      expect(screen.getByRole('table').querySelector('[data-sticky]')).not.toBeNull();
    } finally { measure.mockRestore(); viewport.mockRestore(); vi.unstubAllGlobals(); }
  });

  it('measures only its own headers and treats an empty string column key as a data column', () => {
    const observations: Element[][] = [];
    vi.stubGlobal('ResizeObserver', class {
      elements: Element[] = [];
      constructor() { observations.push(this.elements); }
      observe(el: Element) { this.elements.push(el); }
      disconnect() {}
    });
    const measure = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function(this: HTMLElement) {
      if (this.closest('table')?.caption?.textContent === '内层') return 1000;
      return this.hasAttribute('data-column-key') ? this.dataset.columnKey === 'body' ? 300 : 100 : 76;
    });
    const viewport = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(600);
    try {
      render(<DataTable {...base} columns={[
        { ...columns[0], key: '', header: '空键列', sticky: 'left' },
        { ...columns[0], key: 'second', header: '第二列', sticky: 'left' },
        { ...columns[0], key: 'body', header: '正文' },
      ]} expansion={{ keys: ['b'], onChange: () => {}, renderDetail: () => <DataTable {...base} caption="内层" columns={[{ ...columns[0], key: 'inner', header: '内层列', sticky: 'right' }]} /> }} />);
      const outer = screen.getByRole('table', { name: '记录' });
      const second = within(outer).getByRole('columnheader', { name: '第二列' });
      expect(second).toHaveAttribute('data-sticky', 'left'); expect(second).toHaveStyle({ left: '100px' });
      const own = observations.find(elements => elements.includes(outer.parentElement!))!;
      expect(own.filter(el => el.tagName === 'TH')).toHaveLength(4);
      expect(own).not.toContain(screen.getByRole('columnheader', { name: '内层列' }));
    } finally { measure.mockRestore(); viewport.mockRestore(); vi.unstubAllGlobals(); }
  });

  it('accumulates actual pinned-column widths after layout changes and honors explicit offsets', () => {
    let resize: (() => void) | undefined;
    const widths: Record<string, number> = { first: 140, second: 160, third: 100, fourth: 120 };
    vi.stubGlobal('ResizeObserver', class { constructor(callback: () => void) { resize = callback; } observe() {} disconnect() {} });
    const measure = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function(this: HTMLElement) { return widths[this.dataset.columnKey ?? ''] ?? 0; });
    const viewport = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(900);
    try {
      const pinned = [
        { ...columns[0], key: 'first', header: '一', sticky: 'left' as const },
        { ...columns[0], key: 'second', header: '二', sticky: 'left' as const },
        { ...columns[0], key: 'third', header: '三', sticky: 'right' as const },
        { ...columns[0], key: 'fourth', header: '四', sticky: 'right' as const, stickyOffset: 8 },
      ];
      render(<DataTable {...base} columns={pinned} />);
      expect(screen.getByRole('columnheader', { name: '二' })).toHaveStyle({ left: '140px' });
      expect(screen.getByRole('columnheader', { name: '三' })).toHaveStyle({ right: '128px' });
      widths.first = 190;
      act(() => resize?.());
      expect(screen.getByRole('columnheader', { name: '二' })).toHaveStyle({ left: '190px' });
    } finally { measure.mockRestore(); viewport.mockRestore(); vi.unstubAllGlobals(); }
  });
});

describe('Pagination framework parity', () => {
  it('supports controlled first and last actions, and never invents a last page for unknown totals', () => {
    const change = vi.fn();
    const props = { page: 4, pageSize: 10, onPageChange: change, showFirstButton: true, showLastButton: true };
    const { rerender } = render(<Pagination {...props} total={91} />);
    fireEvent.click(screen.getByRole('button', { name: '首页' })); expect(change).toHaveBeenLastCalledWith(1);
    fireEvent.click(screen.getByRole('button', { name: '末页' })); expect(change).toHaveBeenLastCalledWith(10);
    rerender(<Pagination {...props} hasNext />);
    expect(screen.getByRole('button', { name: '末页' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '下一页' })).toBeEnabled();
  });

  it('reports out-of-range server state and explicitly returns to a known page without an automatic request', () => {
    const change = vi.fn();
    render(<Pagination page={8} pageSize={10} total={23} onPageChange={change} />);
    expect(screen.getByRole('status')).toHaveTextContent('第 8 页（已超出 3 页）');
    expect(change).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '下一页' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '上一页' }));
    expect(change).toHaveBeenLastCalledWith(3);
  });

  it('sanitizes non-finite values without treating unknown totals as zero', () => {
    const change = vi.fn();
    const { rerender } = render(<Pagination page={NaN} pageSize={Infinity} total={NaN} hasNext onPageChange={change} onPageSizeChange={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('第 1 页');
    expect(screen.getByLabelText('每页条数')).toHaveValue('1');
    fireEvent.click(screen.getByRole('button', { name: '下一页' })); expect(change).toHaveBeenLastCalledWith(2);
    rerender(<Pagination page={1} pageSize={10} total={0} onPageChange={change} />);
    expect(screen.getByRole('status')).toHaveTextContent('共 0 条');
    expect(screen.getByRole('button', { name: '下一页' })).toBeDisabled();
  });

  it('disables page and size actions independently of fetching and allows distinct landmark labels', () => {
    const change = vi.fn();
    render(<Pagination page={2} pageSize={10} total={100} onPageChange={change} onPageSizeChange={change} showFirstButton showLastButton disabled label="审计记录分页" />);
    const nav = screen.getByRole('navigation', { name: '审计记录分页' });
    expect(within(nav).getAllByRole('button').every(button => button.hasAttribute('disabled'))).toBe(true);
    expect(screen.getByLabelText('每页条数')).toBeDisabled();
    expect(nav).toHaveAttribute('aria-busy', 'false');
  });

  it('moves focus to the nearest enabled action at a boundary without stealing focus from elsewhere', () => {
    const change = vi.fn();
    const { rerender } = render(<><button>别的操作</button><Pagination page={2} pageSize={10} total={30} onPageChange={change} /></>);
    const next = screen.getByRole('button', { name: '下一页' }); next.focus();
    rerender(<><button>别的操作</button><Pagination page={3} pageSize={10} total={30} onPageChange={change} /></>);
    expect(screen.getByRole('button', { name: '上一页' })).toHaveFocus();
    screen.getByRole('button', { name: '别的操作' }).focus();
    rerender(<><button>别的操作</button><Pagination page={1} pageSize={10} total={30} onPageChange={change} /></>);
    expect(screen.getByRole('button', { name: '别的操作' })).toHaveFocus();
  });
});
