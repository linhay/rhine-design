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

it('yields a pending selector Tab guard to a parent-owned nested confirmation',async()=>{
 vi.useFakeTimers();
 function NestedHost(){const [query,setQuery]=useState('');return <Dialog title="父工作区" trigger={<Button>打开父层</Button>}><RemoteMultiSelect label="对象" query={query} onQueryChange={setQuery} value={[]} onValueChange={()=>{}} options={[]} /><Dialog title="保护草稿" trigger={<Button>打开确认</Button>}><Button>继续编辑</Button></Dialog></Dialog>;}
 render(<NestedHost/>);fireEvent.click(screen.getByRole('button',{name:'打开父层'}));const input=screen.getByRole('combobox');act(()=>input.focus());
 fireEvent.keyDown(input,{key:'Tab'});const complete=screen.getByRole('button',{name:'完成选择'});expect(complete).toHaveFocus();fireEvent.keyDown(complete,{key:'Tab'});
 fireEvent.click(screen.getByRole('button',{name:'打开确认'}));const resume=screen.getByRole('button',{name:'继续编辑'});act(()=>resume.focus());expect(resume).toHaveFocus();await act(async()=>{vi.runOnlyPendingTimers();});expect(resume).toHaveFocus();
});
