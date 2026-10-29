import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SideNav } from '../components';
import { NavActionsGallery } from '../preview/NavActionsGallery';
describe('SideNav trailing actions', () => {
  it('omits empty actions and keeps action triggers outside links', async () => {
    const navigate = vi.fn(), action = vi.fn();
    render(<SideNav currentId="a" onNavigate={navigate} groups={[{label:'项目', items:[
      {id:'a', label:'甲', href:'#a', actions:[{id:'details',label:'详情',onSelect:action}]},
      {id:'b', label:'乙', href:'#b', actions:[]}, {id:'c',label:'丙',href:'#c'},
    ]}]} />);
    const trigger = screen.getByRole('button', {name:'甲：更多操作'});
    expect(trigger.closest('a')).toBeNull(); expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('link', {name:'乙'}).parentElement).toHaveTextContent('乙');
    fireEvent.keyDown(trigger, {key:'Enter'});
    fireEvent.click(await screen.findByRole('menuitem', {name:'详情'}));
    expect(navigate).not.toHaveBeenCalled(); expect(action).toHaveBeenCalledWith(trigger);
  });
  it('opens a controlled dialog and returns focus to the originating more button', async () => {
    render(<NavActionsGallery />);
    const trigger = screen.getByRole('button', {name:'合成工作区：更多操作'});
    trigger.focus(); fireEvent.keyDown(trigger, {key:'Enter'});
    fireEvent.click(await screen.findByRole('menuitem', {name:'查看详情'}));
    expect(await screen.findByRole('dialog', {name:'工作区详情'})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name:'关闭对话框'}));
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.getByRole('link', {name:'合成工作区'})).toHaveAttribute('aria-current','page');
  });
});

it('disables an already-open trailing action when its navigation item becomes disabled', async () => {
 const action=vi.fn();const groups=(disabled:boolean)=>[{label:'项目',items:[{id:'a',label:'甲',href:'#a',disabled,actions:[{id:'details',label:'详情',onSelect:action}]}]}];
 const {rerender}=render(<SideNav currentId="a" groups={groups(false)}/>);const trigger=screen.getByRole('button',{name:'甲：更多操作'});fireEvent.keyDown(trigger,{key:'Enter'});await screen.findByRole('menuitem',{name:'详情'});
 rerender(<SideNav currentId="a" groups={groups(true)}/>);const item=screen.getByRole('menuitem',{name:'详情'});expect(item).toHaveAttribute('aria-disabled','true');fireEvent.click(item);expect(action).not.toHaveBeenCalled();expect(trigger).toBeDisabled();
});
