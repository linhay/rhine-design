import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { StatusTimelineList, type StatusTimelineItem } from '../components';
import { ThemeProvider } from '../components/theme';

const items: StatusTimelineItem[] = ['资源 A', '资源 B'].map((title, i) => ({ id: String(i), title,
  summary: <>剩余 <strong>{i ? '—' : '0%'}</strong></>,
  timeline: { startLabel: '昨天', endLabel: '今天', segments: [
    { id: 'first', label: '10:00', status: 'unknown' }, { id: 'last', label: '10:15', status: 'failed' },
  ] },
}));

it('opens only one row detail and preserves keyboard focus on the newly focused row', async () => {
  render(<ThemeProvider><StatusTimelineList label="资源历史" items={items} /></ThemeProvider>);
  const [first, second] = screen.getAllByRole('slider');
  act(() => first.focus());
  await screen.findByRole('dialog', { name: '资源 A 历史时段时段详情' });
  act(() => second.focus());
  await screen.findByRole('dialog', { name: '资源 B 历史时段时段详情' });
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  expect(second).toHaveFocus();
  fireEvent.keyDown(second, { key: 'Enter' });
  expect(screen.getByRole('button', { name: '关闭时段详情' })).toHaveFocus();
  fireEvent.keyDown(screen.getByRole('button', { name: '关闭时段详情' }), { key: 'Escape' });
  await waitFor(() => expect(second).toHaveFocus());
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('does not move focus to the old row when pointer inspection switches rows', async () => {
  render(<StatusTimelineList label="资源历史" items={items} />);
  const [first, second] = screen.getAllByRole('slider');
  fireEvent.pointerDown(first);
  await screen.findByRole('dialog');
  fireEvent.pointerDown(second);
  await screen.findByRole('dialog', { name: '资源 B 历史时段时段详情' });
  await waitFor(() => expect(screen.queryByRole('dialog', { name: '资源 A 历史时段时段详情' })).toBeNull());
  expect(document.body).toHaveFocus();
});

it('keeps stable row and segment identity on reorder and closes removed details', async () => {
  const view = render(<StatusTimelineList label="资源历史" items={items} />);
  const first = screen.getByRole('slider', { name: '资源 A 历史时段' });
  fireEvent.change(first, { target: { value: '0' } });
  view.rerender(<StatusTimelineList label="资源历史" items={[items[1], items[0]]} />);
  expect(screen.getByRole('slider', { name: '资源 A 历史时段' })).toBe(first);
  expect(first).toHaveAttribute('aria-valuetext', '10:00 · 未知 / 无数据');
  view.rerender(<StatusTimelineList label="资源历史" items={[items[1]]} />);
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  view.rerender(<StatusTimelineList label="资源历史" items={items} />);
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('distinguishes unavailable history, empty records, zero summary and disabled inspection', () => {
  const view = render(<StatusTimelineList label="资源历史" items={[{ ...items[0], timeline: null }, { ...items[1], timeline: { ...items[1].timeline!, disabled: true } }]} />);
  expect(screen.getByText('0%')).toBeVisible();
  expect(screen.getByText('历史记录暂不可用 · 未知')).toBeVisible();
  expect(screen.getByRole('slider')).toBeDisabled();
  fireEvent.pointerDown(screen.getByRole('slider'));
  expect(screen.queryByRole('dialog')).toBeNull();
  view.rerender(<StatusTimelineList label="资源历史" items={[]} emptyLabel="暂无资源" />);
  expect(screen.getByText('暂无资源')).toBeVisible();
  expect(screen.queryByRole('slider')).toBeNull();
});
