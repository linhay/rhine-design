import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Button, Combobox, RemoteMultiSelect } from '../components';
import { LabelActionExample, directoryAction, directoryLabel } from '../preview/LabelActionGallery';

afterEach(() => vi.useRealTimers());
const tick = async (ms = 600) => { await act(async () => { vi.advanceTimersByTime(ms); }); };
const props = { label: '对象', query: '', onQueryChange: vi.fn(), value: [], onValueChange: vi.fn(), options: [{ value: 'a', label: '对象 A' }] };
it('keeps the original label DOM without an action and preserves all accessible names with an action', () => {
  const { container, rerender } = render(<RemoteMultiSelect {...props}/>);
  expect(container.querySelector('.rhine-combobox>label')).not.toBeNull();
  expect(container.querySelector('.rhine-combobox__heading')).toBeNull();
  rerender(<RemoteMultiSelect {...props} value={props.options} labelAction={<Button variant="secondary">获取目录</Button>}/>);
  expect(screen.getByRole('combobox', { name: '对象' })).toBeInTheDocument();
  expect(screen.getByRole('list', { name: '对象已选项' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '移除对象 A' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '获取目录' }).closest('label')).toBeNull();
  expect(screen.getByRole('button', { name: '获取目录' })).toHaveAttribute('type', 'button');
});
it('closes the open popup without restoring over the action; host owns action availability independently', async () => {
  vi.useFakeTimers(); const click = vi.fn();
  const { rerender } = render(<Combobox {...props} value={null} labelAction={<Button onClick={click}>获取</Button>}/>);
  const input = screen.getByRole('combobox'), action = screen.getByRole('button', { name: '获取' });
  act(() => input.focus()); expect(input).toHaveAttribute('aria-expanded', 'true');
  act(() => action.focus()); fireEvent.click(action); await tick();
  expect(action).toHaveFocus(); expect(input).toHaveAttribute('aria-expanded', 'false'); expect(click).toHaveBeenCalledOnce();
  rerender(<Combobox {...props} value={null} disabled labelAction={<Button>获取</Button>}/>);
  expect(input).toBeDisabled(); expect(screen.getByRole('button', { name: '获取' })).toBeEnabled();
});
it.each(['success', 'failure', 'empty'])('directory %s preserves selection and draft, with retry and busy duplicate protection', async scenario => {
  vi.useFakeTimers(); render(<LabelActionExample/>);
  fireEvent.change(screen.getByLabelText('目录响应'), { target: { value: scenario } });
  const selected = screen.getByRole('list', { name: `${directoryLabel}已选项` }).textContent;
  fireEvent.change(screen.getByLabelText('目录对象草稿'), { target: { value: '编辑后的草稿' } });
  const action = screen.getByRole('button', { name: directoryAction });
  fireEvent.click(action); fireEvent.click(action); expect(action).toHaveAttribute('aria-busy', 'true'); await tick();
  if (scenario === 'failure') { expect(screen.getByRole('status', { name: '目录获取结果' })).toHaveTextContent('获取失败'); fireEvent.click(action); await tick(); }
  expect(screen.getByRole('status', { name: '目录获取结果' })).toHaveTextContent(scenario === 'empty' ? '目录为空' : '目录已更新');
  expect(screen.getByRole('list', { name: `${directoryLabel}已选项` }).textContent).toBe(selected);
  expect(screen.getByLabelText('目录对象草稿')).toHaveValue('编辑后的草稿');
});
it('rejects cancelled late responses and clears timers on unmount', async () => {
  vi.useFakeTimers(); const { unmount } = render(<LabelActionExample/>);
  fireEvent.change(screen.getByLabelText('目录响应'), { target: { value: 'late' } });
  fireEvent.click(screen.getByRole('button', { name: directoryAction }));
  fireEvent.click(screen.getByRole('button', { name: '取消获取目录' })); await tick(1400);
  expect(screen.getByRole('status', { name: '目录获取结果' })).toHaveTextContent('已取消获取');
  fireEvent.click(screen.getByRole('button', { name: directoryAction })); unmount(); await tick(1); expect(vi.getTimerCount()).toBe(0);
});
it.each(['禁用目录字段', '只读目录字段'])('host locks its action and rejects pending results when %s', async name => {
  vi.useFakeTimers(); render(<LabelActionExample/>);
  fireEvent.click(screen.getByRole('button', { name: directoryAction })); fireEvent.click(screen.getByLabelText(name)); await tick();
  expect(screen.getByRole('button', { name: directoryAction })).toBeDisabled();
  expect(screen.getByRole('status', { name: '目录获取结果' })).toHaveTextContent('目录操作不可用');
  expect(screen.getByLabelText('目录对象草稿')).toHaveValue('保留的合成草稿');
});

it('a replacement empty response cannot be overwritten by an older directory result', async () => {
  vi.useFakeTimers(); render(<LabelActionExample/>);
  fireEvent.change(screen.getByLabelText('目录响应'), { target: { value: 'late' } });
  fireEvent.click(screen.getByRole('button', { name: directoryAction }));
  fireEvent.change(screen.getByLabelText('目录响应'), { target: { value: 'empty' } });
  fireEvent.click(screen.getByRole('button', { name: directoryAction })); await tick(1400);
  expect(screen.getByRole('status', { name: '目录获取结果' })).toHaveTextContent('目录为空');
});
