import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Breadcrumbs, Drawer, ErrorSummary, Fieldset, SideNav, Steps, TextField } from '../components';
import { PatternGallery } from '../preview/PatternGallery';

describe('navigation and form workflow contracts', () => {
  it('preserves real navigation links and identifies the current location', () => {
    const navigate = vi.fn();
    render(<><SideNav groups={[{label:'工作区',items:[{id:'a',label:'概览',href:'/overview'},{id:'b',label:'记录',href:'/records'}]}]} currentId="b" onNavigate={(item,event)=>{event.preventDefault();navigate(item.id);}}/><Breadcrumbs items={[{label:'首页',href:'/'},{label:'记录'}]}/></>);
    expect(screen.getByRole('link',{name:'记录'})).toHaveAttribute('href','/records');
    expect(screen.getByRole('link',{name:'记录'})).toHaveAttribute('aria-current','page');
    fireEvent.click(screen.getByRole('link',{name:'概览'})); expect(navigate).toHaveBeenCalledWith('a');
    expect(within(screen.getByRole('navigation',{name:'当前位置'})).getByText('记录')).toHaveAttribute('aria-current','page');
  });
  it('only permits returning to completed steps and exposes current/error/completed states', () => {
    const change=vi.fn(), items=[{id:'a',label:'输入'},{id:'b',label:'核对'},{id:'c',label:'完成'}];
    const {rerender}=render(<Steps items={items} current={1} onStepChange={change} error="信息不完整"/>);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button',{name:'返回输入'}));expect(change).toHaveBeenCalledWith(0);
    expect(screen.getByText('核对').closest('li')).toHaveAttribute('aria-current','step');
    expect(screen.getByText(/需要修正/)).toHaveTextContent('信息不完整');
    rerender(<Steps items={items} current={3}/>);
    expect(screen.getAllByText('已完成')).toHaveLength(3);
    expect(document.querySelector('[aria-current=step]')).toBeNull();
  });
  it('groups fields semantically and supports native disabled fieldsets', () => {
    render(<Fieldset legend="连接" hint="只读任务暂不可编辑" disabled><TextField label="地址"/></Fieldset>);
    expect(screen.getByRole('group',{name:'连接'})).toHaveAccessibleDescription('只读任务暂不可编辑');
    expect(screen.getByRole('textbox',{name:'地址'})).toBeDisabled();
  });
  it('focuses an error summary only for submissions and links back without changing routes', () => {
    const errors=[{fieldId:'workspace',message:'请输入名称'}];
    const {rerender}=render(<><ErrorSummary errors={errors} focusKey={1}/><TextField id="workspace" label="名称"/></>);
    expect(screen.getByRole('region',{name:'请修正以下问题'})).toHaveFocus();
    const before=window.location.hash;fireEvent.click(screen.getByRole('link',{name:'请输入名称'}));
    expect(screen.getByRole('textbox')).toHaveFocus();expect(window.location.hash).toBe(before);
    rerender(<><ErrorSummary errors={[...errors]} focusKey={1}/><TextField id="workspace" label="名称"/></>);
    expect(screen.getByRole('textbox')).toHaveFocus();
    rerender(<><ErrorSummary errors={errors} focusKey={2}/><TextField id="workspace" label="名称"/></>);
    expect(screen.getByRole('region')).toHaveFocus();
  });
  it('opens a themed drawer and restores the trigger focus on Escape', async () => {
    render(<div className="rhine-theme" data-rhine-motion="reduced"><Drawer trigger={<button>查看详情</button>} title="详情" description="记录信息"><TextField label="备注"/></Drawer></div>);
    const trigger=screen.getByRole('button',{name:'查看详情'}); trigger.focus();fireEvent.click(trigger);
    const dialog=await screen.findByRole('dialog'); expect(dialog).toHaveClass('rhine-drawer');
    expect(dialog.closest('.rhine-theme')).toHaveAttribute('data-rhine-motion','reduced');
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    fireEvent.keyDown(document.activeElement!,{key:'Escape'});
    await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(()=>expect(trigger).toHaveFocus());
  });
  it('retains form input on failure and clears the summary only after valid resubmission', () => {
    render(<PatternGallery section="form-workflow"/>);
    fireEvent.change(screen.getByRole('textbox',{name:'工作区名称'}),{target:{value:'研究'}});
    fireEvent.click(screen.getByRole('button',{name:'验证配置'}));
    expect(screen.getByRole('textbox',{name:'工作区名称'})).toHaveValue('研究');
    expect(screen.getByRole('region')).toHaveFocus();
    fireEvent.change(screen.getByRole('textbox',{name:'服务地址'}),{target:{value:'https://example.com'}});
    fireEvent.click(screen.getByRole('button',{name:'验证配置'}));
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('没有保存到服务端');
  });
});
