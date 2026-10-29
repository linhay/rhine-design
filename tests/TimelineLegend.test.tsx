import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { TimelineLegend, type TimelineLegendItem } from '../components';
import { ThemeProvider } from '../components/theme';

const items: TimelineLegendItem[] = [
  { status: 'healthy', label: '有输出', description: '存在输出记录，当前证据未发现异常；不代表完整可用性。' },
  { status: 'unknown', label: '未知', description: '数据缺失或不完整，不能解释为健康。' },
];

function hover(element: HTMLElement) {
  const event = new Event('pointerover', { bubbles: true });
  Object.defineProperty(event, 'pointerType', { value: 'mouse' });
  fireEvent(element, event);
}

it('keeps a keyboard rule open when scrolling moves another legend item under the pointer', async () => {
  render(<><TimelineLegend compact items={items} /><button>离开图例</button></>);
  const output = screen.getByRole('button', { name: '有输出' });
  const unknown = screen.getByRole('button', { name: '未知' });
  act(() => output.focus());
  expect(output.matches(':focus-visible')).toBe(true);
  await screen.findByRole('dialog', { name: '有输出规则' });
  hover(unknown);
  expect(screen.getByRole('dialog', { name: '有输出规则' })).toBeVisible();
  expect(output).toHaveFocus();
  fireEvent.click(unknown);
  await screen.findByRole('dialog', { name: '未知规则' });
  act(() => screen.getByRole('button', { name: '离开图例' }).focus());
  hover(output);
  await screen.findByRole('dialog', { name: '有输出规则' });
});

it('does not unmount the rule being inspected when another item receives incidental hover', async () => {
  render(<TimelineLegend compact items={items} />);
  const output = screen.getByRole('button', { name: '有输出' });
  act(() => output.focus());
  await screen.findByRole('dialog', { name: '有输出规则' });
  fireEvent.keyDown(output, { key: 'Enter' });
  const close = screen.getByRole('button', { name: '关闭有输出规则' });
  expect(close).toHaveFocus();
  hover(screen.getByRole('button', { name: '未知' }));
  expect(close).toHaveFocus();
  expect(screen.getByRole('dialog', { name: '有输出规则' })).toBeVisible();
});

it('retains keyboard ownership through a temporary body-focus gap until explicit outside focus', async () => {
  render(<><TimelineLegend compact items={items} /><button>离开图例</button></>);
  const output = screen.getByRole('button', { name: '有输出' });
  act(() => output.focus());
  await screen.findByRole('dialog', { name: '有输出规则' });
  fireEvent.keyDown(output, { key: 'Enter' });
  act(() => screen.getByRole('button', { name: '关闭有输出规则' }).blur());
  expect(document.body).toHaveFocus();
  hover(screen.getByRole('button', { name: '未知' }));
  expect(screen.getByRole('dialog', { name: '有输出规则' })).toBeVisible();
  act(() => screen.getByRole('button', { name: '离开图例' }).focus());
  hover(screen.getByRole('button', { name: '未知' }));
  await screen.findByRole('dialog', { name: '未知规则' });
  const unknown = screen.getByRole('button', { name: '未知' });
  act(() => unknown.focus());
  fireEvent.keyDown(unknown, { key: 'Enter' });
  act(() => screen.getByRole('button', { name: '关闭未知规则' }).blur());
  fireEvent.pointerDown(document.body);
  hover(output);
  await screen.findByRole('dialog', { name: '有输出规则' });
});

it('preserves default labels and non-interactive presentation', () => {
  render(<TimelineLegend />);
  expect(screen.getByRole('list', { name: '健康记录图例' }).children).toHaveLength(5);
  expect(screen.getByText('有输出·未见异常')).toBeVisible();
  expect(screen.getByText('未知 / 无数据')).toBeVisible();
  expect(screen.queryByRole('button')).toBeNull();
});

it('shows host rules on focus, keeps only one rule open, and restores focus after inspection', async () => {
  const { container } = render(<ThemeProvider theme="neo-brutalism"><TimelineLegend label="历史状态图例" compact items={items} /></ThemeProvider>);
  const output = screen.getByRole('button', { name: '有输出' });
  const unknown = screen.getByRole('button', { name: '未知' });
  act(() => output.focus());
  await screen.findByRole('dialog', { name: '有输出规则' });
  expect(output).toHaveFocus();
  act(() => unknown.focus());
  const dialog = await screen.findByRole('dialog', { name: '未知规则' });
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  expect(dialog.closest('.rhine-theme')).toBe(container.querySelector('.rhine-theme'));
  expect(unknown).toHaveFocus();
  fireEvent.keyDown(unknown, { key: 'Enter' });
  const close = screen.getByRole('button', { name: '关闭未知规则' });
  expect(close).toHaveFocus();
  fireEvent.keyDown(close, { key: 'Escape' });
  await waitFor(() => expect(unknown).toHaveFocus());
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('opens rules through pointer activation without changing the label or requiring hover', async () => {
  render(<TimelineLegend compact items={items} />);
  const trigger = screen.getByRole('button', { name: '有输出' });
  fireEvent.click(trigger);
  const dialog = await screen.findByRole('dialog', { name: '有输出规则' });
  expect(dialog).toHaveTextContent(items[0].description!);
  expect(trigger).toHaveAttribute('aria-expanded', 'true');
  fireEvent.click(screen.getByRole('button', { name: '关闭有输出规则' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});

it('normalizes positioning under ancestor zoom while preserving enlarged content and runtime changes', async () => {
  const { container } = render(<div style={{ zoom: 1.5 }}><ThemeProvider style={{ zoom: 2 }}><TimelineLegend compact items={items} /></ThemeProvider></div>);
  fireEvent.click(screen.getByRole('button', { name: '有输出' }));
  const dialog = await screen.findByRole('dialog', { name: '有输出规则' });
  await waitFor(() => expect(dialog.style.zoom).toBe('3'));
  expect(Number(dialog.parentElement?.style.zoom)).toBeCloseTo(1 / 3);
  const theme = container.querySelector<HTMLElement>('.rhine-theme')!;
  theme.style.zoom = '1';
  await waitFor(() => expect(dialog.style.zoom).toBe('1.5'));
  expect(Number(dialog.parentElement?.style.zoom)).toBeCloseTo(1 / 1.5);
});
