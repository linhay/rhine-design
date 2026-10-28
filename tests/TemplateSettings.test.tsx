import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { TemplateSettingsGallery } from '../preview/TemplateSettingsGallery';
import { ThemeProvider } from '../components/theme';
afterEach(()=>vi.useRealTimers());
const setup=()=>{render(<ThemeProvider><TemplateSettingsGallery /></ThemeProvider>);fireEvent.click(screen.getByRole('button',{name:'打开模板工作区'}));return screen.getByRole('dialog');};
const nav=(name:string)=>fireEvent.click(screen.getByRole('link',{name}));
it('does not apply selection or preview; shows per-target change/unchanged/skipped and preserves mixed values',()=>{
 const d=setup();fireEvent.change(within(d).getByLabelText('已保存模板'),{target:{value:'basic'}});
 expect(within(d).queryByRole('combobox',{name:'第1行 来源'})).toBeNull();
 for(const name of ['合成对象甲','合成对象乙','合成对象丙']) fireEvent.click(within(d).getByRole('checkbox',{name}));
 const status=screen.getByLabelText('已应用目标状态');const before=status.textContent;
 fireEvent.click(within(d).getByRole('button',{name:'预览'}));
 expect(within(d).getByText('规则 0 → 1 条')).toBeVisible();expect(within(d).getByText('不变',{exact:true})).toBeVisible();expect(within(d).getByText('跳过：此对象不可编辑')).toBeVisible();expect(status.textContent).toBe(before);
 fireEvent.click(within(d).getByRole('button',{name:'确认'}));
 expect(status).toHaveTextContent('合成对象甲：开启，1条规则');expect(status).toHaveTextContent('合成对象乙：关闭，1条规则');expect(status).toHaveTextContent('合成对象丙：开启，0条规则');
});
it('retains drafts across sections, separates saving, and invalidates an updated selected template version',()=>{
 vi.useFakeTimers();const d=setup();const status=screen.getByLabelText('已应用目标状态'),before=status.textContent;
 fireEvent.change(within(d).getByLabelText('已保存模板'),{target:{value:'basic'}});nav('模板编辑');
 fireEvent.change(within(d).getByLabelText('模板名称'),{target:{value:'已改名模板'}});fireEvent.change(within(d).getByLabelText('第1行 目标'),{target:{value:'option-3'}});
 nav('其他设置');nav('模板编辑');expect(within(d).getByLabelText('第1行 目标')).toHaveValue('option-3');
 fireEvent.click(within(d).getByRole('button',{name:'保存'}));expect(within(d).getByLabelText('第1行 来源')).toBeDisabled();act(()=>vi.advanceTimersByTime(400));
 expect(status.textContent).toBe(before);expect(within(d).getByRole('status')).toHaveTextContent('原选择已失效');nav('应用配置');expect(within(d).getByLabelText('已保存模板')).toHaveValue('');expect(within(d).getByRole('option',{name:'已改名模板 · v2'})).toBeInTheDocument();
});
it('supports empty-template creation, duplicate-name rejection, failure and explicit retry',()=>{
 vi.useFakeTimers();render(<ThemeProvider><TemplateSettingsGallery /></ThemeProvider>);fireEvent.click(screen.getByLabelText('模拟模板保存失败'));fireEvent.click(screen.getByRole('button',{name:'打开模板工作区'}));const d=screen.getByRole('dialog');nav('模板编辑');fireEvent.click(within(d).getByRole('button',{name:'新建模板'}));
 fireEvent.change(within(d).getByLabelText('模板名称'),{target:{value:'基础模板'}});fireEvent.click(within(d).getByRole('button',{name:'保存'}));expect(within(d).getByRole('alert')).toHaveTextContent('名称重复');
 fireEvent.change(within(d).getByLabelText('模板名称'),{target:{value:'新空模板'}});fireEvent.click(within(d).getByRole('button',{name:'保存'}));act(()=>vi.advanceTimersByTime(400));expect(within(d).getByRole('alert')).toHaveTextContent('保存失败');expect(within(d).getByLabelText('模板名称')).toHaveValue('新空模板');
 fireEvent.click(within(d).getByRole('button',{name:'关闭'}));fireEvent.click(screen.getByLabelText('模拟模板保存失败'));fireEvent.click(screen.getByRole('button',{name:'打开模板工作区'}));fireEvent.click(screen.getByRole('button',{name:'保存'}));act(()=>vi.advanceTimersByTime(400));nav('应用配置');expect(screen.getByRole('option',{name:'新空模板 · v1'})).toBeInTheDocument();
});
it('locks external draft fixtures while a save is pending across close and reopen',()=>{
 vi.useFakeTimers();const d=setup();nav('模板编辑');fireEvent.change(within(d).getByLabelText('模板名称'),{target:{value:'提交快照'}});fireEvent.click(within(d).getByRole('button',{name:'保存'}));fireEvent.click(within(d).getByRole('button',{name:'关闭'}));
 for(const name of ['载入八行草稿','载入重复来源与空目标']) {const button=screen.getByRole('button',{name});expect(button).toBeDisabled();fireEvent.click(button);}
 fireEvent.click(screen.getByRole('button',{name:'打开模板工作区'}));expect(screen.getByLabelText('模板名称')).toBeDisabled();expect(screen.getAllByRole('combobox',{name:/第\d行 来源/})).toHaveLength(1);
 act(()=>vi.advanceTimersByTime(400));expect(screen.getByLabelText('模板名称')).toHaveValue('提交快照');fireEvent.change(screen.getByLabelText('模板名称'),{target:{value:'保存完成后的新草稿'}});act(()=>vi.advanceTimersByTime(1000));expect(screen.getByLabelText('模板名称')).toHaveValue('保存完成后的新草稿');
});
it('shows actual equal-count mapping replacement before confirmation',()=>{
 vi.useFakeTimers();const d=setup();nav('模板编辑');fireEvent.change(within(d).getByLabelText('第1行 目标'),{target:{value:'option-3'}});fireEvent.click(within(d).getByRole('button',{name:'保存'}));act(()=>vi.advanceTimersByTime(400));nav('应用配置');fireEvent.change(within(d).getByLabelText('已保存模板'),{target:{value:'basic'}});fireEvent.click(within(d).getByRole('checkbox',{name:'合成对象乙'}));fireEvent.click(within(d).getByRole('button',{name:'预览'}));expect(within(d).getByText('替换 合成选项 1：合成选项 2 → 合成选项 3')).toBeVisible();
});
