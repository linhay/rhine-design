import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { Button, Dialog, RemoteMultiSelect, Switch } from '../components';
afterEach(()=>vi.useRealTimers());
function Host(){
 const [query,setQuery]=useState(''),[checked,setChecked]=useState(false);
 return <Dialog title="焦点交接" trigger={<Button>打开</Button>}><RemoteMultiSelect label="对象" query={query} onQueryChange={setQuery} value={[]} onValueChange={()=>{}} options={[{value:'a',label:'合成对象'}]} /><Switch label="启用" checked={checked} onCheckedChange={setChecked} /></Dialog>;
}
it('does not restore a closing selector over a deliberate move to another control',async()=>{
 vi.useFakeTimers();render(<Host />);fireEvent.click(screen.getByRole('button',{name:'打开'}));const input=screen.getByRole('combobox'),toggle=screen.getByRole('switch');
 act(()=>input.focus());fireEvent.click(screen.getByRole('button',{name:'完成选择'}));act(()=>toggle.focus());expect(toggle).toHaveFocus();
 await act(async()=>{vi.runOnlyPendingTimers();});expect(toggle).toHaveFocus();expect(input).toHaveAttribute('aria-expanded','false');
});
it('does not close a newly reopened selector when the prior scope finishes',async()=>{
 vi.useFakeTimers();render(<Host />);fireEvent.click(screen.getByRole('button',{name:'打开'}));const input=screen.getByRole('combobox');
 act(()=>input.focus());fireEvent.click(screen.getByRole('button',{name:'完成选择'}));fireEvent.click(input);
 await act(async()=>{vi.runOnlyPendingTimers();});expect(input).toHaveFocus();expect(input).toHaveAttribute('aria-expanded','true');
});
