import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { Switch } from '../components';
it('associates the whole row label and hint with its native switch',()=>{
 const changed=vi.fn();render(<Switch layout="row" label="提醒" hint="确认后生效" checked={false} onCheckedChange={changed}/>);
 const input=screen.getByRole('switch',{name:'提醒'});expect(input.tagName).toBe('INPUT');expect(input).toHaveAccessibleDescription('确认后生效');fireEvent.click(screen.getByText('提醒'));expect(changed).toHaveBeenCalledWith(true);
});
it('keeps readonly focusable without callbacks and disables native interaction separately',()=>{
 const changed=vi.fn();const {rerender}=render(<Switch layout="row" label="提醒" checked readOnly onCheckedChange={changed}/>);const input=screen.getByRole('switch');input.focus();expect(input).toHaveFocus();expect(input).toHaveAttribute('aria-readonly','true');fireEvent.click(input);expect(changed).not.toHaveBeenCalled();expect(input).toBeChecked();rerender(<Switch layout="row" label="提醒" checked disabled onCheckedChange={changed}/>);expect(input).toBeDisabled();
});

it('hides only the visual label, preserves independent names and remains controlled',()=>{
 const changed=vi.fn();const {rerender}=render(<><Switch label="消息提醒启用" labelVisibility="hidden" checked={false} onCheckedChange={changed}/><Switch label="自动归档启用" labelVisibility="hidden" checked onCheckedChange={()=>{}}/></>);
 const first=screen.getByRole('switch',{name:'消息提醒启用'});expect(screen.getByRole('switch',{name:'自动归档启用'})).toBeChecked();
 expect(screen.getByText('消息提醒启用')).toHaveClass('rhine-sr-only');fireEvent.click(first);expect(changed).toHaveBeenCalledWith(true);expect(first).not.toBeChecked();
 rerender(<Switch label="消息提醒启用" labelVisibility="hidden" checked onCheckedChange={changed}/>);expect(screen.getByRole('switch')).toBeChecked();
 rerender(<Switch label="消息提醒启用" checked onCheckedChange={changed}/>);expect(screen.getByText('消息提醒启用')).not.toHaveClass('rhine-sr-only');
});
