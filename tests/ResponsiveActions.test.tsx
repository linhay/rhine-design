import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ResponsiveActions, type ResponsiveAction } from '../components';
let width=500;
const observers:Observer[]=[];
class Observer {
 nodes:Element[]=[];disconnected=false;constructor(readonly callback:ResizeObserverCallback){observers.push(this);}
 observe(node:Element){this.nodes.push(node);}unobserve(){}disconnect(){this.disconnected=true;}
}
beforeEach(()=>{
 width=500;observers.length=0;vi.useFakeTimers();vi.stubGlobal('ResizeObserver',Observer);
 vi.spyOn(HTMLElement.prototype,'clientWidth','get').mockImplementation(function(this:HTMLElement){return this.classList.contains('rhine-responsive-actions')?width:0;});
 vi.spyOn(HTMLElement.prototype,'offsetWidth','get').mockImplementation(function(this:HTMLElement){return this.classList.contains('rhine-responsive-actions__probe')?(this.querySelector('.rhine-responsive-actions__icon')?148:320):0;});
 vi.spyOn(HTMLElement.prototype,'getClientRects').mockImplementation(()=>[{width:100,height:44}] as unknown as DOMRectList);
});
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});
const items=():ResponsiveAction[]=>[{id:'a',label:'刷新',icon:'refresh',onSelect:vi.fn()},{id:'b',label:'复制',icon:'copy',onSelect:vi.fn()},{id:'c',label:'管理',icon:'settings',onSelect:vi.fn()}];
const resize=(next:number)=>act(()=>{width=next;observers.filter(o=>!o.disconnected&&o.nodes.some(n=>n.classList.contains('rhine-responsive-actions'))).forEach(o=>o.callback([],o as unknown as ResizeObserver));vi.advanceTimersByTime(20);});
it('uses measured representations and preserves the focused button node between text and icons',()=>{
 const actions=items();render(<ResponsiveActions label="操作" items={actions}/>);
 const root=screen.getByRole('group',{name:'操作'}),copy=screen.getByRole('button',{name:'复制'});expect(root).toHaveAttribute('data-mode','text');copy.focus();resize(200);
 expect(root).toHaveAttribute('data-mode','icons');expect(screen.getByRole('button',{name:'复制'})).toBe(copy);expect(copy).toHaveFocus();
 resize(500);expect(root).toHaveAttribute('data-mode','text');expect(copy).toHaveFocus();fireEvent.click(copy);expect(actions[1].onSelect).toHaveBeenCalledOnce();
});
it('hands focus to more when collapsing, pins it through widening and restores after focus leaves',()=>{
 render(<><ResponsiveActions label="操作" items={items()}/><button>之后</button></>);
 screen.getByRole('button',{name:'复制'}).focus();resize(80);const more=screen.getByRole('button',{name:'更多操作'});expect(more).toHaveFocus();
 expect(screen.queryByRole('button',{name:'复制'})).toBeNull();resize(500);expect(screen.getByRole('group',{name:'操作'})).toHaveAttribute('data-mode','menu');
 act(()=>{screen.getByRole('button',{name:'之后'}).focus();vi.advanceTimersByTime(20);});expect(screen.getByRole('group',{name:'操作'})).toHaveAttribute('data-mode','text');expect(screen.getByRole('button',{name:'之后'})).toHaveFocus();
});
it('keeps permissions, order, busy and disabled guards in a keyboard menu and resets a removed group',()=>{
 width=80;const actions=items(),props={label:'操作',items:[{...actions[0],busy:true},{...actions[1],disabled:true},actions[2],{id:'hidden',label:'无权限',icon:'info' as const,onSelect:vi.fn(),hidden:true}]};
 const {rerender}=render(<><ResponsiveActions {...props}/><button>之后</button></>);
 const more=screen.getByRole('button',{name:'更多操作'});more.focus();fireEvent.keyDown(more,{key:'ArrowDown'});act(()=>vi.advanceTimersByTime(30));
 expect(screen.getAllByRole('menuitem').map(n=>n.textContent)).toEqual(['刷新（处理中）','复制','管理']);expect(screen.getByRole('menuitem',{name:'刷新（处理中）'})).toHaveAttribute('data-disabled');expect(screen.getByRole('menuitem',{name:'复制'})).toHaveAttribute('data-disabled');
 fireEvent.click(screen.getByRole('menuitem',{name:'刷新（处理中）'}));expect(actions[0].onSelect).not.toHaveBeenCalled();
 screen.getByRole('menuitem',{name:'管理'}).focus();rerender(<><ResponsiveActions label="操作" items={[]}/><button>之后</button></>);act(()=>vi.advanceTimersByTime(30));
 expect(screen.queryByRole('menu')).toBeNull();expect(screen.getByRole('button',{name:'之后'})).toHaveFocus();
 rerender(<><ResponsiveActions {...props}/><button>之后</button></>);expect(screen.queryByRole('menu')).toBeNull();expect(screen.getByRole('button',{name:'更多操作'})).not.toHaveAttribute('aria-expanded','true');
});
it('repairs focus when the current action is removed and disconnects measurements on unmount',()=>{
 const actions=items();const {rerender,unmount}=render(<ResponsiveActions label="操作" items={actions}/>);screen.getByRole('button',{name:'复制'}).focus();
 rerender(<ResponsiveActions label="操作" items={[actions[0],actions[2]]}/>);expect(screen.getByRole('button',{name:'管理'})).toHaveFocus();
 const active=[...observers].reverse().find(o=>o.nodes.some(n=>n.classList.contains('rhine-responsive-actions')));unmount();expect(active?.disconnected).toBe(true);
});
it('keeps menu mode until close autofocus finishes after widening',async()=>{
 width=80;render(<><ResponsiveActions label="操作" items={items()}/><button>之后</button></>);
 const more=screen.getByRole('button',{name:'更多操作'});more.focus();fireEvent.keyDown(more,{key:'ArrowDown'});await act(async()=>{await vi.advanceTimersByTimeAsync(30);});
 screen.getByRole('menuitem',{name:'管理'}).focus();resize(500);fireEvent.keyDown(document.activeElement!,{key:'Escape'});await act(async()=>{await vi.advanceTimersByTimeAsync(100);});
 expect(screen.getByRole('group',{name:'操作'})).toHaveAttribute('data-mode','menu');expect(more).toHaveFocus();
 act(()=>{screen.getByRole('button',{name:'之后'}).focus();vi.advanceTimersByTime(20);});expect(screen.getByRole('group',{name:'操作'})).toHaveAttribute('data-mode','text');
});
