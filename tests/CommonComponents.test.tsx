import { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Checkbox, Combobox, ConfirmDialog, CopyButton, DataTable, Metric, Pagination, RadioGroup, SearchField, Switch, Toast } from '../components';

afterEach(() => vi.useRealTimers());
describe('common design components', () => {
  it('distinguishes zero from unknown metrics', () => {
    render(<><Metric label="计数" value={0}/><Metric label="未知" value={null}/></>);
    expect(screen.getByText('0')).toBeVisible(); expect(screen.getByText('—')).toBeVisible();
  });
  it('emits sort intent without sorting or dropping stale rows on failure', () => {
    const sort=vi.fn();
    render(<DataTable caption="请求" rows={[{id:'b'},{id:'a'}]} rowKey={row=>row.id} columns={[{key:'id',header:'标识',sortable:true,render:row=>row.id}]} onSortChange={sort} error="连接失败"/>);
    fireEvent.click(screen.getByRole('button',{name:'标识'}));
    expect(sort).toHaveBeenCalledWith({key:'id',direction:'asc'});
    expect(screen.getAllByRole('cell').map(node=>node.textContent)).toEqual(['b','a']);
    expect(screen.getByRole('alert')).toHaveTextContent('保留上次读取');
  });
  it('respects pagination boundaries, busy state and unknown totals', () => {
    const change=vi.fn();const {rerender}=render(<Pagination page={1} pageSize={10} total={23} onPageChange={change}/>);
    expect(screen.getByRole('button',{name:'上一页'})).toBeDisabled();fireEvent.click(screen.getByRole('button',{name:'下一页'}));expect(change).toHaveBeenCalledWith(2);
    rerender(<Pagination page={3} pageSize={10} total={23} onPageChange={change}/>);expect(screen.getByRole('button',{name:'下一页'})).toBeDisabled();
    rerender(<Pagination page={3} pageSize={10} hasNext loading onPageChange={change}/>);expect(screen.getAllByRole('button').every(b=>b.hasAttribute('disabled'))).toBe(true);
    rerender(<Pagination page={3} pageSize={10} hasNext onPageChange={change}/>);expect(screen.getByText('第 3 页')).toBeVisible();expect(screen.getByRole('button',{name:'下一页'})).toBeEnabled();
  });
  it('reports copy success only after resolution and prevents duplicate writes', async () => {
    let resolve!:()=>void;const copy=vi.fn(()=>new Promise<void>(done=>{resolve=done;}));
    render(<CopyButton value="demo" copy={copy}/>);const button=screen.getByRole('button',{name:'复制'});button.focus();fireEvent.click(button);fireEvent.click(button);
    expect(copy).toHaveBeenCalledTimes(1);expect(button).toHaveFocus();expect(screen.queryByText('已复制')).not.toBeInTheDocument();
    await act(async()=>resolve());expect(screen.getByRole('status')).toHaveTextContent('已复制');
  });
  it('allows failed copies to retry and ignores stale completion after a value change', async () => {
    const copy=vi.fn().mockRejectedValueOnce(new Error('test')).mockResolvedValue(undefined);
    const {rerender}=render(<CopyButton value="a" copy={copy}/>);fireEvent.click(screen.getByRole('button',{name:'复制'}));await screen.findByRole('alert');fireEvent.click(screen.getByRole('button',{name:'复制'}));await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('已复制'));
    let resolve!:()=>void;const delayed=()=>new Promise<void>(done=>{resolve=done;});
    rerender(<CopyButton value="b" copy={delayed}/>);fireEvent.click(screen.getByRole('button',{name:'复制'}));rerender(<CopyButton value="c" copy={delayed}/>);await act(async()=>resolve());expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
  it('exposes mixed checkbox state and separates native radio groups', () => {
    render(<><Checkbox label="部分选择" indeterminate readOnly/><RadioGroup label="组一" value="a" onValueChange={()=>{}} items={[{value:'a',label:'A'}]}/><RadioGroup label="组二" value="a" onValueChange={()=>{}} items={[{value:'a',label:'A'}]}/></>);
    expect(screen.getByRole('checkbox')).toBePartiallyChecked();const radios=screen.getAllByRole('radio');expect(radios[0].getAttribute('name')).not.toBe(radios[1].getAttribute('name'));
  });
  it('does not change a controlled switch before the caller updates it', () => {
    const change=vi.fn();render(<Switch label="偏好" checked={false} onCheckedChange={change}/>);fireEvent.click(screen.getByRole('switch'));expect(change).toHaveBeenCalledWith(true);expect(screen.getByRole('switch')).not.toBeChecked();
  });
  it('does not submit searches while IME composition is active', () => {
    const search=vi.fn();render(<SearchField label="搜索" value="研究" onValueChange={()=>{}} onSearch={search}/>);const input=screen.getByRole('searchbox');fireEvent.compositionStart(input);fireEvent.keyDown(input,{key:'Enter'});expect(search).not.toHaveBeenCalled();fireEvent.compositionEnd(input);fireEvent.keyDown(input,{key:'Enter'});expect(search).toHaveBeenCalledWith('研究');
  });
  it('navigates supplied combobox results, skips disabled items and blocks IME commit', () => {
    const choose=vi.fn(),query=vi.fn();render(<Combobox label="模型" query="" onQueryChange={query} value={null} onValueChange={choose} options={[{value:'a',label:'A'},{value:'b',label:'B',disabled:true},{value:'c',label:'C'}]}/>);
    const input=screen.getByRole('combobox');fireEvent.focus(input);fireEvent.keyDown(input,{key:'ArrowDown'});fireEvent.keyDown(input,{key:'ArrowDown'});expect(document.getElementById(input.getAttribute('aria-activedescendant')!)).toHaveTextContent('C');
    fireEvent.compositionStart(input);fireEvent.change(input,{target:{value:'中'}});fireEvent.keyDown(input,{key:'Enter'});expect(choose).not.toHaveBeenCalled();expect(query).not.toHaveBeenCalled();fireEvent.compositionEnd(input);expect(query).toHaveBeenCalledWith('中');fireEvent.keyDown(input,{key:'End'});fireEvent.keyDown(input,{key:'Enter'});expect(choose).toHaveBeenCalledWith({value:'c',label:'C'});expect(input).toHaveAttribute('aria-expanded','false');
  });
  it('does not allow stale combobox results to be picked during loading', () => {
    const choose=vi.fn();render(<Combobox label="模型" query="" value={null} onQueryChange={()=>{}} onValueChange={choose} options={[{value:'a',label:'A'}]} loading/>);const input=screen.getByRole('combobox');fireEvent.focus(input);fireEvent.keyDown(input,{key:'ArrowDown'});fireEvent.keyDown(input,{key:'Enter'});expect(choose).not.toHaveBeenCalled();expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });
  it('pauses success notification countdown on hover and keeps errors persistent', () => {
    vi.useFakeTimers();const close=vi.fn();const {rerender}=render(<Toast open onOpenChange={close} title="已完成" duration={5000}/>);
    act(()=>vi.advanceTimersByTime(2000));fireEvent.mouseEnter(screen.getByRole('status'));act(()=>vi.advanceTimersByTime(10000));expect(close).not.toHaveBeenCalled();fireEvent.mouseLeave(screen.getByRole('status'));act(()=>vi.advanceTimersByTime(2999));expect(close).not.toHaveBeenCalled();act(()=>vi.advanceTimersByTime(1));expect(close).toHaveBeenCalledWith(false);
    close.mockClear();rerender(<Toast open onOpenChange={close} title="失败" tone="error" duration={1000}/>);act(()=>vi.advanceTimersByTime(10000));expect(close).not.toHaveBeenCalled();
  });
  it('resets toast countdown when reopening', () => {
    vi.useFakeTimers();function Demo(){const [open,setOpen]=useState(true);return <><button onClick={()=>setOpen(true)}>显示</button><Toast open={open} onOpenChange={setOpen} title="通知" duration={1000}/></>;}
    render(<Demo/>);act(()=>vi.advanceTimersByTime(1000));expect(screen.queryByText('通知')).not.toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'显示'}));act(()=>vi.advanceTimersByTime(999));expect(screen.getByText('通知')).toBeVisible();act(()=>vi.advanceTimersByTime(1));expect(screen.queryByText('通知')).not.toBeInTheDocument();
  });
  it('keeps a failed confirmation open and closes only after successful retry', async () => {
    const confirm=vi.fn().mockRejectedValueOnce(new Error('demo')).mockResolvedValue(undefined);
    render(<div className="rhine-theme"><ConfirmDialog trigger={<button>打开</button>} title="确认任务" description="演示" onConfirm={confirm}/></div>);
    fireEvent.click(screen.getByRole('button',{name:'打开'}));expect(await screen.findByRole('alertdialog')).toBeVisible();expect(screen.getByRole('button',{name:'取消'})).toHaveFocus();fireEvent.click(screen.getByRole('button',{name:'确认操作'}));expect(await screen.findByRole('alert')).toHaveTextContent('操作未完成');fireEvent.click(screen.getByRole('button',{name:'确认操作'}));await waitFor(()=>expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });
});
