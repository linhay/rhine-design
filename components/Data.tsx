import type { ReactNode } from 'react';
import { Button, EmptyState, Notice, Skeleton } from './components';
import { Text } from './Typography';

export function Metric({ label, value, unit, description, loading = false }: { label: string; value: ReactNode; unit?: string; description?: string; loading?: boolean }) {
  return <div className="rhine-metric" aria-busy={loading}><Text variant="caption" tone="muted">{label}</Text>{loading ? <Skeleton lines={1} label={`正在读取${label}`} /> : <Text variant="metric">{value ?? '—'}{unit && <span className="rhine-metric__unit"> {unit}</span>}</Text>}{description && <Text variant="caption" tone="muted">{description}</Text>}</div>;
}
export function KeyValue({ items }: { items: { key: string; label: string; value: ReactNode }[] }) {
  return <dl className="rhine-key-value">{items.map(item => <div key={item.key}><dt>{item.label}</dt><dd>{item.value ?? '—'}</dd></div>)}</dl>;
}
export interface DataColumn<T> { key: string; header: string; render: (row: T) => ReactNode; align?: 'left' | 'right'; sortable?: boolean }
export interface TableSort { key: string; direction: 'asc' | 'desc' }
export interface DataTableProps<T> {
  caption: string; columns: DataColumn<T>[]; rows: T[]; rowKey: (row: T) => string;
  loading?: boolean; error?: string; emptyTitle?: string; sort?: TableSort;
  onSortChange?: (sort: TableSort) => void; onRetry?: () => void;
}
export function DataTable<T>({ caption, columns, rows, rowKey, loading = false, error, emptyTitle = '暂无记录', sort, onSortChange, onRetry }: DataTableProps<T>) {
  return <div className="rhine-data" aria-busy={loading}>
    {error && <Notice tone="error" title="读取失败" action={onRetry && <Button variant="secondary" onClick={onRetry} disabled={loading}>重试</Button>}>{error}{rows.length > 0 && ' · 以下保留上次读取的记录。'}</Notice>}
    {loading && <p role="status" className="rhine-text rhine-text--caption rhine-text--muted">{rows.length ? '正在刷新，保留当前记录…' : '正在读取…'}</p>}
    <div className="rhine-table-scroll" role="region" aria-label={`${caption}，可横向滚动`} tabIndex={0}>
      <table className="rhine-table"><caption>{caption}</caption><thead><tr>{columns.map(column => <th scope="col" key={column.key} data-align={column.align} aria-sort={column.sortable ? sort?.key === column.key ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none' : undefined}>{column.sortable && onSortChange ? <button type="button" disabled={loading} onClick={() => onSortChange({ key: column.key, direction: sort?.key === column.key && sort.direction === 'asc' ? 'desc' : 'asc' })}>{column.header}<span aria-hidden="true">{sort?.key === column.key ? sort.direction === 'asc' ? ' ↑' : ' ↓' : ' ↕'}</span></button> : column.header}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={rowKey(row)}>{columns.map(column => <td key={column.key} data-align={column.align}>{column.render(row) ?? '—'}</td>)}</tr>)}</tbody></table>
    </div>
    {!rows.length && !loading && !error && <EmptyState title={emptyTitle} description="当前条件下没有可展示的数据。" />}
  </div>;
}
export function Pagination({ page, pageSize, total, hasNext = false, loading = false, onPageChange }: {
  page: number; pageSize: number; total?: number; hasNext?: boolean; loading?: boolean; onPageChange: (page: number) => void;
}) {
  const size = Math.max(1, Math.floor(pageSize));
  const count = total === undefined ? undefined : Math.max(0, Math.floor(total));
  const pages = count === undefined ? undefined : Math.max(1, Math.ceil(count / size));
  const current = Math.max(1, Math.floor(page));
  const next = pages === undefined ? hasNext : current < pages;
  return <nav className="rhine-pagination" aria-label="分页">
    <span className="rhine-text rhine-text--caption rhine-text--numeric">{count === undefined ? `第 ${current} 页` : `第 ${current} / ${pages} 页 · 共 ${count} 条`}</span>
    <Button variant="secondary" disabled={loading || current <= 1} onClick={() => onPageChange(current - 1)}>上一页</Button>
    <Button variant="secondary" disabled={loading || !next} onClick={() => onPageChange(current + 1)}>下一页</Button>
  </nav>;
}
