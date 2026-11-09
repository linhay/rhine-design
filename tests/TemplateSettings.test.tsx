import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { TemplateSettingsGallery } from '../preview/TemplateSettingsGallery';
import { ThemeProvider } from '../components/theme';
afterEach(()=>vi.useRealTimers());
const setup=()=>{render(<ThemeProvider><TemplateSettingsGallery /></ThemeProvider>);fireEvent.click(screen.getByRole('button',{name:'打开模板工作区'}));return screen.getByRole('dialog');};
const selectTargets=(names:string[])=>{const input=screen.getByRole('combobox',{name:'目标对象'});for(const name of names){fireEvent.change(input,{target:{value:name}});fireEvent.click(screen.getByRole('option',{name}));}fireEvent.click(screen.getByRole('button',{name:'完成选择'}));};
const closeWorkspace=(d:HTMLElement)=>{fireEvent.click(within(d).getByRole('button',{name:'关闭对话框'}));const keep=screen.queryByRole('button',{name:'保留草稿并关闭'});if(keep)fireEvent.click(keep);};
const nav=(name:string)=>fireEvent.click(screen.getByRole('link',{name}));
it('does not apply selection or preview; shows per-target change/unchanged/skipped and preserves mixed values',()=>{
 const d=setup();fireEvent.change(within(d).getByLabelText('已保存模板'),{target:{value:'basic'}});
 expect(within(d).queryByRole('combobox',{name:'第1行 来源'})).toBeNull();
 selectTargets(['合成对象甲','合成对象乙','合成对象丙']);
 const status=screen.getByLabelText('已应用目标状态');const before=status.textContent;
 fireEvent.click(within(d).getByRole('button',{name:'预览'}));
 expect(within(d).getByText('规则 0 → 1 条')).toBeVisible();expect(within(d).getByText('不变',{exact:true})).toBeVisible();expect(within(d).getByText('跳过：此对象不可编辑')).toBeVisible();expect(status.textContent).toBe(before);
 fireEvent.click(within(d).getByRole('button',{name:'确认修改'}));
 expect(status).toHaveTextContent('合成对象甲：开启，1条规则');expect(status).toHaveTextContent('合成对象乙：关闭，1条规则');expect(status).toHaveTextContent('合成对象丙：开启，0条规则');
});
it('retains drafts across sections, separates saving, and invalidates an updated selected template version',()=>{
 vi.useFakeTimers();const d=setup();const status=screen.getByLabelText('已应用目标状态'),before=status.textContent;
 fireEvent.change(within(d).getByLabelText('已保存模板'),{target:{value:'basic'}});nav('模板编辑');
 fireEvent.change(within(d).getByLabelText('模板名称'),{target:{value:'已改名模板'}});fireEvent.change(within(d).getByLabelText('第1行 目标'),{target:{value:'option-3'}});
 nav('其他设置');nav('模板编辑');expect(within(d).getByLabelText('第1行 目标')).toHaveValue('option-3');
 fireEvent.click(within(d).getByRole('button',{name:'保存'}));expect(within(d).getByLabelText('第1行 来源')).toBeDisabled();act(()=>vi.advanceTimersByTime(400));
 expect(status.textContent).toBe(before);expect(within(d).getByText('模板已更新，原选择已失效，请重新选择版本')).toBeVisible();nav('应用配置');expect(within(d).getByLabelText('已保存模板')).toHaveValue('');expect(within(d).getByRole('option',{name:'已改名模板 · v2'})).toBeInTheDocument();
});
it('supports empty-template creation, duplicate-name rejection, failure and explicit retry',()=>{
 vi.useFakeTimers();render(<ThemeProvider><TemplateSettingsGallery /></ThemeProvider>);fireEvent.click(screen.getByLabelText('模拟模板保存失败'));fireEvent.click(screen.getByRole('button',{name:'打开模板工作区'}));const d=screen.getByRole('dialog');nav('模板编辑');fireEvent.click(within(d).getByRole('button',{name:'新建模板'}));
 fireEvent.change(within(d).getByLabelText('模板名称'),{target:{value:'基础模板'}});fireEvent.click(within(d).getByRole('button',{name:'保存'}));expect(within(d).getByRole('alert')).toHaveTextContent('名称重复');
 fireEvent.change(within(d).getByLabelText('模板名称'),{target:{value:'新空模板'}});fireEvent.click(within(d).getByRole('button',{name:'保存'}));act(()=>vi.advanceTimersByTime(400));expect(within(d).getByRole('alert')).toHaveTextContent('保存失败');expect(within(d).getByLabelText('模板名称')).toHaveValue('新空模板');
 closeWorkspace(d);fireEvent.click(screen.getByLabelText('模拟模板保存失败'));fireEvent.click(screen.getByRole('button',{name:'打开模板工作区'}));fireEvent.click(screen.getByRole('button',{name:'保存'}));act(()=>vi.advanceTimersByTime(400));nav('应用配置');expect(screen.getByRole('option',{name:'新空模板 · v1'})).toBeInTheDocument();
});
it('locks external draft fixtures while a save is pending across close and reopen',()=>{
 vi.useFakeTimers();const d=setup();nav('模板编辑');fireEvent.change(within(d).getByLabelText('模板名称'),{target:{value:'提交快照'}});fireEvent.click(within(d).getByRole('button',{name:'保存'}));closeWorkspace(d);
 for(const name of ['载入八行草稿','载入重复来源与空目标']) {const button=screen.getByRole('button',{name});expect(button).toBeDisabled();fireEvent.click(button);}
 fireEvent.click(screen.getByRole('button',{name:'打开模板工作区'}));expect(screen.getByLabelText('模板名称')).toBeDisabled();expect(screen.getAllByRole('combobox',{name:/第\d行 来源/})).toHaveLength(1);
 act(()=>vi.advanceTimersByTime(400));expect(screen.getByLabelText('模板名称')).toHaveValue('提交快照');fireEvent.change(screen.getByLabelText('模板名称'),{target:{value:'保存完成后的新草稿'}});act(()=>vi.advanceTimersByTime(1000));expect(screen.getByLabelText('模板名称')).toHaveValue('保存完成后的新草稿');
});
it('shows actual equal-count mapping replacement before confirmation',()=>{
 vi.useFakeTimers();const d=setup();nav('模板编辑');fireEvent.change(within(d).getByLabelText('第1行 目标'),{target:{value:'option-3'}});fireEvent.click(within(d).getByRole('button',{name:'保存'}));act(()=>vi.advanceTimersByTime(400));nav('应用配置');fireEvent.change(within(d).getByLabelText('已保存模板'),{target:{value:'basic'}});selectTargets(['合成对象乙']);fireEvent.click(within(d).getByRole('button',{name:'预览'}));expect(within(d).getByText('替换 合成选项 1：合成选项 2 → 合成选项 3')).toBeVisible();
});

it('uses one switch with a mixed hint and stages changes until explicit confirmation',()=>{
 const d=setup();selectTargets(['合成对象甲','合成对象乙']);nav('其他设置');
 const toggle=within(d).getByRole('switch',{name:'启用调度'}),status=screen.getByLabelText('已应用目标状态'),before=status.textContent;
 expect(toggle).not.toBeChecked();expect(toggle).toHaveAccessibleDescription('部分对象已开启');expect(within(d).getByRole('button',{name:'预览'})).toBeDisabled();
 fireEvent.click(toggle);expect(toggle).toBeChecked();expect(status.textContent).toBe(before);nav('模板编辑');nav('其他设置');expect(screen.getByRole('switch')).toBeChecked();
 fireEvent.click(within(d).getByRole('button',{name:'预览'}));expect(within(d).getByText('关闭 → 开启')).toBeVisible();expect(screen.getByRole('combobox',{name:'目标对象'})).toBeDisabled();nav('其他设置');expect(within(d).getByRole('button',{name:'确认修改'})).toBeVisible();
 fireEvent.click(within(d).getByRole('button',{name:'返回编辑'}));expect(screen.getByRole('combobox',{name:'目标对象'})).not.toBeDisabled();nav('其他设置');expect(screen.getByRole('switch')).toBeChecked();
 fireEvent.click(within(d).getByRole('button',{name:'预览'}));fireEvent.click(within(d).getByRole('button',{name:'确认修改'}));expect(status).toHaveTextContent('合成对象乙：开启');
 nav('其他设置');expect(screen.getByRole('switch')).toBeChecked();fireEvent.click(screen.getByRole('switch'));fireEvent.click(within(d).getByRole('button',{name:'预览'}));fireEvent.click(within(d).getByRole('button',{name:'确认修改'}));expect(status).toHaveTextContent('合成对象甲：关闭');expect(status).toHaveTextContent('合成对象乙：关闭');
});
it('keeps the batch object bar with one selected target across functions and cancellation',()=>{
 const d=setup();const bar=within(d).getByRole('complementary',{name:'批量对象栏'});selectTargets(['合成对象乙']);nav('模板编辑');fireEvent.change(screen.getByLabelText('模板名称'),{target:{value:'保留草稿'}});nav('其他设置');expect(bar).toBeInTheDocument();expect(within(bar).getByText('合成对象乙')).toBeVisible();expect(screen.getByRole('switch')).not.toBeChecked();
 fireEvent.click(screen.getByRole('switch'));fireEvent.click(within(d).getByRole('button',{name:'撤销'}));expect(within(bar).getByText('合成对象乙')).toBeVisible();expect(screen.getByRole('switch')).not.toBeChecked();nav('模板编辑');expect(screen.getByLabelText('模板名称')).toHaveValue('保留草稿');
});
it('binds the single-object dialog once without object search or clearing and restores its own opener',async()=>{
 render(<ThemeProvider><TemplateSettingsGallery /></ThemeProvider>);const trigger=screen.getByRole('button',{name:'设置合成对象甲'});fireEvent.click(trigger);const d=screen.getByRole('dialog');expect(d).toHaveAccessibleName('模板配置 · 合成对象甲');expect(within(d).queryByRole('complementary')).toBeNull();expect(within(d).queryByRole('combobox',{name:'目标对象'})).toBeNull();expect(within(d).queryByRole('button',{name:'清空选择'})).toBeNull();
 nav('其他设置');expect(screen.getByRole('switch')).toBeChecked();fireEvent.click(screen.getByRole('switch'));fireEvent.click(within(d).getByRole('button',{name:'预览'}));expect(within(d).queryByText('合成对象甲',{exact:true})).toBeNull();expect(within(d).queryByText('合成对象乙')).toBeNull();fireEvent.click(within(d).getByRole('button',{name:'确认修改'}));expect(screen.getByLabelText('已应用目标状态')).toHaveTextContent('合成对象甲：关闭');closeWorkspace(d);await waitFor(()=>expect(trigger).toHaveFocus());
});
it('has a single empty-state action, no empty first-template toolbar, and locks existing-template switching only while dirty',()=>{
 render(<ThemeProvider><TemplateSettingsGallery /></ThemeProvider>);fireEvent.click(screen.getByRole('button',{name:'载入无模板'}));fireEvent.click(screen.getByRole('button',{name:'设置合成对象甲'}));const d=screen.getByRole('dialog');
 expect(within(d).queryByLabelText('已保存模板')).toBeNull();expect(within(d).getByText('暂无模板')).toBeVisible();fireEvent.click(within(d).getByRole('button',{name:'前往编辑'}));fireEvent.click(within(d).getByRole('button',{name:'新建'}));
 expect(within(d).queryByLabelText('编辑模板')).toBeNull();expect(within(d).queryByText('保存或撤销后可切换模板')).toBeNull();fireEvent.change(within(d).getByLabelText('模板名称'),{target:{value:'首次草稿'}});expect(within(d).getByLabelText('模板名称')).toHaveValue('首次草稿');
});
it('uses actual differences for pending application and avoids repeated single-object confirmation/success identity',()=>{
 const d=setup();selectTargets(['合成对象乙']);fireEvent.change(within(d).getByLabelText('已保存模板'),{target:{value:'basic'}});expect(within(d).queryByText('有未确认修改')).toBeNull();
 nav('模板编辑');fireEvent.change(within(d).getByLabelText('模板名称'),{target:{value:'修改'}});expect(within(d).getByLabelText('编辑模板')).toBeDisabled();expect(within(d).getByRole('button',{name:'新建模板'})).toBeDisabled();expect(within(d).getByText('保存或撤销后可切换模板')).toBeVisible();fireEvent.click(within(d).getByRole('button',{name:'撤销'}));expect(within(d).getByLabelText('编辑模板')).not.toBeDisabled();
});
it('retains batch receipts and retries only failed objects',()=>{
 render(<ThemeProvider><TemplateSettingsGallery /></ThemeProvider>);fireEvent.click(screen.getByLabelText('模拟批量部分失败一次'));fireEvent.click(screen.getByRole('button',{name:'打开模板工作区'}));const d=screen.getByRole('dialog');selectTargets(['合成对象甲','合成对象乙','合成对象丙']);nav('其他设置');fireEvent.click(screen.getByRole('switch'));fireEvent.click(within(d).getByRole('button',{name:'预览'}));fireEvent.click(within(d).getByRole('button',{name:'确认修改'}));
 expect(within(d).getByRole('list',{name:'逐对象回执'})).toHaveTextContent('合成对象乙：修改失败');expect(screen.getByLabelText('已应用目标状态')).toHaveTextContent('合成对象乙：关闭');fireEvent.click(within(d).getByRole('button',{name:'重试失败项'}));expect(screen.getByLabelText('已应用目标状态')).toHaveTextContent('合成对象乙：开启');expect(within(d).queryByRole('button',{name:'重试失败项'})).toBeNull();expect(within(d).getByRole('list',{name:'逐对象回执'})).toHaveTextContent('合成对象甲：不变');expect(within(d).getByRole('list',{name:'逐对象回执'})).toHaveTextContent('合成对象丙：跳过');
});
it('guards real changes on close, preserves application drafts by context, and discards application without clearing template draft',()=>{
 render(<ThemeProvider><TemplateSettingsGallery /></ThemeProvider>);fireEvent.click(screen.getByRole('button',{name:'设置合成对象甲'}));let d=screen.getByRole('dialog');
 fireEvent.click(within(d).getByRole('button',{name:'关闭对话框'}));expect(screen.queryByRole('dialog',{name:'保留未完成修改？'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'设置合成对象甲'}));d=screen.getByRole('dialog');nav('模板编辑');fireEvent.change(screen.getByLabelText('模板名称'),{target:{value:'独立模板草稿'}});nav('其他设置');fireEvent.click(screen.getByRole('switch'));
 fireEvent.click(within(d).getByRole('button',{name:'关闭对话框'}));expect(screen.getByRole('dialog',{name:'保留未完成修改？'})).toBeVisible();fireEvent.click(screen.getByRole('button',{name:'继续编辑'}));expect(screen.getByRole('switch')).not.toBeChecked();
 closeWorkspace(d);fireEvent.click(screen.getByRole('button',{name:'打开模板工作区'}));closeWorkspace(screen.getByRole('dialog'));fireEvent.click(screen.getByRole('button',{name:'设置合成对象甲'}));d=screen.getByRole('dialog');nav('其他设置');expect(screen.getByRole('switch')).not.toBeChecked();
 fireEvent.click(within(d).getByRole('button',{name:'关闭对话框'}));fireEvent.click(screen.getByRole('button',{name:'放弃应用修改并关闭'}));fireEvent.click(screen.getByRole('button',{name:'设置合成对象甲'}));nav('其他设置');expect(screen.getByRole('switch')).toBeChecked();nav('模板编辑');expect(screen.getByLabelText('模板名称')).toHaveValue('独立模板草稿');
});
