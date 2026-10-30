import { useState } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DataTable, Pagination } from '../components';

const rows = [{ id: 'b' }, { id: 'a' }, { id: 'locked' }];
const columns = [{ key: 'id', header: '标识', render: (row: { id: string }) => row.id }];
const base = { caption: '记录', rows, columns, rowKey: (row: { id: string }) => row.id };

describe('DataTable framework parity', () => {
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

  it('accumulates actual pinned-column widths after layout changes and honors explicit offsets', () => {
    let resize: (() => void) | undefined;
    const widths: Record<string, number> = { first: 140, second: 160, third: 100, fourth: 120 };
    vi.stubGlobal('ResizeObserver', class { constructor(callback: () => void) { resize = callback; } observe() {} disconnect() {} });
    const measure = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function(this: HTMLElement) { return widths[this.dataset.columnKey ?? ''] ?? 0; });
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
    } finally { measure.mockRestore(); vi.unstubAllGlobals(); }
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
