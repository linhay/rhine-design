import { useState } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { AutoComplete, Button, Cascader, Mentions, Popover } from '../components';

it.each([['重排',['Beta','Alpha','Gamma'],'Beta'],['删除',['Alpha','Gamma'],null]] as const)('keeps mention identity after %s', (_name, next, expected) => {
  const change=vi.fn();
  const view=(options: readonly string[])=><Mentions label="提及" value="前文 @" onChange={change} options={options}/>;
  const {rerender}=render(view(['Alpha','Beta','Gamma']));
  const input=screen.getByRole('combobox',{name:'提及'});
  act(()=>{input.focus();(input as HTMLTextAreaElement).setSelectionRange(4,4);});fireEvent.select(input);
  fireEvent.keyDown(input,{key:'ArrowDown'}); fireEvent.keyDown(input,{key:'ArrowDown'});
  expect(screen.getByRole('option',{name:'Beta'})).toHaveAttribute('aria-selected','true');
  rerender(view(next));
  fireEvent.keyDown(input,{key:'Enter'});
  if(expected) expect(change).toHaveBeenCalledExactlyOnceWith('前文 @Beta ');
  else expect(change).not.toHaveBeenCalled();
  expect(input).toHaveFocus();
});

it.each(['keyboard','pointer'])('does not insert an oversized mention via %s and retains following text', method=>{
  const change=vi.fn();
  const view=(maxLength:number)=><Mentions label="提及" value="前文 @ 后文" onChange={change} options={['Beta']} maxLength={maxLength}/>;
  const {rerender}=render(view(10));
  const input=screen.getByRole('combobox',{name:'提及'}) as HTMLTextAreaElement;
  act(()=>{input.focus();input.setSelectionRange(4,4);});fireEvent.select(input);
  const insert=()=>{if(method==='pointer') fireEvent.click(screen.getByRole('option',{name:'Beta'})); else {fireEvent.keyDown(input,{key:'ArrowDown'});fireEvent.keyDown(input,{key:'Enter'});}};
  insert(); expect(change).not.toHaveBeenCalled(); expect(input).toHaveValue('前文 @ 后文'); expect(input).toHaveFocus();
  expect(screen.getByRole('status')).toHaveTextContent('字数上限');
  rerender(view(12));insert();expect(change).toHaveBeenCalledExactlyOnceWith('前文 @Beta  后文');
});

it('shows a selected Cascader item only in the committed branch',async()=>{
  const change=vi.fn();render(<Cascader label="资源" value={['east','shared']} onChange={change} options={[
    {value:'east',label:'东区',children:[{value:'shared',label:'东区资料'}]},
    {value:'west',label:'西区',children:[{value:'shared',label:'西区资料'}]},
  ]}/>);
  fireEvent.click(screen.getByRole('button',{name:/资源：/}));fireEvent.click(await screen.findByRole('option',{name:'东区'}));
  expect(screen.getByRole('option',{name:'东区资料'})).toHaveAttribute('aria-selected','true');
  fireEvent.click(screen.getByRole('button',{name:'返回上一级'}));fireEvent.click(screen.getByRole('option',{name:'西区'}));
  const counterpart=screen.getByRole('option',{name:'西区资料'});expect(counterpart).toHaveAttribute('aria-selected','false');expect(change).not.toHaveBeenCalled();
  fireEvent.click(counterpart);expect(change).toHaveBeenCalledExactlyOnceWith(['west','shared']);
});

it('does not reuse a vetoed Escape when the close button is used',async()=>{
  const changed=vi.fn();
  function Host(){const [open,setOpen]=useState(true);return <Popover open={open} onOpenChange={(next,{reason})=>{changed(reason);if(reason!=='escape')setOpen(next);}} title="设置预览" trigger={<Button>入口</Button>}><Button>明细</Button></Popover>}
  render(<Host/>);const dialog=await screen.findByRole('dialog',{name:'设置预览'});
  fireEvent.keyDown(within(dialog).getByRole('button',{name:'明细'}),{key:'Escape'});
  expect(changed.mock.calls).toEqual([['escape']]);expect(dialog).toBeVisible();
  fireEvent.click(within(dialog).getByRole('button',{name:'关闭详情'}));
  expect(changed.mock.calls).toEqual([['escape'],['programmatic']]);expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('blocks an oversized AutoComplete candidate for both entry methods but permits an exact-length correction',async()=>{
  const selected=vi.fn();
  function Host(){const [value,setValue]=useState('阿');return <form aria-label="名称表单"><AutoComplete label="名称" name="name" value={value} onChange={setValue} onSelect={selected} options={['阿尔法长名称','阿尔法组']} maxLength={4}/></form>}
  render(<Host/>);const input=screen.getByRole('combobox',{name:'名称'});act(()=>input.focus());
  const long=await screen.findByRole('option',{name:/阿尔法长名称/});expect(long).toHaveAttribute('aria-disabled','true');
  fireEvent.click(long);expect(selected).not.toHaveBeenCalled();expect(input).toHaveValue('阿');
  fireEvent.keyDown(input,{key:'ArrowDown'});fireEvent.keyDown(input,{key:'Enter'});
  expect(selected).toHaveBeenCalledExactlyOnceWith('阿尔法组');
  expect(new FormData(screen.getByRole('form',{name:'名称表单'}) as HTMLFormElement).get('name')).toBe('阿尔法组');
});
