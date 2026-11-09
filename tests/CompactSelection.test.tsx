import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button, Dialog, Tabs } from '../components';
import { CompactSelectionGallery } from '../preview/CompactSelectionGallery';
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});
describe('compact selection contracts',()=>{
 it('keeps button native semantics and makes tabs layout independent of status',()=>{
  const {rerender}=render(<><Button contentAlign="between">名称<span>箭头</span></Button><Tabs label="页签" value="a" onValueChange={()=>{}} items={[{value:'a',label:'甲',status:'运行',content:'内容'}]}/></>);
  expect(screen.getByRole('button')).toHaveClass('rhine-button--between');expect(screen.getByRole('button')).not.toHaveAttribute('contentAlign');
  expect(screen.getByRole('tablist')).toHaveClass('rhine-tabs__list--content');
  rerender(<Tabs label="页签" layout="fill" value="a" onValueChange={()=>{}} items={[{value:'a',label:'甲',content:'内容'}]}/>);
  expect(screen.getByRole('tablist')).toHaveClass('rhine-tabs__list--fill');
 });
 it('renders footer outside content scroll with opt-in height',()=>{
  render(<Dialog trigger={<Button>打开</Button>} title="选择" description="草稿" height={560} footer={<Button>保存</Button>}><p>内容</p></Dialog>);
  fireEvent.click(screen.getByText('打开'));const dialog=screen.getByRole('dialog');
  expect(dialog).toHaveClass('rhine-dialog--bounded');expect(dialog.style.getPropertyValue('--rhine-dialog-height')).toBe('560px');
  expect(screen.getByText('保存').closest('.rhine-dialog__scroll')).toBeNull();
 });
 it('discards draft on close, prevents duplicate save/close while saving and retains failures',()=>{
  vi.useFakeTimers();render(<CompactSelectionGallery/>);
  const trigger=screen.getByRole('button',{name:'选择 合成对象 A 的授权分组'});
  fireEvent.click(trigger);let dialog=screen.getByRole('dialog',{name:'分组选择'});
  fireEvent.change(within(dialog).getByLabelText('候选分组'),{target:{value:'beta'}});
  expect(within(dialog).getByText('已确认：示例组')).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button',{name:'关闭对话框'}));
  fireEvent.click(trigger);dialog=screen.getByRole('dialog',{name:'分组选择'});
  expect(within(dialog).getByLabelText('候选分组')).toHaveValue('alpha');
  fireEvent.change(within(dialog).getByLabelText('候选分组'),{target:{value:'beta'}});
  const save=within(dialog).getByRole('button',{name:'保存'});fireEvent.click(save);fireEvent.click(save);
  fireEvent.click(within(dialog).getByRole('button',{name:'关闭对话框'}));expect(dialog).toBeInTheDocument();
  act(()=>vi.advanceTimersByTime(700));expect(within(dialog).getByText('已确认：联合研究组')).toBeInTheDocument();expect(save).toBeDisabled();
  fireEvent.click(within(dialog).getByRole('button',{name:'关闭对话框'}));
  fireEvent.change(screen.getByLabelText('组合场景'),{target:{value:'error'}});fireEvent.click(trigger);
  dialog=screen.getByRole('dialog',{name:'分组选择'});fireEvent.change(within(dialog).getByLabelText('候选分组'),{target:{value:'none'}});
  fireEvent.click(within(dialog).getByRole('button',{name:'保存'}));act(()=>vi.advanceTimersByTime(700));
  expect(within(dialog).getByText('已确认：联合研究组')).toBeInTheDocument();expect(within(dialog).getByLabelText('候选分组')).toHaveValue('none');
  expect(within(dialog).getByRole('status')).toHaveTextContent('保存失败');
 });
 it('cleans host timers on unmount',()=>{
  vi.useFakeTimers();const timer=vi.spyOn(globalThis,'setTimeout'),clear=vi.spyOn(globalThis,'clearTimeout');const {unmount}=render(<CompactSelectionGallery/>);
  fireEvent.click(screen.getByRole('button',{name:'选择 合成对象 A 的授权分组'}));const dialog=screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('候选分组'),{target:{value:'beta'}});fireEvent.click(within(dialog).getByRole('button',{name:'保存'}));
  const index=timer.mock.calls.findIndex(call=>call[1]===700);expect(index).toBeGreaterThanOrEqual(0);
  const pendingTimer=timer.mock.results[index].value;unmount();expect(clear).toHaveBeenCalledWith(pendingTimer);
 });
});
