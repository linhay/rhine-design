import { useState } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AutoComplete, Cascader, ColorPicker, Dropdown, ErrorSummary, Form, Masonry, Mentions, Rate, Slider, TimePicker, Transfer, Upload } from '../components';

describe('provided form interoperability', () => {
  it('serializes native values once under consumer names and keeps supplied focus ids', () => {
    render(<form aria-label="原生表单"><Rate id="rating" name="rating" label="评分" value={3} onChange={()=>undefined} required hint="评分说明" error="请检查评分"/><Slider id="volume" name="volume" label="音量" value={30} onChange={()=>undefined}/><TimePicker id="time" name="time" label="时间" value="09:30:05" min="08:00" max="18:00" step={1} required onChange={()=>undefined}/><ColorPicker id="color" name="color" label="颜色" value="#123456" onChange={()=>undefined}/></form>);
    const data=new FormData(screen.getByRole('form') as HTMLFormElement);
    expect(data.getAll('rating')).toEqual(['3']);expect(data.getAll('volume')).toEqual(['30']);expect(data.getAll('time')).toEqual(['09:30:05']);expect(data.getAll('color')).toEqual(['#123456']);
    expect(document.getElementById('rating')).toHaveAttribute('type','radio');expect(document.getElementById('color')).toHaveAttribute('type','text');
    expect(document.getElementById('rating')).toHaveAttribute('aria-describedby','rating-hint rating-error');
  });
  it('supports noValidate and ErrorSummary without changing the chapter hash', () => {
    const submit=vi.fn();render(<Form label="宿主校验" noValidate onSubmit={submit}><TimePicker id="time-error" label="时间" value="" onChange={()=>undefined} required error="需要时间"/><ErrorSummary errors={[{fieldId:'time-error',message:'需要时间'}]}/><button type="submit">提交</button></Form>);
    fireEvent.click(screen.getByRole('button',{name:'提交'}));expect(submit).toHaveBeenCalledOnce();expect(screen.getByRole('form')).toHaveAttribute('novalidate');
    const hash=location.hash;fireEvent.click(screen.getByRole('link',{name:'需要时间'}));expect(document.getElementById('time-error')).toHaveFocus();expect(location.hash).toBe(hash);
  });
  it('keeps time/range/radio values immutable when readonly', () => {
    const change=vi.fn();render(<><TimePicker label="只读时间" value="09:30" onChange={change} readOnly/><Slider label="只读范围" value={20} onChange={change} readOnly/><Rate label="只读评分" value={2} onChange={change} readOnly/></>);
    fireEvent.change(screen.getByLabelText('只读时间'),{target:{value:'10:00'}});fireEvent.change(screen.getByRole('slider'),{target:{value:'70'}});fireEvent.click(screen.getByRole('radio',{name:'3 分'}));expect(change).not.toHaveBeenCalled();
    expect(screen.getByRole('slider')).toHaveAttribute('aria-readonly','true');expect(screen.getByRole('radio',{name:'2 分'})).toBeChecked();expect(screen.getByRole('radio',{name:'3 分'})).not.toBeChecked();
  });
  it('uses native time constraints and excludes disabled fields but not readonly values', () => {
    render(<form aria-label="限制"><TimePicker label="只读" name="readonly" value="09:30" onChange={()=>undefined} readOnly/><TimePicker label="禁用" name="disabled" value="09:30" onChange={()=>undefined} disabled/><TimePicker label="越界" name="limited" value="07:00" min="08:00" max="18:00" step={60} onChange={()=>undefined}/></form>);
    const input=screen.getByLabelText('越界') as HTMLInputElement;expect(input.validity.rangeUnderflow).toBe(true);
    const data=new FormData(screen.getByRole('form') as HTMLFormElement);expect(data.get('readonly')).toBe('09:30');expect(data.has('disabled')).toBe(false);
  });
  it('allows a readonly color text value to submit while its native chooser cannot open', () => {
    const change=vi.fn();render(<form aria-label="只读色值"><ColorPicker id="color-read" name="color" label="色值" value="#abcdef" readOnly onChange={change} hint="只读说明"/></form>);
    expect(screen.getByLabelText('色值')).toBeDisabled();expect(screen.getByRole('textbox')).toHaveAttribute('readonly');fireEvent.change(screen.getByRole('textbox'),{target:{value:'#000000'}});expect(change).not.toHaveBeenCalled();expect(new FormData(screen.getByRole('form') as HTMLFormElement).get('color')).toBe('#abcdef');
  });
  it('forwards autocomplete field metadata and allows correction despite a field error', async () => {
    function Demo(){const[value,setValue]=useState('');return <form aria-label="补全表单"><span id="outside-hint">外部描述</span><AutoComplete id="auto" name="workspace" label="工作区" value={value} onChange={setValue} options={['研究']} required error="需要检查" hint="内部说明" aria-describedby="outside-hint"/></form>;}
    render(<Demo/>);const input=screen.getByRole('combobox');act(()=>input.focus());fireEvent.click(await screen.findByRole('option',{name:'研究'}));expect(input).toHaveValue('研究');expect(input).toHaveAttribute('id','auto');expect(input).toHaveAttribute('required');expect(input.getAttribute('aria-describedby')).toContain('outside-hint');expect(new FormData(screen.getByRole('form') as HTMLFormElement).get('workspace')).toBe('研究');
  });
  it('keeps candidate read failures separate from field validation and emits retry only', async () => {
    const retry=vi.fn(),change=vi.fn();render(<AutoComplete label="读取候选" value="" onChange={change} options={['研究']} optionsError="候选读取失败" onRetry={retry}/>);act(()=>screen.getByRole('combobox').focus());expect(screen.queryByRole('option')).not.toBeInTheDocument();fireEvent.click(await screen.findByRole('button',{name:'重试'}));expect(retry).toHaveBeenCalledOnce();expect(change).not.toHaveBeenCalled();
  });
  it('does not reopen readonly/disabled autocomplete suggestions', () => {
    const props={label:'不可改补全',value:'研究',onChange:vi.fn(),options:['研究']};const{rerender}=render(<AutoComplete {...props} readOnly/>);fireEvent.focus(screen.getByRole('combobox'));fireEvent.change(screen.getByRole('combobox'),{target:{value:'其他'}});expect(props.onChange).not.toHaveBeenCalled();expect(screen.queryByRole('listbox')).not.toBeInTheDocument();rerender(<AutoComplete {...props} disabled/>);expect(screen.getByRole('combobox')).toBeDisabled();
  });
  it('serializes mention text and never edits readonly mention content', () => {
    const change=vi.fn();render(<form aria-label="提及表单"><Mentions id="mention" name="notes" label="备注" value="请 @" options={['林可']} onChange={change} readOnly required hint="正文说明"/></form>);const input=screen.getByRole('combobox');act(()=>input.focus());fireEvent.change(input,{target:{value:'修改'}});expect(change).not.toHaveBeenCalled();expect(screen.queryByRole('listbox')).not.toBeInTheDocument();expect(new FormData(screen.getByRole('form') as HTMLFormElement).get('notes')).toBe('请 @');
  });
  it('shows only the upload hint supplied by the host', () => {
    const props = { label: '附件', files: [], onChange: () => undefined };
    const { rerender } = render(<Upload {...props} hint="随表单保存。" />);
    const input = screen.getByLabelText('附件');
    expect(input).toHaveAccessibleDescription('随表单保存。');
    expect(screen.queryByText('只记录本地文件名，不会上传。')).not.toBeInTheDocument();
    rerender(<Upload {...props} />);
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(screen.queryByText('随表单保存。')).not.toBeInTheDocument();
  });
  it('keeps controlled files in a scoped platform formdata listener and detaches it on unmount', async () => {
    const file=new File(['safe'],'safe.txt',{type:'text/plain'});const form=document.createElement('form');form.id='file-owner';document.body.append(form);
    const{unmount}=render(<Upload id="file-control" name="attachments" form="file-owner" label="文件" files={[file]} onChange={()=>undefined} readOnly required accept=".txt" multiple={false}/>);
    const dispatch=()=>{const data=new FormData(),event=new Event('formdata');Object.defineProperty(event,'formData',{value:data});form.dispatchEvent(event);return data;};
    expect(screen.getByLabelText('文件')).toHaveAttribute('accept','.txt');expect(screen.getByLabelText('文件')).not.toHaveAttribute('multiple');expect(screen.getByLabelText('文件')).toBeDisabled();const stored=dispatch().get('attachments') as File;expect(stored).toBeInstanceOf(File);expect(stored.name).toBe('safe.txt');expect(stored.type).toBe('text/plain');expect(stored.size).toBe(file.size);const content=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsText(stored);});expect(content).toBe('safe');unmount();expect(dispatch().has('attachments')).toBe(false);form.remove();
  });
  it('serializes each file once to its current external form after same-id replacement', () => {
    const files = [new File(['safe'], 'safe.txt')];
    const formId = 'replaceable-file-form';
    const view = (generation: number) => <><form id={formId} key={generation} aria-label="当前附件表单"/><form aria-label="其他表单"/><Upload label="附件" name="files" form={formId} files={files} onChange={() => {}} required /></>;
    const { rerender, unmount } = render(view(0));
    const old = screen.getByRole('form', { name: '当前附件表单' });
    const submit = (target: HTMLElement) => {
      const event = new Event('formdata'), data = new FormData();
      Object.defineProperty(event, 'formData', { value: data });
      target.dispatchEvent(event);
      return data.getAll('files');
    };
    expect(submit(old)).toEqual(files);
    rerender(view(1));
    const current = screen.getByRole('form', { name: '当前附件表单' });
    expect(current).not.toBe(old);
    expect((screen.getByLabelText('附件') as HTMLInputElement).form).toBe(current);
    expect(submit(current)).toEqual(files);
    expect(submit(old)).toEqual([]);
    expect(submit(screen.getByRole('form', { name: '其他表单' }))).toEqual([]);
    unmount();
    document.body.append(current);
    expect(submit(current)).toEqual([]);
    current.remove();
  });
  it('names removal by file and only removes the named file', () => {
    const first = new File(['one'], '设计稿.txt'), second = new File(['two'], '会议纪要.txt');
    const change = vi.fn();
    render(<Upload label="附件" files={[first, second]} onChange={change} />);
    expect(screen.getByRole('button', {name: '移除 设计稿.txt'})).toHaveTextContent('移除');
    fireEvent.click(screen.getByRole('button', {name: '移除 会议纪要.txt'}));
    expect(change).toHaveBeenCalledExactlyOnceWith([first]);
  });
  it('does not serialize disabled controlled files and bases required on the controlled list', () => {
    const file=new File(['safe'],'safe.txt');const props={label:'必选文件',name:'files',files:[file],onChange:()=>undefined,required:true};const{rerender}=render(<form aria-label="文件表单"><Upload {...props} disabled/></form>);
    expect(screen.getByLabelText('必选文件')).not.toHaveAttribute('required');const owner=screen.getByRole('form'),data=new FormData(),event=new Event('formdata');Object.defineProperty(event,'formData',{value:data});owner.dispatchEvent(event);expect(data.has('files')).toBe(false);rerender(<form aria-label="文件表单"><Upload {...props} files={[]}/></form>);expect(screen.getByLabelText('必选文件')).toHaveAttribute('required');
  });
});

describe('controlled data feedback and semantic examples', () => {
  it('does not select an unloaded branch and emits a scoped expand path', async () => {
    const expand=vi.fn(),choose=vi.fn();render(<Cascader label="异步路径" options={[{value:'root',label:'研究',isLeaf:false}]} value={[]} onChange={choose} onExpand={expand}/>);fireEvent.click(screen.getByRole('button',{name:'异步路径：未选择'}));fireEvent.click(await screen.findByRole('option',{name:'研究'}));expect(choose).not.toHaveBeenCalled();expect(expand).toHaveBeenCalledWith(['root']);expect(screen.getByText('尚未提供下级选项')).toBeInTheDocument();
  });
  it('renders branch loading/error/retry and returns to a valid path after options disappear', async () => {
    const retry=vi.fn(),choose=vi.fn();const props={label:'分支读取',value:[],onChange:choose,onRetry:retry};const{rerender}=render(<Cascader {...props} options={[{value:'r',label:'研究',isLeaf:false,loading:true}]}/>);fireEvent.click(screen.getByRole('button',{name:'分支读取：未选择'}));fireEvent.click(await screen.findByRole('option',{name:'研究'}));expect(screen.getByText('正在读取…')).toBeInTheDocument();
    rerender(<Cascader {...props} options={[{value:'r',label:'研究',isLeaf:false,loadError:'下级失败'}]}/>);fireEvent.click(await screen.findByRole('button',{name:'重试读取'}));expect(retry).toHaveBeenCalledWith(['r']);
    rerender(<Cascader {...props} options={[{value:'other',label:'新路径'}]}/>);expect(await screen.findByRole('option',{name:'新路径'})).toBeEnabled();expect(screen.queryByRole('button',{name:'返回上一级'})).not.toBeInTheDocument();expect(choose).not.toHaveBeenCalled();
  });
  it('serializes a path without clearing invalidated host values and allows correcting field errors', async () => {
    const props={id:'path',name:'path',label:'路径',value:['a','b'],onChange:vi.fn(),options:[{value:'a',label:'甲',children:[{value:'b',label:'乙'}]}],error:'业务校验失败'};const{rerender}=render(<form aria-label="路径表单"><Cascader {...props}/></form>);expect(new FormData(screen.getByRole('form') as HTMLFormElement).getAll('path')).toEqual(['a','b']);expect(document.getElementById('path')).toHaveAttribute('aria-describedby','path-error');
    rerender(<form aria-label="路径表单"><Cascader {...props} options={[]}/></form>);expect(screen.getByText('选中路径暂不可用，原值仍由宿主持有。')).toBeInTheDocument();expect(new FormData(screen.getByRole('form') as HTMLFormElement).getAll('path')).toEqual(['a','b']);
  });
  it('serializes selected transfer ids but never its temporary checkboxes', () => {
    render(<form aria-label="穿梭表单"><Transfer id="members" name="members" label="成员" source={[{id:'a',label:'甲'},{id:'b',label:'乙'}]} target={['b','unknown']} onChange={()=>undefined} hint="分配说明" error="需要检查"/></form>);fireEvent.click(screen.getByRole('checkbox',{name:'甲'}));expect(new FormData(screen.getByRole('form') as HTMLFormElement).getAll('members')).toEqual(['b','unknown']);expect(screen.getByText(/有 1 项已选值暂未提供详情/)).toBeInTheDocument();
  });
  it('preserves transfer checks through transient empty loading data and emits retry without a move', () => {
    const move=vi.fn(),retry=vi.fn(),props={label:'数据分配',source:[{id:'a',label:'甲'}],target:[],onChange:move};const{rerender}=render(<Transfer {...props}/>);fireEvent.click(screen.getByRole('checkbox',{name:'甲'}));
    rerender(<Transfer {...props} source={[]} loading/>);expect(screen.getByText('正在读取…')).toBeInTheDocument();rerender(<Transfer {...props} loadError="读取失败" onRetry={retry}/>);expect(screen.getByRole('checkbox',{name:'甲'})).toBeChecked();fireEvent.click(screen.getByRole('button',{name:'重试读取'}));expect(retry).toHaveBeenCalledOnce();expect(move).not.toHaveBeenCalled();rerender(<Transfer {...props}/>);expect(screen.getByRole('checkbox',{name:'甲'})).toBeChecked();
  });
  it('readonly transfer permits inspection but not selection or movement', () => {
    const change=vi.fn();render(<Transfer label="只读成员" name="members" source={[{id:'a',label:'甲'}]} target={[]} onChange={change} readOnly/>);const checkbox=screen.getByRole('checkbox',{name:'甲'});fireEvent.click(checkbox);fireEvent.keyDown(checkbox,{key:'ArrowRight'});fireEvent.click(screen.getByRole('button',{name:'移到已选'}));expect(checkbox).not.toBeChecked();expect(change).not.toHaveBeenCalled();
  });
  it('a disabled convenience dropdown closes without selecting an option', async () => {
    const choose=vi.fn(),props={label:'命令',items:[{id:'a',label:'执行'}],onSelect:choose};const{rerender}=render(<Dropdown {...props}/>);fireEvent.keyDown(screen.getByRole('button',{name:'命令'}),{key:'ArrowDown'});await screen.findByRole('menuitem');rerender(<Dropdown {...props} disabled/>);await waitFor(()=>expect(screen.queryByRole('menuitem')).not.toBeInTheDocument());expect(screen.getByRole('button',{name:'命令'})).toBeDisabled();expect(choose).not.toHaveBeenCalled();
  });
  it('Masonry gives each direct child a listitem without changing its content', () => {
    render(<Masonry label="卡片排列" columns={2}><article>甲</article><article>乙</article></Masonry>);const list=screen.getByRole('list',{name:'卡片排列'});expect(within(list).getAllByRole('listitem')).toHaveLength(2);expect(within(list).getAllByRole('article')).toHaveLength(2);
  });
});


describe('native fieldset ownership',()=>{
  it('closes already portaled autocomplete options when the native fieldset becomes disabled',async()=>{
    const change=vi.fn(),view=(disabled:boolean)=><fieldset disabled={disabled}><legend>宿主禁用</legend><AutoComplete label="继承补全" value="" options={['研究']} onChange={change}/></fieldset>;
    const{rerender}=render(view(false));const input=screen.getByRole('combobox');act(()=>input.focus());await screen.findByRole('option',{name:'研究'});rerender(view(true));await waitFor(()=>expect(screen.queryByRole('option')).not.toBeInTheDocument());expect(change).not.toHaveBeenCalled();
  });
  it('honors the native first-legend exception rather than guessing disabled from ancestors',async()=>{
    render(<fieldset disabled><legend><AutoComplete label="首legend" value="" options={['研究']} onChange={()=>undefined}/></legend></fieldset>);const input=screen.getByRole('combobox');act(()=>input.focus());expect(await screen.findByRole('option',{name:'研究'})).toBeInTheDocument();
  });
});
