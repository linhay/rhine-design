import { useState } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AutoComplete, Button, Calendar, Cascader, ConfigProvider, Dialog, Dropdown, Image, Mentions, NavigationMenu, Popconfirm, Splitter, Tour, Transfer, TreeSelect, Util, useConfig } from '../components';

afterEach(() => vi.restoreAllMocks());
const openDropdown = (name: string) => { fireEvent.keyDown(screen.getByRole('button', { name }), { key:'ArrowDown' }); };

describe('shared overlay lifecycle', () => {
  it('dismisses a dropdown and restores the trigger after skipping disabled commands', async () => {
    const select = vi.fn();
    render(<Dropdown label="命令" items={[{ id:'locked', label:'禁用', disabled:true }, { id:'view', label:'查看' }]} onSelect={select} />);
    openDropdown('命令');
    const item = await screen.findByRole('menuitem', { name:'查看' });
    fireEvent.click(item);
    expect(select).toHaveBeenCalledWith('view');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('button', { name:'命令' })).toHaveFocus());
  });
  it('closes only the nested layer on the first Escape', async () => {
    render(<Dialog title="父层" trigger={<Button>打开父层</Button>}><Dropdown label="子命令" items={[{ id:'a', label:'可选' }]} onSelect={() => undefined} /></Dialog>);
    fireEvent.click(screen.getByRole('button', { name:'打开父层' }));
    await screen.findByRole('dialog', { name:'父层' }); openDropdown('子命令');
    const item = await screen.findByRole('menuitem', { name:'可选' });
    fireEvent.keyDown(item, { key:'Escape' });
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(screen.getByRole('dialog', { name:'父层' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name:'子命令' })).toHaveFocus());
    fireEvent.keyDown(document.activeElement!, { key:'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
  it('does not let an old menu close steal an explicit focus handoff', async () => {
    render(<><Dropdown label="命令交接" items={[{ id:'a', label:'操作' }]} onSelect={() => undefined} /><input aria-label="下一输入" /></>);
    openDropdown('命令交接'); const item = await screen.findByRole('menuitem', { name:'操作' });
    fireEvent.keyDown(item, { key:'Escape' });
    const input = screen.getByRole('textbox', { name:'下一输入' }); act(() => input.focus());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });
    expect(input).toHaveFocus();
  });
  it('keeps autocomplete editable and selects a suggestion from the keyboard', async () => {
    function Demo() { const [value, setValue] = useState(''); return <AutoComplete label="补全" value={value} onChange={setValue} options={['alpha', 'beta']} />; }
    render(<Demo />); const input = screen.getByRole('combobox');
    act(() => input.focus()); fireEvent.change(input, { target:{ value:'al' } });
    await screen.findByRole('option', { name:'alpha' });
    fireEvent.keyDown(input, { key:'ArrowDown' }); fireEvent.keyDown(input, { key:'Enter' });
    expect(input).toHaveValue('alpha');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  });
  it('shows the image itself in a modal preview and returns focus', async () => {
    render(<Image alt="几何图" src="data:image/svg+xml,%3Csvg/%3E" />);
    const trigger = screen.getByRole('button', { name:'查看几何图' });
    fireEvent.click(trigger); const dialog = await screen.findByRole('dialog', { name:'几何图' });
    expect(within(dialog).getByRole('img', { name:'几何图' })).toHaveAttribute('src', 'data:image/svg+xml,%3Csvg/%3E');
    fireEvent.click(within(dialog).getByRole('button', { name:'关闭对话框' }));
    await waitFor(() => expect(trigger).toHaveFocus());
  });
  it('cancels popconfirm without running the action', async () => {
    const confirm = vi.fn(); render(<Popconfirm label="移除" title="确认？" onConfirm={confirm} />);
    fireEvent.click(screen.getByRole('button', { name:'移除' }));
    fireEvent.click(await screen.findByRole('button', { name:'取消' }));
    expect(confirm).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
  it('drills through arbitrary cascading levels without committing an intermediate path', async () => {
    const change = vi.fn();
    render(<Cascader label="路径" value={[]} onChange={change} options={[{ value:'a', label:'一级', children:[{ value:'b', label:'二级', children:[{ value:'c', label:'叶子' }] }] }]} />);
    fireEvent.click(screen.getByRole('button', { name:'路径：未选择' }));
    fireEvent.click(await screen.findByRole('option', { name:'一级' }));
    fireEvent.click(screen.getByRole('option', { name:'二级' }));
    expect(change).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('option', { name:'叶子' }));
    expect(change).toHaveBeenCalledExactlyOnceWith(['a', 'b', 'c']);
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  });
  it('dismisses mentions without deleting the draft and respects composition Enter', async () => {
    function Demo() { const [value, setValue] = useState('请 @'); return <Mentions label="备注" value={value} onChange={setValue} options={['林可', '周宁']} />; }
    render(<Demo />); const input = screen.getByRole('combobox', { name:'备注' });
    act(() => input.focus()); await screen.findByRole('option', { name:'林可' });
    fireEvent.keyDown(input, { key:'ArrowDown' });
    fireEvent.compositionStart(input); fireEvent.keyDown(input, { key:'Enter', isComposing:true });
    expect(input).toHaveValue('请 @'); fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key:'Escape' });
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(input).toHaveValue('请 @'); expect(input).toHaveFocus();
  });
  it('inserts a mention at the real caret and preserves following text', async () => {
    function Demo() { const [value,setValue] = useState('请 @ 后文'); return <Mentions label="插入" value={value} onChange={setValue} options={['林可']} />; }
    render(<Demo />); const input = screen.getByRole('combobox', { name:'插入' }) as HTMLTextAreaElement;
    act(() => { input.focus(); input.setSelectionRange(3,3); }); fireEvent.select(input);
    await screen.findByRole('option', { name:'林可' }); fireEvent.keyDown(input, { key:'ArrowDown' }); fireEvent.keyDown(input, { key:'Enter' });
    expect(input).toHaveValue('请 @林可  后文'); expect(input.selectionStart).toBe(6);
  });
  it('returns focus to the Tour starter on explicit completion', async () => {
    function Demo() { const [open, setOpen] = useState(false); return <><Button onClick={() => setOpen(true)}>开始</Button>{open && <Tour title="介绍" description="说明" step={0} total={1} onNext={() => undefined} onPrevious={() => undefined} onClose={() => setOpen(false)} />}</>; }
    render(<Demo />); const trigger = screen.getByRole('button', { name:'开始' });
    act(() => trigger.focus()); fireEvent.click(trigger); await screen.findByRole('dialog', { name:'介绍' });
    fireEvent.click(screen.getByRole('button', { name:'完成' }));
    await waitFor(() => expect(trigger).toHaveFocus());
  });
  it('propagates density through a portal and permits a nested regular override', async () => {
    function ReadConfig() { return <output>{useConfig().density}</output>; }
    render(<ConfigProvider density="compact"><ReadConfig /><Dropdown label="紧凑命令" items={[{ id:'a', label:'详情' }]} onSelect={() => undefined} /><ConfigProvider density="regular"><ReadConfig /></ConfigProvider></ConfigProvider>);
    expect(screen.getAllByRole('status').map(node => node.textContent)).toEqual(['compact', 'regular']);
    openDropdown('紧凑命令'); const menu = await screen.findByRole('menu');
    expect(menu).toHaveAttribute('data-rhine-density', 'compact');
  });
});

describe('controlled interaction completeness', () => {
  it('clamps Splitter keyboard values and exposes disabled state', () => {
    const change = vi.fn(); const { rerender } = render(<Splitter label="比例" value={90} onChange={change} start="左" end="右" />);
    const bar = screen.getByRole('separator'); expect(bar).toHaveAttribute('aria-valuenow', '80');
    fireEvent.keyDown(bar, { key:'Home' }); expect(change).toHaveBeenLastCalledWith(20);
    fireEvent.keyDown(bar, { key:'End' }); expect(change).toHaveBeenLastCalledWith(80);
    rerender(<Splitter label="比例" value={50} disabled onChange={change} start="左" end="右" />);
    change.mockClear(); fireEvent.keyDown(bar, { key:'ArrowRight' }); expect(change).not.toHaveBeenCalled();
    expect(bar).toHaveAttribute('aria-disabled', 'true');
  });
  it('drags and cancels the Splitter with pointer capture coordinates', () => {
    const change = vi.fn(); render(<Splitter label="比例" value={50} onChange={change} start="左" end="右" />);
    const bar = screen.getByRole('separator');
    vi.spyOn(bar.parentElement!, 'getBoundingClientRect').mockReturnValue({ left:0, right:444, width:444 } as DOMRect);
    vi.spyOn(bar, 'getBoundingClientRect').mockReturnValue({ width:44 } as DOMRect);
    const send = (type: string, clientX: number) => { const event = new MouseEvent(type, { bubbles:true, button:0, clientX }); Object.defineProperty(event, 'pointerId', { value:1 }); fireEvent(bar, event); };
    send('pointerdown', 222); send('pointermove', 342); expect(change).toHaveBeenLastCalledWith(80);
    send('pointercancel', 342); change.mockClear(); send('pointermove', 222); expect(change).not.toHaveBeenCalled();
  });
  it('moves only the selected source-side items and hands focus to the destination', () => {
    function Demo() { const [target, setTarget] = useState(['b']); return <Transfer label="分配" source={[{ id:'a', label:'甲' }, { id:'b', label:'乙' }, { id:'c', label:'丙', disabled:true }]} target={target} onChange={setTarget} />; }
    render(<Demo />); fireEvent.click(screen.getByRole('checkbox', { name:'甲' })); fireEvent.click(screen.getByRole('checkbox', { name:'乙' }));
    fireEvent.click(screen.getByRole('button', { name:'移到已选' }));
    expect(within(screen.getByRole('list', { name:'已选' })).getAllByRole('checkbox')).toHaveLength(2);
    expect(screen.getByRole('checkbox', { name:'甲' })).toHaveFocus();
    expect(screen.getByRole('checkbox', { name:'丙' })).toBeDisabled();
  });
  it('navigates Transfer rows and moves with the arrow shortcut', () => {
    function Demo() { const [target, setTarget] = useState<string[]>([]); return <Transfer label="分配" source={[{ id:'a', label:'甲' }, { id:'b', label:'乙' }]} target={target} onChange={setTarget} />; }
    render(<Demo />); const first = screen.getByRole('checkbox', { name:'甲' }); act(() => first.focus());
    fireEvent.keyDown(first, { key:'ArrowDown' }); expect(screen.getByRole('checkbox', { name:'乙' })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key:'ArrowRight' });
    expect(within(screen.getByRole('list', { name:'已选' })).getByRole('checkbox', { name:'乙' })).toHaveFocus();
  });
  it('renders a seven-column leap-month grid and follows an external date change', () => {
    const { rerender } = render(<Calendar label="日期" value="2028-02-29" onChange={() => undefined} />);
    expect(screen.getByRole('button', { name:'2028年2月29日' })).toHaveAttribute('aria-pressed', 'true');
    const rows = within(screen.getByRole('grid')).getAllByRole('row');
    expect(rows).toHaveLength(6); rows.forEach(row => expect(row.children).toHaveLength(7));
    rerender(<Calendar label="日期" value="2027-12-31" onChange={() => undefined} />);
    expect(screen.getByRole('button', { name:'2027年12月31日' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('moves Calendar focus across month and year without implicitly selecting', () => {
    const change = vi.fn(); render(<Calendar label="日期" value="2026-12-31" onChange={change} />);
    const date = screen.getByRole('button', { name:'2026年12月31日' }); act(() => date.focus());
    fireEvent.keyDown(date, { key:'ArrowRight' }); expect(screen.getByRole('button', { name:'2027年1月1日' })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key:'PageDown' }); expect(screen.getByRole('button', { name:'2027年2月1日' })).toHaveFocus();
    expect(change).not.toHaveBeenCalled();
  });
  it('keeps a dropdown TreeSelect form value when closed', async () => {
    function Demo() { const [value, setValue] = useState<string[]>([]), [expanded, setExpanded] = useState(['root']); return <form aria-label="选择表单"><TreeSelect presentation="dropdown" label="节点" name="node" nodes={[{ id:'root', label:'根', selectable:false, children:[{ id:'leaf', label:'叶子' }] }]} value={value} onValueChange={setValue} expandedKeys={expanded} onExpandedChange={setExpanded} /></form>; }
    render(<Demo />); expect(screen.queryByRole('tree')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name:'节点：未选择' })); await screen.findByRole('tree');
    fireEvent.click(screen.getByRole('treeitem', { name:'叶子' }).querySelector('.rhine-tree__row')!);
    await waitFor(() => expect(screen.queryByRole('tree')).not.toBeInTheDocument());
    expect(new FormData(screen.getByRole('form') as HTMLFormElement).get('node')).toBe('leaf');
  });
  it('preserves inline TreeSelect as the default', () => {
    render(<TreeSelect label="内联" nodes={[{ id:'a', label:'甲' }]} value={[]} onValueChange={() => undefined} expandedKeys={[]} onExpandedChange={() => undefined} />);
    expect(screen.getByRole('tree', { name:'内联' })).toBeInTheDocument();
  });
  it('keeps NavigationMenu links native and skips disabled descendants', () => {
    render(<NavigationMenu label="导航" currentId="a" items={[{ id:'a', label:'甲', href:'#a' }, { id:'b', label:'禁用', href:'#b', disabled:true, children:[{ id:'x', label:'子禁用', href:'#x' }] }, { id:'c', label:'丙', href:'#c' }]} />);
    const first = screen.getByRole('link', { name:'甲' }); expect(first).toHaveAttribute('href', '#a'); expect(first).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name:'子禁用' })).not.toHaveAttribute('href');
    act(() => first.focus()); fireEvent.keyDown(first, { key:'ArrowRight' }); expect(screen.getByRole('link', { name:'丙' })).toHaveFocus();
  });
  it('defines pure utility edge cases explicitly', () => {
    expect(Util.classNames('a', false, null, undefined, 'b')).toBe('a b');
    expect(Util.clamp(200, 0, 100)).toBe(100); expect(Util.clamp(NaN, 0, 100)).toBe(0);
    expect(() => Util.clamp(0, 100, 0)).toThrow(RangeError);
  });
});
