import { Fragment, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button, EmptyState, Notice, Skeleton } from './components';
import { Text } from './Typography';
import { Checkbox } from './Forms';
import { Select } from './Select';
import './data.css';

export function Metric({ label, value, unit, description, loading = false }: { label: string; value: ReactNode; unit?: string; description?: string; loading?: boolean }) {
  return <div className="rhine-metric" aria-busy={loading}><Text variant="caption" tone="muted">{label}</Text>{loading ? <Skeleton lines={1} label={`正在读取${label}`} /> : <Text variant="metric">{value ?? '—'}{unit && <span className="rhine-metric__unit"> {unit}</span>}</Text>}{description && <Text variant="caption" tone="muted">{description}</Text>}</div>;
}
export function KeyValue({ items }: { items: { key: string; label: string; value: ReactNode }[] }) {
  return <dl className="rhine-key-value">{items.map(item => <div key={item.key}><dt>{item.label}</dt><dd>{item.value ?? '—'}</dd></div>)}</dl>;
}
export interface DataColumn<T> { key: string; header: string; render: (row: T) => ReactNode; align?: 'left' | 'right'; sortable?: boolean; width?: number; sticky?: 'left' | 'right'; stickyOffset?: number; rowHeader?: boolean }
export interface TableSort { key: string; direction: 'asc' | 'desc' }
export interface DataTableProps<T> {
  caption: string; columns: DataColumn<T>[]; rows: T[]; rowKey: (row: T) => string;
  loading?: boolean; error?: string; emptyTitle?: string; sort?: TableSort;
  onSortChange?: (sort: TableSort) => void; onSortReset?: () => void; onRetry?: () => void;
  selection?: { keys: string[]; onChange: (keys: string[]) => void; isDisabled?: (row: T) => boolean; mode?: 'multiple' | 'single'; hideSelectAll?: boolean };
  expansion?: { keys: string[]; onChange: (keys: string[]) => void; getChildren?: (row: T) => T[]; renderDetail?: (row: T) => ReactNode; canExpand?: (row: T) => boolean };
  rowLabel?: (row: T) => string; density?: 'comfortable' | 'compact'; stickyHeader?: boolean; maxHeight?: number;
}
export function DataTable<T>({ caption, columns, rows, rowKey, loading = false, error, emptyTitle = '暂无记录', sort, onSortChange, onSortReset, onRetry, selection, expansion, rowLabel = rowKey, density = 'comfortable', stickyHeader, maxHeight }: DataTableProps<T>) {
  const id = useId();
  const table = useRef<HTMLTableElement>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  useLayoutEffect(() => {
    if (!table.current || !columns.some(column => column.sticky)) return;
    const headers = Array.from(table.current.querySelectorAll<HTMLElement>('thead [data-column-key]'));
    const measure = () => {
      // Layout widths remain in CSS pixels under zoom/transform; visual bounds do not.
      const widths = Object.fromEntries(headers.map(header => [header.dataset.columnKey!, header.offsetWidth]));
      setColumnWidths(previous => Object.keys(widths).length === Object.keys(previous).length && Object.entries(widths).every(([key, width]) => previous[key] === width) ? previous : widths);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    headers.forEach(header => observer.observe(header));
    return () => observer.disconnect();
  }, [columns]);
  const offsets: Record<string, number> = {};
  for (const side of ['left', 'right'] as const) {
    let offset = 0;
    for (const column of side === 'left' ? columns : [...columns].reverse()) {
      if (column.sticky !== side) continue;
      offsets[column.key] = column.stickyOffset ?? offset;
      offset = offsets[column.key] + (columnWidths[column.key] || column.width || 0);
    }
  }
  const visible: { row: T; depth: number; expandable: boolean }[] = [];
  const visit = (items: T[], depth: number, ancestors: Set<string>) => items.forEach(row => {
    const key = rowKey(row);
    if (ancestors.has(key)) return;
    const children = expansion?.getChildren?.(row) ?? [];
    const expandable = !!expansion && (expansion.canExpand ? expansion.canExpand(row) : !!children.length || !!expansion.renderDetail);
    visible.push({ row, depth, expandable });
    if (expandable && expansion?.keys.includes(key)) visit(children, depth + 1, new Set([...ancestors, key]));
  });
  visit(rows, 0, new Set());
  const eligible = visible.filter(({ row }) => !selection?.isDisabled?.(row)).map(({ row }) => rowKey(row));
  const selectedCount = eligible.filter(key => selection?.keys.includes(key)).length;
  const toggle = (keys: string[], key: string) => keys.includes(key) ? keys.filter(item => item !== key) : [...keys, key];
  const columnStyle = (column: DataColumn<T>): CSSProperties => ({ width: column.width, minWidth: column.width, [column.sticky ?? 'left']: column.sticky ? offsets[column.key] : undefined });
  return <div className="rhine-data" aria-busy={loading} data-density={density}>
    {error && <Notice tone="error" title="读取失败" action={onRetry && <Button variant="secondary" onClick={onRetry} disabled={loading}>重试</Button>}>{error}{rows.length > 0 && ' · 以下保留上次读取的记录。'}</Notice>}
    {loading && <p role="status" className="rhine-text rhine-text--caption rhine-text--muted">{rows.length ? '正在刷新，保留当前记录…' : '正在读取…'}</p>}
    {sort && onSortReset && <Button variant="quiet" disabled={loading} onClick={() => {
      const header = Array.from(table.current?.querySelectorAll<HTMLElement>('thead [data-column-key]') ?? []).find(cell => cell.dataset.columnKey === sort.key);
      (header?.querySelector<HTMLButtonElement>('button') ?? table.current?.parentElement)?.focus();
      onSortReset();
    }}>清除排序</Button>}
    <div className="rhine-table-scroll" role="region" aria-label={`${caption}，可横向滚动`} tabIndex={0} style={{ maxHeight }}>
      <table ref={table} className="rhine-table" data-sticky-header={stickyHeader}><caption>{caption}</caption><thead><tr>
        {selection && <th scope="col">{selection.mode === 'single' || selection.hideSelectAll ? '选择' : <Checkbox label="选择当前可见行" checked={!!eligible.length && selectedCount === eligible.length} indeterminate={selectedCount > 0 && selectedCount < eligible.length} disabled={loading || !eligible.length} onChange={() => selection.onChange(selectedCount === eligible.length ? selection.keys.filter(key => !eligible.includes(key)) : [...new Set([...selection.keys, ...eligible])])} />}</th>}
        {expansion && <th scope="col">层级 / 详情</th>}
        {columns.map(column => <th scope="col" key={column.key} data-column-key={column.key} data-align={column.align} data-sticky={column.sticky} style={columnStyle(column)} aria-sort={column.sortable ? sort?.key === column.key ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none' : undefined}>{column.sortable && onSortChange ? <button type="button" disabled={loading} title={`按${sort?.key === column.key && sort.direction === 'asc' ? '降' : '升'}序排列${column.header}`} onClick={() => onSortChange({ key: column.key, direction: sort?.key === column.key && sort.direction === 'asc' ? 'desc' : 'asc' })}>{column.header}<span aria-hidden="true">{sort?.key === column.key ? sort.direction === 'asc' ? ' ↑' : ' ↓' : ' ↕'}</span></button> : column.header}</th>)}</tr></thead>
      <tbody>{visible.map(({ row, depth, expandable }) => {
        const key = rowKey(row), expanded = expandable && expansion?.keys.includes(key);
        const detailId = `${id}-detail-${encodeURIComponent(key)}`;
        const detail = expanded ? expansion?.renderDetail?.(row) : null;
        const hasDetail = detail !== null && detail !== undefined && typeof detail !== 'boolean';
        return <Fragment key={key}><tr data-selected={selection?.mode === 'single' ? selection.keys[0] === key : selection?.keys.includes(key)}>
          {selection && <td>{selection.mode === 'single' ? <label className="rhine-table__radio"><input type="radio" name={`${id}-selection`} checked={selection.keys[0] === key} disabled={loading || selection.isDisabled?.(row)} onChange={() => selection.onChange([key])} /><span>{`选择${rowLabel(row)}`}</span></label> : <Checkbox label={`选择${rowLabel(row)}`} checked={selection.keys.includes(key)} disabled={loading || selection.isDisabled?.(row)} onChange={() => selection.onChange(toggle(selection.keys, key))} />}</td>}
          {expansion && <td><span className="rhine-table__depth">第 {depth + 1} 层</span>{expandable && <Button variant="quiet" aria-label={`${expanded ? '收起' : '展开'}${rowLabel(row)}`} aria-expanded={!!expanded} aria-controls={hasDetail ? detailId : undefined} onClick={() => expansion.onChange(toggle(expansion.keys, key))}>{expanded ? '−' : '+'}</Button>}</td>}
          {columns.map(column => { const Cell = column.rowHeader ? 'th' : 'td'; return <Cell scope={column.rowHeader ? 'row' : undefined} key={column.key} data-align={column.align} data-sticky={column.sticky} style={columnStyle(column)}>{column.render(row) ?? '—'}</Cell>; })}
        </tr>{hasDetail && <tr><td colSpan={columns.length + Number(!!selection) + Number(!!expansion)}><div id={detailId} role="region" aria-label={`${rowLabel(row)}详情`}>{detail}</div></td></tr>}</Fragment>;
      })}</tbody></table>
    </div>
    {!rows.length && !loading && !error && <EmptyState title={emptyTitle} description="当前条件下没有可展示的数据。" />}
  </div>;
}
export interface PaginationProps {
  page: number; pageSize: number; total?: number; hasNext?: boolean; loading?: boolean; disabled?: boolean; onPageChange: (page: number) => void;
  pageSizeOptions?: number[]; onPageSizeChange?: (size: number) => void; showFirstButton?: boolean; showLastButton?: boolean; label?: string;
}
export function Pagination({ page, pageSize, total, hasNext = false, loading = false, disabled = false, onPageChange, pageSizeOptions = [10, 25, 50], onPageSizeChange, showFirstButton = false, showLastButton = false, label = '分页' }: PaginationProps) {
  const root = useRef<HTMLElement>(null), focusedAction = useRef<HTMLButtonElement | null>(null);
  const size = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 1;
  const count = total === undefined || !Number.isFinite(total) || total < 0 ? undefined : Math.floor(total);
  const pages = count === undefined ? undefined : Math.max(1, Math.ceil(count / size));
  const current = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
  const next = pages === undefined ? hasNext : current < pages;
  const unavailable = loading || disabled;
  useLayoutEffect(() => {
    const focused = focusedAction.current;
    if (!root.current || !focused || !focused.disabled || !root.current.contains(focused)) return;
    if (document.activeElement !== focused && document.activeElement !== document.body) return;
    const actions = Array.from(root.current.querySelectorAll<HTMLButtonElement>('[data-pagination-action]'));
    const index = actions.indexOf(focused);
    const fallback = actions.slice(index + 1).find(action => !action.disabled) ?? actions.slice(0, index).reverse().find(action => !action.disabled);
    fallback?.focus();
  }, [current, pages, next, unavailable, showFirstButton, showLastButton]);
  return <nav ref={root} className="rhine-pagination" aria-label={label} aria-busy={loading} onFocusCapture={event => { focusedAction.current = event.target instanceof HTMLButtonElement && event.target.hasAttribute('data-pagination-action') ? event.target : null; }} onBlurCapture={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) focusedAction.current = null; }}>
    <span className="rhine-text rhine-text--caption rhine-text--numeric" role="status">{count === undefined ? `第 ${current} 页` : current > pages! ? `第 ${current} 页（已超出 ${pages} 页） · 共 ${count} 条` : `第 ${current} / ${pages} 页 · 共 ${count} 条`}</span>
    {onPageSizeChange && <Select label="每页条数" value={size} disabled={unavailable} onChange={event => onPageSizeChange(Number(event.target.value))}>{[...new Set([size, ...pageSizeOptions.filter(value => Number.isInteger(value) && value > 0)])].sort((a, b) => a - b).map(value => <option value={value} key={value}>{value} 条</option>)}</Select>}
    {showFirstButton && <Button variant="secondary" data-pagination-action="first" disabled={unavailable || current <= 1} onClick={() => onPageChange(1)}>首页</Button>}
    <Button variant="secondary" data-pagination-action="previous" disabled={unavailable || current <= 1} onClick={() => onPageChange(Math.min(current - 1, pages ?? current - 1))}>上一页</Button>
    <Button variant="secondary" data-pagination-action="next" disabled={unavailable || !next} onClick={() => onPageChange(current + 1)}>下一页</Button>
    {showLastButton && <Button variant="secondary" data-pagination-action="last" disabled={unavailable || pages === undefined || current === pages} onClick={() => { if (pages !== undefined) onPageChange(pages); }}>末页</Button>}
  </nav>;
}
