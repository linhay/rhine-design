import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { CompleteTemplateExample } from '../preview/CompactTemplateGallery';
import { RemoteMultiSelect } from '../components';

it('compact density preserves activation, readonly inspection, keyboard removal and focus',()=>{
 const value=[{value:'a',label:'完整长名称'},{value:'b',label:'锁定名称',disabled:true}];
 const change=vi.fn(),activate=vi.fn(),props={label:'模型',query:'',onQueryChange:vi.fn(),options:value,value,onValueChange:change,onActivateValue:activate,tagDensity:'compact' as const};
 const {rerender}=render(<RemoteMultiSelect {...props}/>);
 fireEvent.click(screen.getByRole('button',{name:'完整长名称'}));expect(activate).toHaveBeenCalledWith(value[0]);expect(change).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'移除完整长名称'}));expect(change).toHaveBeenCalledWith([value[1]]);expect(screen.getByRole('combobox')).toHaveFocus();
 rerender(<RemoteMultiSelect {...props} readOnly/>);expect(screen.getByRole('button',{name:'移除完整长名称'})).toBeDisabled();expect(screen.getByRole('button',{name:'完整长名称'})).not.toBeDisabled();
 rerender(<RemoteMultiSelect {...props} disabled/>);screen.getAllByRole('button').filter(b=>b.textContent!=='展开已选项').forEach(b=>expect(b).toBeDisabled());
});

it('validates from blank, locates another tab, retains failure draft and writes the complete snapshot only once',async()=>{
 render(<CompleteTemplateExample/>);
 fireEvent.click(screen.getByLabelText('首次保存失败'));fireEvent.click(screen.getByRole('button',{name:'新建完整模板'}));
 const save=screen.getByRole('button',{name:'保存完整模板'}),name=screen.getByLabelText('完整模板名称');
 fireEvent.click(save);expect(name).toHaveFocus();expect(name).toHaveAttribute('aria-invalid','true');
 fireEvent.change(name,{target:{value:'   '}});fireEvent.click(save);expect(name).toHaveAttribute('aria-invalid','true');
 fireEvent.change(name,{target:{value:'常用模板'}});fireEvent.click(save);expect(name).toHaveAccessibleDescription('名称重复，请更名');
 fireEvent.change(name,{target:{value:'合成新模板'}});fireEvent.click(screen.getByRole('button',{name:'获取合成目录'}));
 await screen.findByText('目录已更新，选择与草稿保留');expect(screen.getByRole('list',{name:'模板模型已选项'}).children).toHaveLength(0);
 fireEvent.focus(screen.getByRole('combobox',{name:'模板模型'}));fireEvent.click(screen.getByRole('option',{name:'model-0'}));fireEvent.click(screen.getByRole('button',{name:'完成选择'}));
 fireEvent.click(screen.getByRole('tab',{name:'模型映射'}));fireEvent.click(screen.getByRole('button',{name:'添加规则'}));
 fireEvent.click(screen.getByRole('tab',{name:'模型白名单'}));fireEvent.click(save);
 expect(screen.getByRole('tab',{name:'模型映射'})).toHaveAttribute('aria-selected','true');expect(screen.getByRole('combobox',{name:'第1行 来源'})).toHaveFocus();
 fireEvent.change(screen.getByRole('combobox',{name:'第1行 来源'}),{target:{value:'model-0'}});fireEvent.click(save);expect(screen.getByRole('combobox',{name:'第1行 目标'})).toHaveFocus();
 fireEvent.change(screen.getByRole('combobox',{name:'第1行 目标'}),{target:{value:'model-1'}});fireEvent.click(save);
 await screen.findByText('保存失败，请重试');expect(name).toHaveValue('合成新模板');expect(screen.getByLabelText('已保存模板')).toHaveTextContent('尚未保存模板');
 fireEvent.click(save);await screen.findByText('已保存');expect(screen.getByLabelText('已保存模板')).toHaveTextContent('合成新模板 · 1 个模型 · 1 条映射');
 fireEvent.click(save);expect(screen.getByText('无需保存')).toBeVisible();expect(screen.getByLabelText('模板写入次数')).toHaveTextContent('写入 1 次');
 fireEvent.change(name,{target:{value:'再次编辑'}});expect(screen.queryByText('已保存')).toBeNull();expect(screen.getByLabelText('已保存模板')).toHaveTextContent('合成新模板');
});

it('directory failure and retry change only candidates, retaining selection, saved feedback and write count',async()=>{
 render(<CompleteTemplateExample/>);fireEvent.click(screen.getByLabelText('首次目录获取失败'));fireEvent.click(screen.getByRole('button',{name:'新建完整模板'}));
 const name=screen.getByLabelText('完整模板名称'),input=screen.getByRole('combobox',{name:'模板模型'}),save=screen.getByRole('button',{name:'保存完整模板'});
 fireEvent.change(name,{target:{value:'独立草稿'}});fireEvent.focus(input);fireEvent.click(screen.getByRole('option',{name:'model-0'}));fireEvent.click(screen.getByRole('button',{name:'完成选择'}));fireEvent.click(save);await screen.findByText('已保存');
 const fetch=screen.getByRole('button',{name:'获取合成目录'});fireEvent.click(fetch);expect(fetch).toHaveAttribute('aria-busy','true');await screen.findByText('目录获取失败，可重试；选择与草稿保留');
 expect(screen.getByText('已保存')).toBeVisible();expect(name).toHaveValue('独立草稿');
 fireEvent.click(fetch);await screen.findByText('目录已更新，选择与草稿保留');expect(screen.getByText('已保存')).toBeVisible();
 expect(screen.getByRole('list',{name:'模板模型已选项'}).children).toHaveLength(1);fireEvent.focus(input);expect(screen.getAllByRole('option')).toHaveLength(11);fireEvent.click(screen.getByRole('button',{name:'完成选择'}));fireEvent.click(save);
 expect(screen.getByText('无需保存')).toBeVisible();expect(screen.getByLabelText('模板写入次数')).toHaveTextContent('写入 1 次');
});

it('settings undo restores the saved snapshot and clears validation without closing or writing',async()=>{
 render(<CompleteTemplateExample settings/>);fireEvent.click(screen.getByRole('button',{name:'新建完整模板'}));
 const name=screen.getByLabelText('完整模板名称'),save=screen.getByRole('button',{name:'保存完整模板'}),undo=screen.getByRole('button',{name:'撤销编辑'});
 fireEvent.click(save);expect(name).toHaveAttribute('aria-invalid','true');fireEvent.click(undo);expect(name).not.toHaveAttribute('aria-invalid','true');expect(name).toHaveValue('');
 fireEvent.change(name,{target:{value:'已保存合成模板'}});fireEvent.click(save);await screen.findByText('模板已保存');
 fireEvent.change(name,{target:{value:'临时草稿'}});fireEvent.click(undo);expect(name).toHaveValue('已保存合成模板');expect(screen.queryByText('模板已保存')).toBeNull();
 expect(screen.getByRole('dialog',{name:'账号设置 · 合成主账号'})).toBeVisible();expect(screen.getByLabelText('模板写入次数')).toHaveTextContent('写入 1 次');
});
