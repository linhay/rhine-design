import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ParameterConfigGallery } from '../preview/ParameterConfigGallery';
import { ThemeProvider } from '../components/theme';
afterEach(() => vi.useRealTimers());
const setup = () => render(<ThemeProvider><ParameterConfigGallery /></ThemeProvider>);
const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const review = () => { fireEvent.click(screen.getByRole('button', { name: '核对并提交' })); return screen.getByRole('dialog'); };
const confirm = () => fireEvent.click(screen.getByRole('button', { name: '确认提交' }));
const outcome = (value: string) => fireEvent.change(screen.getByLabelText('提交结果'), { target: { value } });
const saved = () => screen.getByTestId('parameter-saved-version');

it('has four sources, eleven complete results, no override model, and previews ten linked changes without saving', () => {
  setup(); expect(screen.getAllByRole('textbox')).toHaveLength(4);
  expect(screen.getByRole('region', { name: '配置参数' })).toHaveAttribute('tabindex', '0');
  const preview = screen.getByRole('region', { name: '完整生成结果' });
  expect(within(preview).getAllByRole('listitem')).toHaveLength(11);
  expect(screen.getByRole('button', { name: '核对并提交' })).toBeDisabled();
  change('统一版本', '15.0.0-rc.1+synthetic');
  expect(preview.textContent!.match(/15\.0\.0-rc\.1\+synthetic/g)).toHaveLength(20);
  expect(preview).toHaveTextContent('RhineUtility/3.2.1'); expect(saved()).toHaveTextContent('12.4.0');
  const d = review(); expect(d).toHaveTextContent('影响 10 / 11 条结果');
  const changes = within(d).getByRole('definition').parentElement!.parentElement!;
  expect(changes).toHaveTextContent('12.4.0'); expect(changes).toHaveTextContent('15.0.0-rc.1+synthetic');
  expect(within(d).getAllByRole('term')).toHaveLength(1);
  fireEvent.click(within(d).getByRole('button', { name: '返回编辑' }));
  expect(screen.getByLabelText('统一版本')).toHaveValue('15.0.0-rc.1+synthetic'); expect(saved()).toHaveTextContent('12.4.0');
});
it('keeps all parameters exposed and focuses invalid fields only on submit without valid output', () => {
  setup(); change('移动应用构建号', 'bad');
  const field = screen.getByLabelText('移动应用构建号');
  expect(field.closest('details')).toBeNull(); expect(field).toBeVisible(); expect(field).not.toHaveFocus();
  expect(screen.getByRole('region', { name: '完整生成结果' })).toHaveTextContent('待校验');
  expect(screen.queryByRole('listitem')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '核对并提交' }));
  expect(field.closest('details')).toBeNull(); expect(field).toHaveFocus(); expect(field).toHaveAttribute('aria-invalid', 'true');
  expect(screen.queryByRole('dialog')).toBeNull();
  change('移动应用构建号', '9000'); change('独立软件版本', '');
  fireEvent.click(screen.getByRole('button', { name: '核对并提交' })); expect(screen.getByLabelText('独立软件版本')).toHaveFocus();
});
it('uses actual parameter/result differences for independent values and restores clean state by editing back', () => {
  setup(); change('独立软件版本', '4.0.0'); const d = review();
  expect(d).toHaveTextContent('影响 1 / 11 条结果'); expect(within(d).getByRole('term')).toHaveTextContent('独立软件版本');
  fireEvent.click(within(d).getByRole('button', { name: '返回编辑' })); change('独立软件版本', '3.2.1');
  expect(screen.getByRole('button', { name: '核对并提交' })).toBeDisabled();
});
it('retains failed drafts and retries the reviewed snapshot with duplicate protection', () => {
  vi.useFakeTimers(); setup(); outcome('error'); change('统一版本', '13.0.0'); review();
  const button = screen.getByRole('button', { name: '确认提交' }); fireEvent.click(button); fireEvent.click(button);
  expect(screen.getByTestId('parameter-attempts')).toHaveTextContent('1'); expect(button).toBeDisabled();
  act(() => vi.advanceTimersByTime(600)); expect(screen.getByRole('dialog')).toHaveTextContent('提交失败');
  expect(saved()).toHaveTextContent('12.4.0'); expect(screen.getByLabelText('统一版本')).toHaveValue('13.0.0');
  fireEvent.click(screen.getByRole('button', { name: '重试提交' }));
  act(() => vi.advanceTimersByTime(600)); expect(saved()).toHaveTextContent('13.0.0'); expect(screen.getByText('已保存合成配置')).toBeVisible();
});
it('keeps conflict protection across close/reopen, refreshes baseline without discarding draft, and requires another review', () => {
  vi.useFakeTimers(); setup(); outcome('conflict'); change('统一版本', '14.0.0'); review(); confirm(); act(() => vi.advanceTimersByTime(600));
  expect(screen.getByRole('dialog')).toHaveTextContent('基线冲突'); fireEvent.click(screen.getByRole('button', { name: '返回编辑' }));
  review(); expect(screen.queryByRole('button', { name: '确认提交' })).toBeNull(); fireEvent.click(screen.getByRole('button', { name: '读取新基线' }));
  expect(screen.queryByRole('dialog')).toBeNull(); expect(saved()).toHaveTextContent('12.5.0'); expect(screen.getByLabelText('统一版本')).toHaveValue('14.0.0');
  const d = review(); expect(d).toHaveTextContent('12.5.0'); expect(d).toHaveTextContent('14.0.0'); expect(within(d).getAllByRole('term')).toHaveLength(2);
  fireEvent.click(screen.getByRole('button', { name: '返回编辑' })); outcome('success'); review(); confirm(); act(() => vi.advanceTimersByTime(600));
  expect(saved()).toHaveTextContent('14.0.0');
});
it('cancels pending work on close/unmount, preserving later drafts rather than applying stale completion', () => {
  vi.useFakeTimers(); const view = setup(); change('统一版本', '13.0.0'); review(); confirm();
  fireEvent.click(screen.getByRole('button', { name: '返回编辑' })); change('统一版本', '14.0.0');
  act(() => vi.advanceTimersByTime(1000)); expect(saved()).toHaveTextContent('12.4.0'); expect(screen.getByLabelText('统一版本')).toHaveValue('14.0.0');
  const setTimer = vi.spyOn(globalThis, 'setTimeout'), clearTimer = vi.spyOn(globalThis, 'clearTimeout');
  review(); confirm();
  const requestIndex = setTimer.mock.calls.findIndex(call => call[1] === 600);
  expect(requestIndex).toBeGreaterThanOrEqual(0);
  const requestTimer = setTimer.mock.results[requestIndex].value;
  view.unmount(); expect(clearTimer).toHaveBeenCalledWith(requestTimer);
  act(() => vi.runAllTimers()); setTimer.mockRestore(); clearTimer.mockRestore();
});
