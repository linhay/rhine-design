import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { SideNav } from '../components';

const groups = (disabled: boolean) => [{ label: '合成项目', items: [{ id: 'a', label: '可读名称', href: '#destination', disabled }] }];
it('removes disabled destinations and blocks primary, modified and auxiliary activation', () => {
  const navigate = vi.fn(), delegated = vi.fn();
  render(<div onClick={delegated} onAuxClick={delegated}><SideNav currentId="a" groups={groups(true)} onNavigate={navigate} /></div>);
  const link = screen.getByRole('link', { name: '可读名称' });
  expect(link).not.toHaveAttribute('href');
  expect(link).toHaveAttribute('aria-disabled', 'true');
  expect(link).toHaveAttribute('aria-current', 'page');
  expect(link.tabIndex).toBe(-1);
  for (const modifiers of [{}, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }]) expect(fireEvent.click(link, modifiers)).toBe(false);
  expect(fireEvent(link, new MouseEvent('auxclick', { button: 1, bubbles: true, cancelable: true }))).toBe(false);
  expect(navigate).not.toHaveBeenCalled(); expect(delegated).not.toHaveBeenCalled();
  expect(fireEvent.contextMenu(link)).toBe(true);
});
it('retains the focused node and current identity through disable and re-enable', () => {
  const navigate = vi.fn();
  const { rerender } = render(<SideNav currentId="a" groups={groups(false)} onNavigate={navigate} />);
  const link = screen.getByRole('link', { name: '可读名称' }); link.focus();
  rerender(<SideNav currentId="a" groups={groups(true)} onNavigate={navigate} />);
  expect(link).toHaveFocus(); expect(link).not.toHaveAttribute('href'); expect(link.tabIndex).toBe(-1);
  fireEvent.click(link); expect(navigate).not.toHaveBeenCalled();
  rerender(<SideNav currentId="a" groups={groups(false)} onNavigate={navigate} />);
  expect(link).toHaveFocus(); expect(link).toHaveAttribute('href', '#destination'); expect(link.tabIndex).toBe(0);
  expect(link).not.toHaveAttribute('aria-disabled'); expect(link).toHaveAttribute('aria-current', 'page');
  for (const modifiers of [{}, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }]) expect(fireEvent.click(link, modifiers)).toBe(true);
  expect(navigate).toHaveBeenCalledTimes(4);
  expect(fireEvent(link, new MouseEvent('auxclick', { button: 1, bubbles: true, cancelable: true }))).toBe(true);
  expect(fireEvent.contextMenu(link)).toBe(true);
});


it('keeps nested native links independent and marks only the selected child', () => {
  const navigate = vi.fn();
  render(<SideNav currentId="child" onNavigate={(item,event)=>{event.preventDefault();navigate(item.id);}} groups={[{label:'应用能力',items:[{id:'parent',label:'Chat 基石',href:'#chat',children:[{id:'child',label:'Composer',href:'#composer'}]}]}]} />);
  const parent=screen.getByRole('link',{name:'Chat 基石'}),child=screen.getByRole('link',{name:'Composer'});
  expect(parent).not.toHaveAttribute('aria-current');
  expect(child).toHaveAttribute('aria-current','page');
  expect(child).toHaveAttribute('href','#composer');
  expect(child.closest('ul')).toHaveAttribute('aria-label','Chat 基石子导航');
  fireEvent.click(child);expect(navigate).toHaveBeenCalledWith('child');
});

it('inherits ancestor disablement without losing descendant disabled states or actions', () => {
  const navigate=vi.fn(),action=vi.fn();
  const nested=(disabled:boolean)=>[{label:'应用',items:[{id:'parent',label:'父项',href:'#parent',disabled,children:[
    {id:'child',label:'子项',href:'#child',actions:[{id:'details',label:'详情',onSelect:action}]},
    {id:'locked',label:'不可用子项',href:'#locked',disabled:true},
  ]}]}];
  const {rerender}=render(<SideNav groups={nested(true)} currentId="child" onNavigate={navigate} />);
  const child=screen.getByRole('link',{name:'子项'});
  expect(child).not.toHaveAttribute('href');expect(child.tabIndex).toBe(-1);
  expect(screen.getByRole('button',{name:'子项：更多操作'})).toBeDisabled();
  fireEvent.click(child);expect(navigate).not.toHaveBeenCalled();
  rerender(<SideNav groups={nested(false)} currentId="child" onNavigate={navigate} />);
  expect(child).toHaveAttribute('href','#child');expect(child.tabIndex).toBe(0);
  expect(screen.getByRole('button',{name:'子项：更多操作'})).not.toBeDisabled();
  expect(screen.getByRole('link',{name:'不可用子项'})).not.toHaveAttribute('href');
});
