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
