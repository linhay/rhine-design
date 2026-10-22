import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button, Disclosure, Progress, SegmentedControl, Select, SelectionCard, Tabs, TextField } from '../components';

describe('reusable design components', () => {
  it('associates native selects with unique labels, hints, errors and caller descriptions', () => {
    render(<><span id="context">当前工作区</span><Select label="页面" hint="请选择" error="页面不可用" aria-describedby="context"><option>用量</option></Select><Select label="场景" disabled><option>正常</option></Select></>);
    const page = screen.getByRole('combobox', {name:'页面'});
    const scene = screen.getByRole('combobox', {name:'场景'});
    expect(page.id).not.toBe(scene.id);
    expect(page).toHaveAttribute('aria-invalid','true');
    expect(page).toHaveAccessibleDescription('当前工作区 请选择 页面不可用');
    expect(scene).toBeDisabled();
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
  });
  it('keeps the selected value controlled by the caller', () => {
    function Demo() {
      const [value,setValue] = useState('a');
      return <Select label="页面" value={value} onChange={event=>setValue(event.target.value)}><option value="a">同步</option><option value="b">用量</option></Select>;
    }
    render(<Demo />);
    const select=screen.getByRole('combobox');
    fireEvent.change(select,{target:{value:'b'}});
    expect(select).toHaveValue('b');
  });
  it('retains focus while busy and blocks repeat submission', () => {
    const submit = vi.fn();
    const { rerender } = render(<Button onClick={submit}>保存</Button>);
    const button = screen.getByRole('button'); button.focus(); fireEvent.click(button);
    rerender(<Button busy busyLabel="保存中" onClick={submit}>保存</Button>);
    fireEvent.click(button);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(button).toHaveFocus(); expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).not.toBeDisabled();
  });
  it('keeps disabled actions unavailable', () => {
    const action = vi.fn(); render(<Button disabled onClick={action}>删除</Button>);
    fireEvent.click(screen.getByRole('button')); expect(action).not.toHaveBeenCalled();
  });
  it('uses non-submit buttons by default inside forms', () => {
    render(<form><Button>动作</Button></form>); expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
  it('tabs skip disabled entries, wrap, and preserve mounted input state', () => {
    function Demo() {
      const [value,setValue] = useState('a');
      return <Tabs label="切换" value={value} onValueChange={setValue} items={[
        {value:'a',label:'甲',content:<input aria-label="草稿" defaultValue=""/>},
        {value:'b',label:'乙',disabled:true,content:null},
        {value:'c',label:'丙',content:'第三页'},
      ]}/>;
    }
    render(<Demo/>); fireEvent.change(screen.getByLabelText('草稿'),{target:{value:'保留草稿'}});
    const first=screen.getByRole('tab',{name:'甲'}); first.focus(); fireEvent.keyDown(first,{key:'ArrowRight'});
    const last=screen.getByRole('tab',{name:'丙'}); expect(last).toHaveFocus(); expect(last).toHaveAttribute('aria-selected','true');
    fireEvent.keyDown(last,{key:'ArrowRight'}); expect(first).toHaveFocus();
    expect(screen.getByLabelText('草稿')).toHaveValue('保留草稿');
    fireEvent.keyDown(first,{key:'End'}); expect(last).toHaveFocus();
    fireEvent.keyDown(last,{key:'Home'}); expect(first).toHaveFocus();
  });
  it('assigns unique ARIA associations to multiple tab groups', () => {
    render(<>{['one','two'].map(label=><Tabs key={label} label={label} value="a" onValueChange={()=>{}} items={[{value:'a',label,content:label}]}/>)}</>);
    const tabs=screen.getAllByRole('tab'); expect(tabs[0].id).not.toBe(tabs[1].id);
    for(const tab of tabs) expect(document.getElementById(tab.getAttribute('aria-controls')!)).toHaveAttribute('aria-labelledby',tab.id);
  });
  it('keeps separate segmented controls in independent native radio groups', () => {
    render(<>{['a','b'].map(label=><SegmentedControl key={label} label={label} value="one" onValueChange={()=>{}} items={[{value:'one',label:'一'},{value:'two',label:'二'}]}/>)}</>);
    const radios=screen.getAllByRole('radio'); expect(radios[0].getAttribute('name')).not.toBe(radios[2].getAttribute('name'));
  });
  it('allows controlled selection to be cancelled', () => {
    function Demo(){const [value,setValue]=useState(false);return <SelectionCard label="选择项" selected={value} onSelectedChange={setValue}>详情</SelectionCard>}
    render(<Demo/>); const input=screen.getByRole('checkbox'); fireEvent.click(input); expect(input).toBeChecked();fireEvent.click(input);expect(input).not.toBeChecked();
  });
  it('associates input hints and errors with the actual field', () => {
    render(<TextField label="名称" hint="必填" error="请填写名称" aria-describedby="external" />);
    const input=screen.getByLabelText('名称'); expect(input).toHaveAttribute('aria-invalid','true');
    const ids=input.getAttribute('aria-describedby')!.split(' '); expect(ids).toContain('external');
    expect(ids.slice(1).map(id=>document.getElementById(id)?.textContent)).toEqual(['必填','请填写名称']);
  });
  it('does not invent a percentage for unknown progress and clamps known values', () => {
    const {rerender}=render(<Progress label="进度" value={null}/>);
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
    rerender(<Progress label="进度" value={150}/>);expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow','100');
    rerender(<Progress label="进度" value={NaN}/>);expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  });
  it('disclosure works without animation support and closes keyboard content', () => {
    render(<Disclosure title="详细信息"><button>内部按钮</button></Disclosure>);
    const summary=screen.getByText('详细信息');const details=summary.closest('details')!;
    expect(details.open).toBe(false);fireEvent.click(summary);expect(details.open).toBe(true);
    fireEvent.click(summary);expect(details.open).toBe(false);expect(screen.getByText('内部按钮')).not.toBeVisible();
  });
});
