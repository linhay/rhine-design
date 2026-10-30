import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ObjectSettingsGallery } from '../preview/ObjectSettingsGallery';
import { ThemeProvider } from '../components/theme';

afterEach(()=>vi.useRealTimers());
const setup = () => { vi.useFakeTimers(); return render(<ThemeProvider><ObjectSettingsGallery /></ThemeProvider>); };
const advance = (milliseconds:number) => act(()=>vi.advanceTimersByTime(milliseconds));
const enter = async () => {
  fireEvent.click(screen.getByRole('button',{name:'对象设置'}));
  advance(100);
  expect(screen.getByRole('combobox',{name:'分配人员'})).toBeVisible();
  return screen.getByRole('dialog',{name:'合成资源 A · 设置'});
};
it('makes names and settings usable before unrelated notifications finish, and nests Escape', async () => {
  setup(); const dialog = await enter();
  expect(screen.getByText('无关通知：读取中（合成慢请求）')).toBeVisible();
  expect(within(dialog).getByText('合成人员甲')).toBeVisible();
  const input = within(dialog).getByRole('combobox',{name:'分配人员'});
  fireEvent.focus(input); expect(screen.getByRole('listbox')).toBeVisible();
  fireEvent.keyDown(input,{key:'Escape'});
  expect(screen.queryByRole('listbox')).toBeNull(); expect(dialog).toBeVisible();
  fireEvent.keyDown(input,{key:'Escape'});
  advance(20); expect(screen.queryByRole('dialog')).toBeNull();
});
it('retains all drafts, saves only the current partition, and protects other unsaved changes', async () => {
  setup(); const dialog = await enter();
  fireEvent.click(within(dialog).getByRole('link',{name:'模型'}));
  fireEvent.change(within(dialog).getByRole('textbox',{name:'模型名称'}),{target:{value:'未保存模型'}});
  fireEvent.click(within(dialog).getByRole('link',{name:'分配'}));
  fireEvent.focus(within(dialog).getByRole('combobox',{name:'分配人员'}));
  fireEvent.click(screen.getByRole('option',{name:'合成人员乙'}));
  fireEvent.keyDown(within(dialog).getByRole('combobox',{name:'分配人员'}),{key:'Escape'});
  fireEvent.click(within(dialog).getByRole('button',{name:'保存当前分区'}));
  expect(within(dialog).getByRole('link',{name:'模型'})).toHaveAttribute('aria-disabled','true');
  fireEvent.keyDown(document.activeElement!,{key:'Escape'}); expect(dialog).toBeVisible();
  advance(350); expect(screen.getByText('分配已保存（合成）')).toBeVisible();
  fireEvent.click(within(dialog).getByRole('link',{name:'模型'}));
  expect(within(dialog).getByRole('textbox',{name:'模型名称'})).toHaveValue('未保存模型');
  expect(screen.getByText(/已保存分配：合成人员甲、合成人员乙 · 模型：合成模型 A/)).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button',{name:'关闭'}));
  const prompt = screen.getByRole('dialog',{name:'放弃未保存修改？'});
  fireEvent.click(within(prompt).getByRole('button',{name:'放弃并关闭'}));
  advance(20); expect(screen.queryByRole('dialog')).toBeNull();
  await enter(); expect(screen.getByRole('combobox',{name:'分配人员'}).closest('form')).toHaveTextContent('合成人员乙');
});
it('unlocks the parent as soon as child success is visible', async () => {
  setup(); const dialog = await enter(); const input = within(dialog).getByRole('combobox',{name:'分配人员'});
  fireEvent.focus(input); fireEvent.click(screen.getByRole('option',{name:'合成人员乙'})); fireEvent.keyDown(input,{key:'Escape'});
  fireEvent.click(screen.getByRole('button',{name:'保存当前分区'}));
  advance(350); expect(screen.getByText('分配已保存（合成）')).toBeVisible();
  act(()=>fireEvent.keyDown(document.activeElement!,{key:'Escape'}));
  advance(20); expect(screen.queryByRole('dialog')).toBeNull();
});
it('does not present a failed settings read as editable or successful', async () => {
  setup(); fireEvent.click(screen.getByLabelText('模拟设置读取失败'));
  fireEvent.click(screen.getByRole('button',{name:'对象设置'}));
  advance(100); expect(screen.getByText('对象设置读取失败')).toBeVisible();
  expect(screen.queryByRole('combobox',{name:'分配人员'})).toBeNull();
  expect(screen.getByRole('button',{name:'保存当前分区'})).toBeDisabled();
  expect(screen.queryByText('分配已保存（合成）')).toBeNull();
});
it.each(['批量入口','只读入口'])('omits unsupported allocation management for %s', async label => {
  setup(); fireEvent.click(screen.getByLabelText(label)); fireEvent.click(screen.getByRole('button',{name:'对象设置'}));
  expect(screen.queryByRole('link',{name:'分配'})).toBeNull();
  expect(screen.queryByRole('combobox',{name:'分配人员'})).toBeNull();
  if(label==='只读入口') expect(screen.queryByRole('button',{name:'保存当前分区'})).toBeNull();
});

it('retains the allocation draft on save failure without claiming success', async () => {
  setup(); fireEvent.click(screen.getByLabelText('模拟分配首次保存失败')); const dialog = await enter();
  const input = within(dialog).getByRole('combobox',{name:'分配人员'});
  fireEvent.focus(input); fireEvent.click(screen.getByRole('option',{name:'合成人员乙'})); fireEvent.keyDown(input,{key:'Escape'});
  fireEvent.click(screen.getByRole('button',{name:'保存当前分区'}));
  advance(350); expect(screen.getByText('分配保存失败，草稿已保留')).toBeVisible();
  expect(screen.queryByText('分配已保存（合成）')).toBeNull();
  expect(within(dialog).getByText('合成人员乙')).toBeVisible();
  expect(screen.getByText(/已保存分配：合成人员甲 · 模型/)).toBeInTheDocument();
  expect(screen.getByRole('button',{name:'保存当前分区'})).toBeEnabled();
  fireEvent.click(screen.getByRole('button',{name:'保存当前分区'}));
  advance(350); expect(screen.getByText('分配已保存（合成）')).toBeVisible();
  expect(screen.queryByText('分配保存失败，草稿已保留')).toBeNull();
});

it('cancels pending settings and notification reads on close, reopen and unmount', () => {
  vi.useFakeTimers(); const view = setup();
  fireEvent.click(screen.getByRole('button',{name:'对象设置'}));
  act(()=>vi.advanceTimersByTime(50));
  fireEvent.click(screen.getByRole('button',{name:'关闭'}));
  act(()=>vi.advanceTimersByTime(200));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByText('无关通知：当前读取已取消（合成）')).toBeVisible();
  fireEvent.click(screen.getByRole('button',{name:'对象设置'}));
  act(()=>vi.advanceTimersByTime(100));
  expect(screen.getByRole('combobox',{name:'分配人员'})).toBeVisible();
  act(()=>vi.advanceTimersByTime(1750));
  expect(screen.getByText('无关通知：读取中（合成慢请求）')).toBeVisible();
  // Old notification would have completed by now if the previous generation survived.
  view.unmount(); act(()=>vi.advanceTimersByTime(1000));
  expect(vi.getTimerCount()).toBe(0);
});

it('restarts failed settings reads without accepting the old notification timer', () => {
  vi.useFakeTimers(); const view = setup();
  fireEvent.click(screen.getByLabelText('模拟设置读取失败'));
  fireEvent.click(screen.getByRole('button',{name:'对象设置'}));
  act(()=>vi.advanceTimersByTime(150));
  screen.getByRole('button',{name:'重试读取设置'}).focus();
  fireEvent.click(screen.getByRole('button',{name:'重试读取设置'}));
  act(()=>vi.advanceTimersByTime(1850));
  expect(screen.getByText('对象设置读取失败')).toBeVisible();
  expect(screen.getByText('无关通知：读取中（合成慢请求）')).toBeVisible();
  view.unmount(); act(()=>vi.advanceTimersByTime(1000));
  expect(vi.getTimerCount()).toBe(0);
});
