import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { SettingsNavigation } from '../components';
const items=[{id:'general',label:'常规'},{id:'manage',label:'管理',disabled:true}];
it('shares current value and disabled choices across SideNav and native Select',()=>{
 const onNavigate=vi.fn();const {rerender}=render(<SettingsNavigation items={items} currentId="general" onNavigate={onNavigate}/>);
 expect(screen.getByRole('combobox',{name:'设置栏目'})).toHaveValue('general');expect(screen.getByRole('link',{name:'常规'})).toHaveAttribute('aria-current','page');expect(screen.getByRole('option',{name:'管理'})).toBeDisabled();
 fireEvent.click(screen.getByRole('link',{name:'管理'}));fireEvent.change(screen.getByRole('combobox'),{target:{value:'manage'}});expect(onNavigate).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('link',{name:'常规'}));expect(onNavigate).toHaveBeenLastCalledWith(items[0]);onNavigate.mockClear();
 rerender(<SettingsNavigation items={items} currentId="general" disabled onNavigate={onNavigate}/>);expect(screen.getByRole('combobox')).toBeDisabled();expect(screen.getByRole('link',{name:'常规'})).toHaveAttribute('tabindex','-1');fireEvent.click(screen.getByRole('link',{name:'常规'}));expect(onNavigate).not.toHaveBeenCalled();
});
it('does not navigate to missing items or invent an available selection',()=>{
 const onNavigate=vi.fn();render(<SettingsNavigation items={[]} currentId="missing" onNavigate={onNavigate}/>);expect(screen.getByRole('combobox')).toBeDisabled();expect(screen.getByRole('option',{name:'请选择栏目'})).toBeDisabled();expect(onNavigate).not.toHaveBeenCalled();
});
