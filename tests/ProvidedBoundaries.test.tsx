import { useState } from 'react';
import { flushSync } from 'react-dom';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Anchor, Avatar, Carousel, Collapse, ColorPicker, Mentions, Rate, Transfer, Upload, VirtualList } from '../components';
import { GalleryShell } from '../preview/GalleryShell';
afterEach(() => { vi.unstubAllGlobals(); window.history.replaceState(null, '', '/'); });

describe('provided component boundary regressions', () => {
  it('Avatar retries when the source changes after a failure', () => {
    const {container,rerender}=render(<Avatar name="合成用户" src="old.png" />);
    fireEvent.error(container.querySelector('img')!);
    rerender(<Avatar name="合成用户" src="new.png" />);
    expect(container.querySelector('img')).toHaveAttribute('src','new.png');
  });
  it('Carousel disables empty-list navigation without a NaN request', () => {
    const change=vi.fn();render(<Carousel label="空轮播" items={[]} index={0} onChange={change}/>);
    fireEvent.click(screen.getByRole('button',{name:'下一张'}));
    expect(change).not.toHaveBeenCalled();
    expect(screen.getByRole('button',{name:'下一张'})).toBeDisabled();
  });
  it('Carousel leaves input cursor keys and the editor alone', () => {
    function Demo(){const[index,setIndex]=useState(0);return <Carousel label="含输入" index={index} onChange={setIndex} items={[<input key="a" aria-label="草稿" defaultValue="保留文字"/>,<p key="b">下一页</p>]}/>;}
    render(<Demo/>);const input=screen.getByRole('textbox',{name:'草稿'});act(()=>input.focus());fireEvent.keyDown(input,{key:'ArrowRight'});
    expect(screen.getByRole('textbox',{name:'草稿'})).toHaveValue('保留文字');
    expect(screen.queryByText('下一页')).not.toBeInTheDocument();
  });
  it('VirtualList keeps a draft with its stable item after reordering', () => {
    const props={label:'重排列表',renderItem:(item:{id:string;text:string})=><><span>{item.id}</span><input aria-label={item.id} defaultValue={item.text}/></>};
    const a={id:'甲',text:'甲内容'},b={id:'乙',text:'乙内容'};
    const{rerender}=render(<VirtualList {...props} items={[a,b]}/>);
    fireEvent.change(screen.getByRole('textbox',{name:'甲'}),{target:{value:'甲的编辑草稿'}});
    rerender(<VirtualList {...props} items={[b,a]}/>);
    expect(screen.getByRole('textbox',{name:'乙'})).toHaveValue('乙内容');
    expect(screen.getByRole('textbox',{name:'甲'})).toHaveValue('甲的编辑草稿');
  });
  it('Upload disables every change entry point', () => {
    const change=vi.fn();render(<Upload label="附件" files={[new File(['demo'],'synthetic.txt')]} onChange={change} disabled/>);
    expect(screen.getByLabelText('附件')).toBeDisabled();
    expect(screen.getByRole('button',{name:'移除'})).toBeDisabled();
    fireEvent.click(screen.getByRole('button',{name:'移除'}));expect(change).not.toHaveBeenCalled();
  });
  it('Rate isolates same-label instances', () => {
    function Demo(){const[a,setA]=useState(1),[b,setB]=useState(2);return <><Rate label="评分" value={a} onChange={setA}/><Rate label="评分" value={b} onChange={setB}/></>;}
    render(<Demo/>);const radios=screen.getAllByRole('radio') as HTMLInputElement[];
    expect(new Set(radios.map(input=>input.name)).size).toBe(2);
    fireEvent.click(radios[2]);
    expect(radios.filter(input=>input.checked).length).toBe(2);
  });
  it('Collapse enforces the dynamic accordion constraint', () => {
    const props={label:'折叠',items:[{id:'a',title:'甲',content:'甲内容'},{id:'b',title:'乙',content:'乙内容'}]};
    const{rerender}=render(<Collapse {...props}/>);rerender(<Collapse {...props} accordion/>);
    expect(screen.getAllByRole('region')).toHaveLength(1);
  });
  it('Transfer preserves checks when a controlled move is rejected', () => {
    render(<Transfer label="分配" source={[{id:'a',label:'甲'},{id:'b',label:'乙'}]} target={['b']} onChange={()=>undefined}/>);
    fireEvent.click(screen.getByRole('checkbox',{name:'甲'}));fireEvent.click(screen.getByRole('button',{name:'移到已选'}));
    expect(within(screen.getByRole('list',{name:'可选'})).getByRole('checkbox',{name:'甲'})).toBeChecked();
  });
  it('Transfer never applies stale focus on a later equivalent target', () => {
    const source=[{id:'a',label:'甲'},{id:'b',label:'乙'}];
    const view=(target:string[])=><><Transfer label="分配" source={source} target={target} onChange={()=>undefined}/><input aria-label="后续编辑"/></>;
    const{rerender}=render(view(['b']));fireEvent.click(screen.getByRole('checkbox',{name:'甲'}));fireEvent.click(screen.getByRole('button',{name:'移到已选'}));
    act(()=>screen.getByRole('textbox',{name:'后续编辑'}).focus());rerender(view(['b']));
    expect(screen.getByRole('textbox',{name:'后续编辑'})).toHaveFocus();
  });
  it('Mentions initial ArrowUp selects the last available option', async () => {
    function Demo(){const[value,setValue]=useState('请 @');return <Mentions label="提及" value={value} onChange={setValue} options={['Alpha','Beta']}/>;}
    render(<Demo/>);const input=screen.getByRole('combobox') as HTMLTextAreaElement;
    act(()=>{input.focus();input.setSelectionRange(3,3);});fireEvent.select(input);await screen.findByRole('option',{name:'Beta'});
    fireEvent.keyDown(input,{key:'ArrowUp'});
    expect(document.getElementById(input.getAttribute('aria-activedescendant')!)).toHaveTextContent('Beta');
  });
  it('Anchor legacy fragments stay in the gallery chapter', () => {
    vi.stubGlobal('IntersectionObserver',class{observe(){}disconnect(){}});
    window.history.replaceState(null,'','/#anchor');
    render(<GalleryShell motion="system" onMotionChange={()=>undefined}>{section=><><h1>{section}</h1>{section==='anchor'&&<><Anchor label="章节" items={[{id:'anchor-a',label:'第一节'}]}/><section id="anchor-a">目标</section></>}</>}</GalleryShell>);
    expect(screen.getByRole('link',{name:'第一节'})).toHaveAttribute('href','#anchor-a');
    act(()=>{window.history.replaceState(null,'','#anchor-a');window.dispatchEvent(new HashChangeEvent('hashchange'));});
    expect(screen.getByRole('heading',{level:1})).toHaveTextContent('anchor');
    expect(document.getElementById('anchor-a')).toBeInTheDocument();
  });
  it('ColorPicker connects invalid state, error text and target sizing', () => {
    render(<ColorPicker label="颜色" value="wrong" onChange={()=>undefined}/>);
    const field=screen.getByRole('textbox',{name:'颜色色值'});
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(field).toHaveAttribute('aria-invalid','true');
    expect(field.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
    expect(field.matches('.rhine-color input[type=text]')).toBe(true);
  });
});


describe('related controlled-state and lifecycle boundaries', () => {
  it('Avatar retries a previous URL after leaving it and ignores a detached image error', () => {
    const {container,rerender}=render(<Avatar name="头像" src="a.png"/>);
    const old=container.querySelector('img')!;fireEvent.error(old);
    rerender(<Avatar name="头像" src="b.png"/>);fireEvent.error(old);
    expect(container.querySelector('img')).toHaveAttribute('src','b.png');
    rerender(<Avatar name="头像" src="a.png"/>);expect(container.querySelector('img')).toHaveAttribute('src','a.png');
  });
  it('Carousel clamps invalid controlled indexes without emitting a fabricated change', () => {
    const change=vi.fn(),props={label:'边界轮播',items:['第一页','第二页'],onChange:change};
    const {rerender}=render(<Carousel {...props} index={999}/>);expect(screen.getByText('第二页')).toBeInTheDocument();
    rerender(<Carousel {...props} index={NaN}/>);expect(screen.getByText('第一页')).toBeInTheDocument();
    rerender(<Carousel {...props} items={['独立页']} index={2}/>);
    expect(screen.getByRole('button',{name:'下一张'})).toBeDisabled();expect(screen.getByText('独立页')).toBeInTheDocument();expect(change).not.toHaveBeenCalled();
  });
  it('VirtualList accepts explicit identity for immutable items without an id', () => {
    const props={label:'自定义键',getItemKey:(item:{name:string})=>item.name,renderItem:(item:{name:string})=><input aria-label={item.name} defaultValue={item.name}/>};
    const {rerender}=render(<VirtualList {...props} items={[{name:'甲'},{name:'乙'}]}/>);
    fireEvent.change(screen.getByRole('textbox',{name:'甲'}),{target:{value:'甲草稿'}});
    rerender(<VirtualList {...props} items={[{name:'乙'},{name:'甲'}]}/>);
    expect(screen.getByRole('textbox',{name:'甲'})).toHaveValue('甲草稿');expect(screen.getByRole('textbox',{name:'乙'})).toHaveValue('乙');
  });
  it('VirtualList keeps a focused edited row mounted and reveals its new distant position', () => {
    const items=Array.from({length:40},(_,index)=>({id:String(index)}));
    const props={label:'编辑列表',height:88,renderItem:(item:{id:string})=><input aria-label={`行${item.id}`} defaultValue={item.id}/>};
    const {rerender}=render(<VirtualList {...props} items={items}/>);const input=screen.getByRole('textbox',{name:'行0'});act(()=>input.focus());
    fireEvent.change(input,{target:{value:'保留草稿'}});rerender(<VirtualList {...props} items={[...items.slice(1,21),items[0],...items.slice(21)]}/>);
    expect(input).toHaveFocus();expect(input).toHaveValue('保留草稿');expect(screen.getByRole('list').scrollTop).toBeGreaterThan(0);
    expect(screen.getAllByRole('listitem').length).toBeLessThanOrEqual(7);
    expect(input.closest('[role=listitem]')).toHaveAttribute('aria-posinset','21');expect(input.closest('[role=listitem]')).toHaveAttribute('aria-setsize','40');
  });
  it.each([false,true])('VirtualList removes an edited row without stealing an external handoff (external=%s)', external => {
    const props={label:'可变列表',renderItem:(item:{id:string})=><input aria-label={item.id}/>};
    const view=(items:{id:string}[]) => <><VirtualList {...props} items={items}/><input aria-label="外部编辑"/></>;
    const {rerender}=render(view([{id:'甲'},{id:'乙'}]));act(()=>screen.getByRole('textbox',{name:'甲'}).focus());
    if(external)act(()=>screen.getByRole('textbox',{name:'外部编辑'}).focus());
    rerender(view([{id:'乙'}]));expect(external?screen.getByRole('textbox',{name:'外部编辑'}):screen.getByRole('list')).toHaveFocus();
  });
  it('VirtualList clamps a filtered scroll range and rejects nonpositive dimensions', () => {
    const props={label:'过滤列表',renderItem:(item:string)=><span>{item}</span>};
    const {rerender}=render(<VirtualList {...props} items={Array.from({length:50},(_,i)=>String(i))}/>);
    const list=screen.getByRole('list');list.scrollTop=1800;fireEvent.scroll(list);
    rerender(<VirtualList {...props} items={['甲','乙','丙']} itemHeight={0} height={NaN}/>);
    expect(list.scrollTop).toBe(0);expect(list).toHaveStyle({height:'220px'});expect(screen.getAllByRole('listitem')).toHaveLength(3);expect(screen.getAllByRole('listitem')[0]).toHaveStyle({height:'44px'});
  });
  it('Upload also guards programmatic changes while disabled', () => {
    const change=vi.fn();render(<Upload label="禁用附件" files={[]} onChange={change} disabled/>);
    fireEvent.change(screen.getByLabelText('禁用附件'),{target:{files:[new File(['demo'],'safe.txt')]}});expect(change).not.toHaveBeenCalled();
  });
  it('Collapse retains the panel owning focus when changing modes and does not resurrect hidden panels', () => {
    const props={label:'动态折叠',items:[{id:'a',title:'甲',content:'甲内容'},{id:'b',title:'乙',content:<input aria-label="乙草稿" defaultValue="草稿"/>}]};
    const {rerender}=render(<Collapse {...props}/>);const input=screen.getByRole('textbox',{name:'乙草稿'});act(()=>input.focus());
    rerender(<Collapse {...props} accordion/>);expect(input).toHaveFocus();expect(screen.getAllByRole('region')).toHaveLength(1);expect(screen.queryByText('甲内容')).not.toBeInTheDocument();
    rerender(<Collapse {...props}/>);expect(screen.getAllByRole('region')).toHaveLength(1);
  });
  it('Transfer respects flushSync acceptance followed by a host focus handoff', () => {
    function Demo(){const[target,setTarget]=useState<string[]>([]);return <><Transfer label="同步分配" source={[{id:'a',label:'甲'}]} target={target} onChange={next=>{flushSync(()=>setTarget(next));screen.getByRole('textbox',{name:'后续'}).focus();}}/><input aria-label="后续"/></>;}
    render(<Demo/>);fireEvent.click(screen.getByRole('checkbox',{name:'甲'}));fireEvent.click(screen.getByRole('button',{name:'移到已选'}));
    expect(within(screen.getByRole('list',{name:'已选'})).getByRole('checkbox',{name:'甲'})).not.toBeChecked();expect(screen.getByRole('textbox',{name:'后续'})).toHaveFocus();
  });
  it('Transfer clears checks on a later accepted value but never restores an old action focus', () => {
    const source=[{id:'a',label:'甲'},{id:'b',label:'乙'}],view=(target:string[])=><><Transfer label="延迟分配" source={source} target={target} onChange={()=>undefined}/><input aria-label="继续编辑"/></>;
    const {rerender}=render(view([]));fireEvent.click(screen.getByRole('checkbox',{name:'甲'}));fireEvent.click(screen.getByRole('button',{name:'移到已选'}));act(()=>screen.getByRole('textbox',{name:'继续编辑'}).focus());
    rerender(view(['a']));expect(screen.getByRole('checkbox',{name:'甲'})).not.toBeChecked();expect(screen.getByRole('textbox',{name:'继续编辑'})).toHaveFocus();
  });
  it('Transfer retains rejected items when only part of a move is accepted', () => {
    function Demo(){const[target,setTarget]=useState<string[]>([]);return <Transfer label="部分分配" source={[{id:'a',label:'甲'},{id:'b',label:'乙'}]} target={target} onChange={next=>setTarget(next.filter(key=>key!=='b'))}/>;}
    render(<Demo/>);fireEvent.click(screen.getByRole('checkbox',{name:'甲'}));fireEvent.click(screen.getByRole('checkbox',{name:'乙'}));fireEvent.click(screen.getByRole('button',{name:'移到已选'}));
    expect(within(screen.getByRole('list',{name:'已选'})).getByRole('checkbox',{name:'甲'})).not.toBeChecked();expect(within(screen.getByRole('list',{name:'可选'})).getByRole('checkbox',{name:'乙'})).toBeChecked();
  });
  it('ColorPicker keeps the last valid swatch and removes stale error relationships after correction', () => {
    const {rerender}=render(<ColorPicker label="色彩" value="#123456" onChange={()=>undefined}/>);
    rerender(<ColorPicker label="色彩" value="invalid" onChange={()=>undefined}/>);expect(screen.getByLabelText('色彩')).toHaveValue('#123456');
    const text=screen.getByRole('textbox',{name:'色彩色值'}),error=screen.getByRole('alert');expect(text).toHaveAttribute('aria-describedby',error.id);
    rerender(<ColorPicker label="色彩" value="#abcdef" onChange={()=>undefined}/>);expect(screen.queryByRole('alert')).not.toBeInTheDocument();expect(text).not.toHaveAttribute('aria-invalid');expect(text).not.toHaveAttribute('aria-describedby');
  });
  it('Anchor canonical target navigation keeps chapter state and accepts malformed target encoding safely', () => {
    window.history.replaceState(null,'','/#anchor::anchor-a');
    render(<GalleryShell motion="system" onMotionChange={()=>undefined}>{section=><><h1>{section}</h1>{section==='anchor'&&<><input aria-label="章节草稿" defaultValue="原文"/><Anchor label="定位" getHref={key=>`#anchor::${encodeURIComponent(key)}`} items={[{id:'anchor-a',label:'第一节'},{id:'anchor-b',label:'第二节'}]}/><section id="anchor-a" tabIndex={-1}>甲</section><section id="anchor-b" tabIndex={-1}>乙</section></>}</>}</GalleryShell>);
    fireEvent.change(screen.getByRole('textbox',{name:'章节草稿'}),{target:{value:'仍在'}});
    expect(screen.getByRole('link',{name:'第二节'})).toHaveAttribute('href','#anchor::anchor-b');
    act(()=>{window.history.replaceState(null,'','#anchor::anchor-b');window.dispatchEvent(new HashChangeEvent('hashchange'));});expect(screen.getByRole('textbox',{name:'章节草稿'})).toHaveValue('仍在');expect(document.getElementById('anchor-b')).toHaveFocus();
    act(()=>{window.history.replaceState(null,'','#anchor::%bad');window.dispatchEvent(new HashChangeEvent('hashchange'));});expect(screen.getByRole('heading',{level:1})).toHaveTextContent('anchor');
  });
});


describe('upload removal focus ownership', () => {
  it('returns lost removal focus to the native picker after acceptance', async () => {
    function Demo(){const[files,setFiles]=useState([new File(['demo'],'example.txt')]);return <Upload label="可移除文件" files={files} onChange={setFiles}/>;}
    render(<Demo/>);const button=screen.getByRole('button',{name:'移除'});act(()=>button.focus());fireEvent.click(button);
    await waitFor(()=>expect(screen.getByLabelText('可移除文件',{selector:'input'})).toHaveFocus());
  });
  it('does not restore a rejected or a host-transferred removal', async () => {
    function Demo(){const[files,setFiles]=useState([new File(['demo'],'example.txt')]);return <><Upload label="主控交接" files={files} onChange={next=>{setFiles(next);screen.getByRole('textbox',{name:'主控目标'}).focus();}}/><input aria-label="主控目标"/></>;}
    render(<Demo/>);const button=screen.getByRole('button',{name:'移除'});act(()=>button.focus());fireEvent.click(button);
    await act(async()=>{await Promise.resolve();});expect(screen.getByRole('textbox',{name:'主控目标'})).toHaveFocus();
  });
});
