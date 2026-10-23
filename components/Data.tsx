import { Fragment, useId, type CSSProperties, type ReactNode } from 'react';
import { Button, EmptyState, Notice, Skeleton } from './components';
import { Text } from './Typography';
import { Checkbox } from './Forms';
import { Select } from './Select';

export function Metric({ label, value, unit, description, loading = false }: { label: string; value: ReactNode; unit?: string; description?: string; loading?: boolean }) {
  return <div className="rhine-metric" aria-busy={loading}><Text variant="caption" tone="muted">{label}</Text>{loading ? <Skeleton lines={1} label={`正在读取${label}`} /> : <Text variant="metric">{value ?? '—'}{unit && <span className="rhine-metric__unit"> {unit}</span>}</Text>}{description && <Text variant="caption" tone="muted">{description}</Text>}</div>;
}
export function KeyValue({ items }: { items: { key: string; label: string; value: ReactNode }[] }) {
  return <dl className="rhine-key-value">{items.map(item => <div key={item.key}><dt>{item.label}</dt><dd>{item.value ?? '—'}</dd></div>)}</dl>;
}
export interface DataColumn<T> { key: string; header: string; render: (row: T) => ReactNode; align?: 'left' | 'right'; sortable?: boolean; width?: number; sticky?: 'left' | 'right'; stickyOffset?: number }
export interface TableSort { key: string; direction: 'asc' | 'desc' }
export interface DataTableProps<T> {
  caption: string; columns: DataColumn<T>[]; rows: T[]; rowKey: (row: T) => string;
  loading?: boolean; error?: string; emptyTitle?: string; sort?: TableSort;
  onSortChange?: (sort: TableSort) => void; onRetry?: () => void;
  selection?: { keys: string[]; onChange: (keys: string[]) => void; isDisabled?: (row: T) => boolean };
  expansion?: { keys: string[]; onChange: (keys: string[]) => void; getChildren?: (row: T) => T[]; renderDetail?: (row: T) => ReactNode; canExpand?: (row: T) => boolean };
  rowLabel?: (row: T) => string; density?: 'comfortable' | 'compact'; stickyHeader?: boolean; maxHeight?: number;
}
export function DataTable<T>({ caption, columns, rows, rowKey, loading = false, error, emptyTitle = '暂无记录', sort, onSortChange, onRetry, selection, expansion, rowLabel = rowKey, density = 'comfortable', stickyHeader, maxHeight }: DataTableProps<T>) {
  const id = useId();
  const visible: { row: T; depth: number }[] = [];
  const visit = (items: T[], depth: number, ancestors: Set<string>) => items.forEach(row => {
    const key = rowKey(row);
    if (ancestors.has(key)) return;
    visible.push({ row, depth });
    if (expansion?.keys.includes(key)) visit(expansion.getChildren?.(row) ?? [], depth + 1, new Set([...ancestors, key]));
  });
  visit(rows, 0, new Set());
  const eligible = visible.filter(({ row }) => !selection?.isDisabled?.(row)).map(({ row }) => rowKey(row));
  const selectedCount = eligible.filter(key => selection?.keys.includes(key)).length;
  const toggle = (keys: string[], key: string) => keys.includes(key) ? keys.filter(item => item !== key) : [...keys, key];
  const columnStyle = (column: DataColumn<T>): CSSProperties => ({ width: column.width, minWidth: column.width, [column.sticky ?? 'left']: column.sticky ? column.stickyOffset ?? 0 : undefined });
  return <div className="rhine-data" aria-busy={loading} data-density={density}>
    {error && <Notice tone="error" title="读取失败" action={onRetry && <Button variant="secondary" onClick={onRetry} disabled={loading}>重试</Button>}>{error}{rows.length > 0 && ' · 以下保留上次读取的记录。'}</Notice>}
    {loading && <p role="status" className="rhine-text rhine-text--caption rhine-text--muted">{rows.length ? '正在刷新，保留当前记录…' : '正在读取…'}</p>}
    <div className="rhine-table-scroll" role="region" aria-label={`${caption}，可横向滚动`} tabIndex={0} style={{ maxHeight }}>
      <table className="rhine-table" data-sticky-header={stickyHeader}><caption>{caption}</caption><thead><tr>
        {selection && <th scope="col"><Checkbox label="选择当前可见行" checked={!!eligible.length && selectedCount === eligible.length} indeterminate={selectedCount > 0 && selectedCount < eligible.length} disabled={loading || !eligible.length} onChange={() => selection.onChange(selectedCount === eligible.length ? selection.keys.filter(key => !eligible.includes(key)) : [...new Set([...selection.keys, ...eligible])])} /></th>}
        {expansion && <th scope="col">层级 / 详情</th>}
        {columns.map(column => <th scope="col" key={column.key} data-align={column.align} data-sticky={column.sticky} style={columnStyle(column)} aria-sort={column.sortable ? sort?.key === column.key ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none' : undefined}>{column.sortable && onSortChange ? <button type="button" disabled={loading} onClick={() => onSortChange({ key: column.key, direction: sort?.key === column.key && sort.direction === 'asc' ? 'desc' : 'asc' })}>{column.header}<span aria-hidden="true">{sort?.key === column.key ? sort.direction === 'asc' ? ' ↑' : ' ↓' : ' ↕'}</span></button> : column.header}</th>)}</tr></thead>
      <tbody>{visible.map(({ row, depth }, index) => {
        const key = rowKey(row), expanded = expansion?.keys.includes(key);
        const children = expansion?.getChildren?.(row) ?? [];
        const expandable = expansion && (expansion.canExpand ? expansion.canExpand(row) : !!children.length || !!expansion.renderDetail);
        const detail = expanded ? expansion?.renderDetail?.(row) : null;
        return <Fragment key={key}><tr data-selected={selection?.keys.includes(key)}>
          {selection && <td><Checkbox label={`选择${rowLabel(row)}`} checked={selection.keys.includes(key)} disabled={loading || selection.isDisabled?.(row)} onChange={() => selection.onChange(toggle(selection.keys, key))} /></td>}
          {expansion && <td><span className="rhine-table__depth">第 {depth + 1} 层</span>{expandable && <Button variant="quiet" aria-label={`${expanded ? '收起' : '展开'}${rowLabel(row)}`} aria-expanded={!!expanded} aria-controls={detail ? `${id}-detail-${index}` : undefined} onClick={() => expansion.onChange(toggle(expansion.keys, key))}>{expanded ? '−' : '+'}</Button>}</td>}
          {columns.map(column => <td key={column.key} data-align={column.align} data-sticky={column.sticky} style={columnStyle(column)}>{column.render(row) ?? '—'}</td>)}
        </tr>{detail && <tr><td colSpan={columns.length + Number(!!selection) + Number(!!expansion)}><div id={`${id}-detail-${index}`} role="region" aria-label={`${rowLabel(row)}详情`}>{detail}</div></td></tr>}</Fragment>;
      })}</tbody></table>
    </div>
    {!rows.length && !loading && !error && <EmptyState title={emptyTitle} description="当前条件下没有可展示的数据。" />}
  </div>;
}
export function Pagination({ page, pageSize, total, hasNext = false, loading = false, onPageChange, pageSizeOptions = [10, 25, 50], onPageSizeChange }: {
  page: number; pageSize: number; total?: number; hasNext?: boolean; loading?: boolean; onPageChange: (page: number) => void;
  pageSizeOptions?: number[]; onPageSizeChange?: (size: number) => void;
}) {
  const size = Math.max(1, Math.floor(pageSize));
  const count = total === undefined ? undefined : Math.max(0, Math.floor(total));
  const pages = count === undefined ? undefined : Math.max(1, Math.ceil(count / size));
  const current = Math.max(1, Math.floor(page));
  const next = pages === undefined ? hasNext : current < pages;
  return <nav className="rhine-pagination" aria-label="分页">
    <span className="rhine-text rhine-text--caption rhine-text--numeric">{count === undefined ? `第 ${current} 页` : `第 ${current} / ${pages} 页 · 共 ${count} 条`}</span>
    {onPageSizeChange && <Select label="每页条数" value={size} disabled={loading} onChange={event => onPageSizeChange(Number(event.target.value))}>{[...new Set([size, ...pageSizeOptions.filter(value => Number.isInteger(value) && value > 0)])].sort((a, b) => a - b).map(value => <option value={value} key={value}>{value} 条</option>)}</Select>}
    <Button variant="secondary" disabled={loading || current <= 1} onClick={() => onPageChange(current - 1)}>上一页</Button>
    <Button variant="secondary" disabled={loading || !next} onClick={() => onPageChange(current + 1)}>下一页</Button>
  </nav>;
}
