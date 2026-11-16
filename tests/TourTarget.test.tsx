import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Tour } from '../components';
const owned:HTMLElement[]=[];
function target(id='tour-field') {const input=document.createElement('input');input.id=id;input.setAttribute('aria-label','真实目标');input.setAttribute('aria-describedby','existing-help');document.body.append(input);owned.push(input);vi.spyOn(input,'getBoundingClientRect').mockReturnValue({x:100,y:100,left:100,top:100,right:220,bottom:144,width:120,height:44,toJSON(){return {};}});return input;}
const defaults={title:'目标说明',description:'操作由宿主处理。',step:0,total:2,onNext:()=>undefined,onPrevious:()=>undefined,onClose:()=>undefined};
afterEach(()=>{owned.forEach(element=>element.remove());owned.length=0;vi.restoreAllMocks();});

describe('target-associated Tour',()=>{
  it('keeps legacy targetless behavior without a phantom highlight',()=>{
    render(<Tour {...defaults}/>);expect(screen.getByRole('dialog',{name:'目标说明'})).toHaveAttribute('data-target-state','legacy');expect(document.querySelector('[data-rhine-tour-target]')).toBeNull();expect(screen.getByRole('button',{name:'下一步'})).toBeEnabled();
  });
  it('links the exact description, measures an inert halo and moves keyboard focus on explicit intent',async()=>{
    const element=target();render(<Tour {...defaults} target={element}/>);const dialog=screen.getByRole('dialog',{name:'目标说明'});await waitFor(()=>expect(dialog).toHaveAttribute('data-target-state','ready'));
    const description=dialog.getAttribute('aria-describedby')!;expect(document.getElementById(description)).toHaveTextContent('操作由宿主处理。');expect(element.getAttribute('aria-describedby')).toBe(`existing-help ${description}`);expect(document.querySelector('[data-rhine-tour-target]')).toHaveAttribute('aria-hidden','true');expect(dialog).toHaveFocus();
    fireEvent.click(screen.getByRole('button',{name:'转到目标'}));expect(element).toHaveFocus();expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
  it('restores only its own association on unmount and retains host changes',async()=>{
    const element=target(),{unmount}=render(<Tour {...defaults} target={element}/>);await waitFor(()=>expect(element.getAttribute('aria-describedby')).not.toBe('existing-help'));element.setAttribute('aria-describedby',element.getAttribute('aria-describedby')+' newer-help');unmount();expect(element.getAttribute('aria-describedby')).toBe('existing-help newer-help');
  });
  it('does not advance for missing targets and emits a missing notification once',async()=>{
    const missing=vi.fn(),next=vi.fn();const props={...defaults,target:()=>null,onTargetMissing:missing,onNext:next};const{rerender}=render(<Tour {...props}/>);await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('目标暂不可用'));expect(screen.getByRole('button',{name:'下一步'})).toBeDisabled();fireEvent.click(screen.getByRole('button',{name:'下一步'}));rerender(<Tour {...props} target={()=>null}/>);expect(missing).toHaveBeenCalledTimes(1);expect(next).not.toHaveBeenCalled();
  });
  it('recovers through an explicit host retry without pretending the step completed',async()=>{
    const element=target(),retry=vi.fn(),next=vi.fn();let available:HTMLElement|null=null;retry.mockImplementation(()=>{available=element;});render(<Tour {...defaults} target={()=>available} onTargetRetry={retry} onNext={next}/>);await screen.findByRole('alert');fireEvent.click(screen.getByRole('button',{name:'重新查找'}));await waitFor(()=>expect(screen.getByRole('dialog')).toHaveAttribute('data-target-state','ready'));expect(screen.getByRole('button',{name:'下一步'})).toBeEnabled();expect(next).not.toHaveBeenCalled();
  });
  it('reacts to removal and replacement of a getter target',async()=>{
    const element=target('dynamic-target');const getter=()=>document.getElementById('dynamic-target');render(<Tour {...defaults} target={getter}/>);await waitFor(()=>expect(screen.getByRole('dialog')).toHaveAttribute('data-target-state','ready'));act(()=>element.remove());await waitFor(()=>expect(screen.getByRole('dialog')).toHaveAttribute('data-target-state','missing'));const replacement=target('dynamic-target');await waitFor(()=>expect(screen.getByRole('dialog')).toHaveAttribute('data-target-state','ready'));expect(replacement.getAttribute('aria-describedby')).toContain(screen.getByRole('dialog').getAttribute('aria-describedby'));
  });
  it('distinguishes hidden content from a missing node and recovers without a new Tour',async()=>{
    const element=target();element.hidden=true;render(<Tour {...defaults} target={element}/>);await waitFor(()=>expect(screen.getByRole('dialog')).toHaveAttribute('data-target-state','hidden'));expect(document.querySelector('[data-rhine-tour-target]')).toBeNull();act(()=>{element.hidden=false;});await waitFor(()=>expect(screen.getByRole('dialog')).toHaveAttribute('data-target-state','ready'));
  });
  it('uses the visible label for a transparent custom native input instead of misclassifying it as hidden',async()=>{
    const label=document.createElement('label'),input=document.createElement('input');label.textContent='原生定制';input.type='checkbox';input.style.opacity='0';label.append(input);document.body.append(label);owned.push(label);vi.spyOn(label,'getBoundingClientRect').mockReturnValue({x:50,y:50,left:50,top:50,right:150,bottom:94,width:100,height:44,toJSON(){return {};}});vi.spyOn(input,'getBoundingClientRect').mockReturnValue({x:50,y:50,left:50,top:50,right:51,bottom:51,width:1,height:1,toJSON(){return {};}});render(<Tour {...defaults} target={input}/>);await waitFor(()=>expect(screen.getByRole('dialog')).toHaveAttribute('data-target-state','ready'));expect((document.querySelector('[data-rhine-tour-target]') as HTMLElement).style.width).toBe('116px');fireEvent.click(screen.getByRole('button',{name:'转到目标'}));expect(input).toHaveFocus();
  });
  it('adds and removes temporary focusability only for a non-native target',async()=>{
    const element=document.createElement('section');element.textContent='只读区域';document.body.append(element);owned.push(element);vi.spyOn(element,'getBoundingClientRect').mockReturnValue({x:100,y:100,left:100,top:100,right:300,bottom:200,width:200,height:100,toJSON(){return {};}});const{unmount}=render(<Tour {...defaults} target={element}/>);await waitFor(()=>expect(element).toHaveAttribute('tabindex','-1'));unmount();expect(element).not.toHaveAttribute('tabindex');
  });
});


describe('hidden target normalization',()=>{
  it('does not turn a truly hidden input into a ready target merely because its label is visible',async()=>{
    const label=document.createElement('label'),input=document.createElement('input');label.textContent='隐藏输入';input.hidden=true;label.append(input);document.body.append(label);owned.push(label);vi.spyOn(label,'getBoundingClientRect').mockReturnValue({x:50,y:50,left:50,top:50,right:150,bottom:94,width:100,height:44,toJSON(){return {};}});render(<Tour {...defaults} target={input}/>);await waitFor(()=>expect(screen.getByRole('dialog')).toHaveAttribute('data-target-state','hidden'));expect(screen.getByRole('button',{name:'下一步'})).toBeDisabled();
  });
});


describe('guide context continuity',()=>{
  it('returns lost target focus to the guide for an atomic target replacement',async()=>{
    const element=target('replace-target');render(<Tour {...defaults} target={()=>document.getElementById('replace-target')}/>);await waitFor(()=>expect(screen.getByRole('dialog')).toHaveAttribute('data-target-state','ready'));fireEvent.click(screen.getByRole('button',{name:'转到目标'}));expect(element).toHaveFocus();act(()=>{element.remove();target('replace-target');});await waitFor(()=>expect(screen.getByRole('dialog')).toHaveFocus());expect(screen.getByRole('dialog')).toHaveAttribute('data-target-state','ready');
  });
  it('starts the next description at its beginning rather than retaining the old footer scroll',()=>{
    const{rerender}=render(<Tour {...defaults}/>);const dialog=screen.getByRole('dialog');dialog.scrollTop=80;rerender(<Tour {...defaults} step={1}/>);expect(dialog.scrollTop).toBe(0);
  });
});
