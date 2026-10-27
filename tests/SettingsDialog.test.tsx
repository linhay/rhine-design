import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { SettingsDialogGallery } from '../preview/SettingsDialogGallery';
import { ThemeProvider } from '../components/theme';
import { Button, Dialog, Drawer, Tooltip } from '../components';

it('keeps host state and URL while changing settings sections and explicitly saving', async () => {
  render(<ThemeProvider><SettingsDialogGallery /></ThemeProvider>);
  const url = location.href;
  fireEvent.change(screen.getByRole('textbox', {name:'宿主查询'}), {target:{value:'已有查询'}});
  fireEvent.click(screen.getByRole('button', {name:'打开设置'}));
  fireEvent.change(screen.getByRole('textbox', {name:'工作区名称'}), {target:{value:'修改后的名称'}});
  fireEvent.click(screen.getByRole('link', {name:'用户管理与权限'}));
  fireEvent.click(screen.getByRole('link', {name:'账号'}));
  expect(screen.getByRole('textbox', {name:'工作区名称'})).toHaveValue('修改后的名称');
  expect(location.href).toBe(url);
  fireEvent.click(screen.getByRole('button', {name:'保存当前工作区设置'}));
  await screen.findByText('已保存演示草稿');
  expect(screen.getByRole('dialog', {name:'设置'})).toBeVisible();
  fireEvent.click(screen.getByRole('button', {name:'关闭对话框'}));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getByRole('textbox', {name:'宿主查询'})).toHaveValue('已有查询');
  fireEvent.click(screen.getByRole('button', {name:'打开设置'}));
  expect(screen.getByRole('textbox', {name:'工作区名称'})).toHaveValue('修改后的名称');
  fireEvent.change(screen.getByRole('textbox', {name:'工作区名称'}), {target:{value:'丢弃'}});
  fireEvent.click(screen.getByRole('button', {name:'撤销全部未保存的修改'}));
  expect(screen.getByRole('textbox', {name:'工作区名称'})).toHaveValue('修改后的名称');
});

it('closes only the focused nested dialog on an immediate Escape', async () => {
  render(<ThemeProvider><SettingsDialogGallery /></ThemeProvider>);
  fireEvent.click(screen.getByRole('button', {name:'打开设置'}));
  fireEvent.click(screen.getByRole('link', {name:'用户管理与权限'}));
  fireEvent.click(screen.getByRole('button', {name:'编辑成员 12'}));
  const input = screen.getByRole('textbox', {name:'成员备注'});
  input.focus(); fireEvent.keyDown(input, {key:'Escape'});
  await waitFor(() => expect(screen.queryByRole('dialog', {name:'编辑成员 12'})).not.toBeInTheDocument());
  expect(screen.getByRole('dialog', {name:'设置'})).toBeVisible();
  await waitFor(() => expect(screen.getByRole('button', {name:'编辑成员 12'})).toHaveFocus());
});

it('lets the topmost tooltip consume Escape before closing its dialog', async () => {
  render(<Dialog trigger={<Button>Open</Button>} title="Parent" description="Help inside dialog"><Tooltip content="Help text"><Button>Help</Button></Tooltip></Dialog>);
  fireEvent.click(screen.getByRole('button', {name:'Open'}));
  const help = screen.getByRole('button', {name:'Help'});
  help.focus();
  await screen.findByRole('tooltip');
  fireEvent.keyDown(help, {key:'Escape'});
  await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
  expect(screen.getByRole('dialog', {name:'Parent'})).toBeVisible();
  fireEvent.keyDown(help, {key:'Escape'});
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

it.each([false, true])('reconciles pending saves on reopen without overwriting newer edits (edited=%s)', async edited => {
  render(<ThemeProvider><SettingsDialogGallery /></ThemeProvider>);
  fireEvent.click(screen.getByRole('button', {name:'打开设置'}));
  fireEvent.change(screen.getByRole('textbox', {name:'工作区名称'}), {target:{value:'保存中的名称'}});
  fireEvent.click(screen.getByRole('button', {name:'保存当前工作区设置'}));
  fireEvent.click(screen.getByRole('button', {name:'关闭对话框'}));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', {name:'打开设置'}));
  if (edited) fireEvent.change(screen.getByRole('textbox', {name:'工作区名称'}), {target:{value:'重新打开后编辑'}});
  await screen.findByText('已保存演示草稿');
  expect(screen.getByText('已保存名称：保存中的名称')).toBeVisible();
  expect(screen.getByRole('textbox', {name:'工作区名称'})).toHaveValue(edited ? '重新打开后编辑' : '保存中的名称');
});


it.each([undefined, null, false, ''])('omits absent description without a dangling relationship (%s)', description => {
  render(<Dialog trigger={<Button>Open</Button>} title="Settings" description={description} height={640} footer={<Button>Save</Button>} navigation={<a href="#a">Account</a>}><p>Form</p></Dialog>);
  fireEvent.click(screen.getByText('Open'));
  const dialog = screen.getByRole('dialog');
  expect(dialog).not.toHaveAttribute('aria-describedby');
  expect(dialog.querySelector('.rhine-dialog__main > p')).toBeNull();
  expect(screen.getByRole('region', {name:'Settings内容'})).toHaveTextContent('Form');
  expect(screen.getByText('Save').closest('.rhine-dialog__scroll')).toBeNull();
});

it('keeps optional descriptions associated and ordinary Dialog/Drawer natural', () => {
  const {rerender} = render(<Dialog trigger={<Button>Open</Button>} title="Short" description="Decision context"><p>Form</p></Dialog>);
  fireEvent.click(screen.getByText('Open'));
  let dialog = screen.getByRole('dialog');
  expect(document.getElementById(dialog.getAttribute('aria-describedby')!)).toHaveTextContent('Decision context');
  expect(dialog).not.toHaveClass('rhine-dialog--bounded');
  rerender(<Drawer trigger={<Button>Open</Button>} title="Drawer"><p>Form</p></Drawer>);
  fireEvent.click(screen.getByText('Open'));
  dialog = screen.getByRole('dialog');
  expect(dialog).not.toHaveClass('rhine-dialog--bounded');
  expect(dialog).not.toHaveAttribute('aria-describedby');
});


afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); document.documentElement.style.zoom = ''; });
it.each(['error', 'conflict'])('retains the host draft after %s and reconciles only explicit success', outcome => {
  vi.useFakeTimers();
  render(<ThemeProvider><SettingsDialogGallery /></ThemeProvider>);
  fireEvent.change(screen.getByLabelText('保存结果'), {target:{value:outcome}});
  fireEvent.click(screen.getByText('打开设置'));
  const dialog = screen.getByRole('dialog');
  const draft = within(dialog).getByLabelText('工作区名称');
  fireEvent.change(draft, {target:{value:'未提交草稿'}});
  const save = within(dialog).getByRole('button', {name:'保存当前工作区设置'});
  fireEvent.click(save); fireEvent.click(save);
  expect(save).toHaveAttribute('aria-busy', 'true');
  expect(save).toHaveAttribute('aria-disabled', 'true');
  act(() => vi.advanceTimersByTime(500));
  expect(draft).toHaveValue('未提交草稿');
  expect(screen.getByText('已保存名称：研究工作区')).toBeInTheDocument();
  expect(within(dialog).getByRole('alert')).toHaveTextContent(outcome === 'error' ? '保存失败' : '内容已更新');
});

it('cleans pending host requests and ignores an obsolete async section', () => {
  vi.useFakeTimers();
  const clear = vi.spyOn(globalThis, 'clearTimeout'), timer = vi.spyOn(globalThis, 'setTimeout');
  const {unmount} = render(<ThemeProvider><SettingsDialogGallery /></ThemeProvider>);
  fireEvent.click(screen.getByText('打开设置'));
  fireEvent.click(screen.getByRole('link', {name:'异步栏目'}));
  expect(screen.getByText('正在读取栏目')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('link', {name:'账号'}));
  act(() => vi.advanceTimersByTime(500));
  expect(screen.queryByText('异步栏目已就绪')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name:'保存当前工作区设置'}));
  const hostTimers = timer.mock.calls.flatMap((call, i) => call[1] === 500 ? [timer.mock.results[i].value] : []);
  unmount();
  expect(hostTimers).toHaveLength(2);
  for (const id of hostTimers) expect(clear).toHaveBeenCalledWith(id);
});


it('gives only the actual bounded body a named keyboard entry', () => {
  const props = {trigger:<Button>Open</Button>, title:'Read', height:400, open:true, onOpenChange:() => {}};
  const {rerender} = render(<Dialog {...props}><p>Long text</p></Dialog>);
  expect(screen.getByRole('region', {name:'Read内容'})).toHaveClass('rhine-dialog__body');
  expect(screen.getByRole('region')).toHaveAttribute('tabindex', '0');
  rerender(<Dialog {...props} navigation={<a href="#a">Account</a>}><p>Long text</p></Dialog>);
  expect(screen.getAllByRole('region')).toHaveLength(1);
  expect(screen.getByRole('region')).toHaveClass('rhine-dialog__settings-content');
  expect(screen.getByRole('dialog').querySelector('.rhine-dialog__body')).not.toHaveAttribute('tabindex');
});

it.each([undefined, 'auto'] as const)('caps an auto-height footer (%s) against the zoomed viewport and cleans observation', async initialHeight => {
  vi.stubGlobal('innerHeight', 800);
  const remove = vi.spyOn(window, 'removeEventListener');
  const fixture = (height?: number | 'auto') => <Dialog trigger={<Button>Open</Button>} title="Auto" open onOpenChange={() => {}} height={height} footer={<Button>Action</Button>}><p>Text</p></Dialog>;
  const {rerender,unmount} = render(fixture(initialHeight));
  const dialog = screen.getByRole('dialog');
  const limit = () => parseFloat(dialog.style.getPropertyValue('--rhine-dialog-footer-limit'));
  expect(limit()).toBeCloseTo(307.2);
  document.documentElement.style.zoom = '2';
  fireEvent(window, new Event('resize'));
  expect(limit()).toBeCloseTo(147.2);
  vi.stubGlobal('innerHeight', 600); fireEvent(window, new Event('resize'));
  expect(limit()).toBeCloseTo(107.2);
  rerender(fixture(400));
  expect(dialog.style.getPropertyValue('--rhine-dialog-footer-limit')).toBe('');
  expect(remove).toHaveBeenCalledWith('resize', expect.any(Function));
  unmount();
});
