import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { Button, Dialog, NumberField } from '../components';

function Form({ save, noValidate=false }: {save:(value:number|null)=>void;noValidate?:boolean}) {
  const [value,setValue]=useState<number|null>(1.5);
  return <form aria-label="Settings" noValidate={noValidate} onSubmit={event=>{event.preventDefault(); if(event.currentTarget.checkValidity()) save(value);}}>
    <NumberField label="Amount" name="amount" value={value} onValueChange={setValue} min={-10} max={100} precision={1} required />
    <Button type="submit">Save</Button>
  </form>;
}
it.each([false,true])('blocks invalid current drafts instead of saving the old value (noValidate=%s)', noValidate=>{
  const save=vi.fn(); render(<Form save={save} noValidate={noValidate}/>);
  const input=screen.getByRole('spinbutton') as HTMLInputElement, form=input.form!;
  for(const draft of ['-','101','']) {
    fireEvent.change(input,{target:{value:draft}});
    expect(input.validity.valid).toBe(false);
    act(()=>form.requestSubmit());
    expect(save).not.toHaveBeenCalled(); expect(input).toHaveValue(draft);
  }
  fireEvent.change(input,{target:{value:'2.54'}});
  act(()=>form.requestSubmit());
  expect(save).toHaveBeenCalledExactlyOnceWith(2.5);
  expect(input).toHaveValue('2.5');
});
it('updates native validity for external rules/value/error and skips non-editable fields',()=>{
  const change=vi.fn(); const props={label:'Amount',value:4,onValueChange:change};
  const {rerender}=render(<NumberField {...props}/>); const input=screen.getByRole('spinbutton') as HTMLInputElement;
  fireEvent.change(input,{target:{value:'-'}}); expect(input.validity.valid).toBe(false);
  rerender(<NumberField {...props} value={5}/>); expect(input.value).toBe('5');expect(input.validity.valid).toBe(true);
  rerender(<NumberField {...props} value={5} max={3}/>);expect(input.validity.valid).toBe(false);expect(change).not.toHaveBeenCalled();
  rerender(<NumberField {...props} value={5} error="Business rule"/>);expect(input.validationMessage).toBe('Business rule');
  rerender(<NumberField {...props} value={5} error="Business rule" readOnly/>);expect(input.willValidate).toBe(false);
  rerender(<NumberField {...props} value={5} error="Business rule" disabled/>);expect(input.willValidate).toBe(false);
  rerender(<NumberField {...props} value={5}/>);expect(input.validity.valid).toBe(true);
  rerender(<NumberField {...props} value={null} min={10} max={1}/>);expect(input.validity.valid).toBe(false);
});
it('preserves transient editing, IME and legacy 229, then restores validity with Escape',()=>{
  const change=vi.fn();render(<NumberField label="Amount" value={1.5} onValueChange={change}/>);
  const input=screen.getByRole('spinbutton') as HTMLInputElement;
  fireEvent.change(input,{target:{value:'-'}});expect(screen.queryByRole('alert')).not.toBeInTheDocument();expect(input.validity.valid).toBe(false);
  fireEvent.compositionStart(input);fireEvent.keyDown(input,{key:'Enter'});fireEvent.keyDown(input,{key:'ArrowUp'});expect(change).not.toHaveBeenCalled();
  fireEvent.compositionEnd(input);fireEvent.keyDown(input,{key:'Escape',keyCode:229});expect(input.value).toBe('-');
  fireEvent.keyDown(input,{key:'Escape'});expect(input.value).toBe('1.5');expect(input.validity.valid).toBe(true);
  fireEvent.change(input,{target:{value:'1.'}});expect(input.value).toBe('1.');expect(change).not.toHaveBeenCalled();
  fireEvent.keyDown(input,{key:'Enter'});expect(change).toHaveBeenCalledExactlyOnceWith(1);
});
it('restores its draft before the surrounding Dialog can dismiss',()=>{
  render(<Dialog title="Editor" trigger={<Button>Open</Button>}><NumberField label="Amount" value={4} onValueChange={()=>{}}/></Dialog>);
  fireEvent.click(screen.getByRole('button',{name:'Open'}));const input=screen.getByRole('spinbutton');
  fireEvent.change(input,{target:{value:'-'}});fireEvent.keyDown(input,{key:'Escape'});
  expect(input).toHaveValue('4');expect(screen.getByRole('dialog')).toBeVisible();
  fireEvent.keyDown(input,{key:'Escape'});expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('commits before capture handlers, and clears composition on window loss',()=>{
  const save=vi.fn();
  function CaptureForm(){const [value,setValue]=useState<number|null>(4);return <form onSubmitCapture={event=>{event.preventDefault();save(value);}}><NumberField label="Amount" value={value} onValueChange={setValue}/></form>;}
  const {unmount}=render(<CaptureForm/>);const input=screen.getByRole('spinbutton') as HTMLInputElement;
  fireEvent.compositionStart(input);expect(input.validity.valid).toBe(false);
  fireEvent(input.ownerDocument.defaultView!,new Event('blur'));expect(input.validity.valid).toBe(true);
  fireEvent.change(input,{target:{value:'8'}});act(()=>input.form!.requestSubmit());expect(save).toHaveBeenCalledExactlyOnceWith(8);
  unmount();
});
it('commits both pending fields in one requestSubmit without replacing dispatch listeners',()=>{
  const save=vi.fn();
  function Pair(){const [a,setA]=useState<number|null>(1),[b,setB]=useState<number|null>(2);return <form onSubmit={event=>{event.preventDefault();if(event.currentTarget.checkValidity())save(a,b);}}><NumberField label="A" value={a} onValueChange={setA}/><NumberField label="B" value={b} onValueChange={setB}/></form>;}
  render(<Pair/>);const a=screen.getByRole('spinbutton',{name:'A'}) as HTMLInputElement,b=screen.getByRole('spinbutton',{name:'B'});
  fireEvent.change(a,{target:{value:'5'}});fireEvent.change(b,{target:{value:'6'}});
  act(()=>a.form!.requestSubmit());expect(save).toHaveBeenCalledExactlyOnceWith(5,6);
});
it('revalidates constraints changed by another field before a host save',()=>{
  const save=vi.fn();
  function Pair(){const [limit,setLimit]=useState<number|null>(10),[amount,setAmount]=useState<number|null>(8);return <form onSubmit={event=>{event.preventDefault();if(event.currentTarget.checkValidity())save(limit,amount);}}><NumberField label="Limit" value={limit} onValueChange={setLimit}/><NumberField label="Amount" value={amount} onValueChange={setAmount} max={limit??undefined}/></form>;}
  render(<Pair/>);const limit=screen.getByRole('spinbutton',{name:'Limit'}) as HTMLInputElement,amount=screen.getByRole('spinbutton',{name:'Amount'}) as HTMLInputElement;
  fireEvent.change(limit,{target:{value:'3'}});fireEvent.change(amount,{target:{value:'7'}});
  act(()=>limit.form!.requestSubmit());expect(save).not.toHaveBeenCalled();expect(amount.validity.valid).toBe(false);expect(amount.value).toBe('7');
});
it('keeps its submit listener across rerenders and removes it on unmount',()=>{
  const add=vi.spyOn(document,'addEventListener'),remove=vi.spyOn(document,'removeEventListener');
  const props={label:'Amount',value:1,onValueChange:()=>{}};
  const {rerender,unmount}=render(<NumberField {...props}/>);
  const handlers=add.mock.calls.filter(([type,,options])=>type==='submit'&&options===true);
  expect(handlers).toHaveLength(1);
  rerender(<NumberField {...props} value={2}/>);
  expect(add.mock.calls.filter(([type,,options])=>type==='submit'&&options===true)).toHaveLength(1);
  expect(remove).not.toHaveBeenCalledWith('submit',handlers[0][1],true);
  unmount();expect(remove).toHaveBeenCalledWith('submit',handlers[0][1],true);
  add.mockRestore();remove.mockRestore();
});
it('blocks a rejected earlier draft even if a later field could relax its bound',()=>{
  const save=vi.fn(),capture=vi.fn();
  function Pair(){const [amount,setAmount]=useState<number|null>(1),[limit,setLimit]=useState<number|null>(3);return <form noValidate onSubmitCapture={capture} onSubmit={event=>{event.preventDefault();if(event.currentTarget.checkValidity())save(amount,limit);}}><NumberField label="Amount" value={amount} onValueChange={setAmount} max={limit??undefined}/><NumberField label="Limit" value={limit} onValueChange={setLimit}/></form>;}
  render(<Pair/>);const amount=screen.getByRole('spinbutton',{name:'Amount'}) as HTMLInputElement,limit=screen.getByRole('spinbutton',{name:'Limit'});
  fireEvent.change(amount,{target:{value:'7'}});fireEvent.change(limit,{target:{value:'10'}});
  act(()=>amount.form!.requestSubmit());
  expect(save).not.toHaveBeenCalled();expect(capture).not.toHaveBeenCalled();expect(amount.value).toBe('7');expect(limit).toHaveValue('10');
  // Explicitly accept the constraint before retrying; rejected submissions do not solve cross-field dependencies.
  fireEvent.keyDown(limit,{key:'Enter'});act(()=>amount.form!.requestSubmit());
  expect(save).toHaveBeenCalledExactlyOnceWith(7,10);
});
it.each(['outside','first-legend','second-legend'] as const)('respects native disabled fieldset semantics (%s)',position=>{
  const change=vi.fn(),save=vi.fn();
  function Group(){const [value,setValue]=useState<number|null>(1.25);const field=<NumberField label="Amount" value={value} precision={1} onValueChange={next=>{change(next);setValue(next);}}/>;return <form onSubmit={event=>{event.preventDefault();save(value);}}><fieldset disabled><legend>{position==='first-legend'?field:'Group'}</legend>{position==='second-legend'?<legend>{field}</legend>:position==='outside'?field:null}</fieldset></form>;}
  render(<Group/>);const input=screen.getByRole('spinbutton') as HTMLInputElement;
  expect(input.matches(':disabled')).toBe(position!=='first-legend');
  act(()=>input.form!.requestSubmit());
  if(position==='first-legend'){expect(change).toHaveBeenCalledExactlyOnceWith(1.3);expect(save).toHaveBeenCalledExactlyOnceWith(1.3);}else{expect(change).not.toHaveBeenCalled();expect(input.value).toBe('1.25');expect(save).toHaveBeenCalledExactlyOnceWith(1.25);}
});
