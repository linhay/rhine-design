import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { SettingsDialogGallery } from '../preview/SettingsDialogGallery';

it('keeps host state and URL while changing settings sections and explicitly saving', async () => {
  render(<SettingsDialogGallery />);
  const url = location.href;
  fireEvent.change(screen.getByRole('textbox', {name:'宿主查询'}), {target:{value:'已有查询'}});
  fireEvent.click(screen.getByRole('button', {name:'打开设置'}));
  fireEvent.change(screen.getByRole('textbox', {name:'工作区名称'}), {target:{value:'修改后的名称'}});
  fireEvent.click(screen.getByRole('link', {name:'用户管理与权限'}));
  fireEvent.click(screen.getByRole('link', {name:'账号'}));
  expect(screen.getByRole('textbox', {name:'工作区名称'})).toHaveValue('修改后的名称');
  expect(location.href).toBe(url);
  fireEvent.click(screen.getByRole('button', {name:'保存设置'}));
  await screen.findByText('已保存演示草稿');
  expect(screen.getByRole('dialog', {name:'设置'})).toBeVisible();
  fireEvent.click(screen.getByRole('button', {name:'关闭对话框'}));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getByRole('textbox', {name:'宿主查询'})).toHaveValue('已有查询');
  fireEvent.click(screen.getByRole('button', {name:'打开设置'}));
  expect(screen.getByRole('textbox', {name:'工作区名称'})).toHaveValue('修改后的名称');
  fireEvent.change(screen.getByRole('textbox', {name:'工作区名称'}), {target:{value:'丢弃'}});
  fireEvent.click(screen.getByRole('button', {name:'取消草稿'}));
  expect(screen.getByRole('textbox', {name:'工作区名称'})).toHaveValue('修改后的名称');
});

it('closes only the focused nested dialog on an immediate Escape', async () => {
  render(<SettingsDialogGallery />);
  fireEvent.click(screen.getByRole('button', {name:'打开设置'}));
  fireEvent.click(screen.getByRole('link', {name:'用户管理与权限'}));
  fireEvent.click(screen.getByRole('button', {name:'编辑成员 12'}));
  const input = screen.getByRole('textbox', {name:'成员备注'});
  input.focus(); fireEvent.keyDown(input, {key:'Escape'});
  await waitFor(() => expect(screen.queryByRole('dialog', {name:'编辑成员 12'})).not.toBeInTheDocument());
  expect(screen.getByRole('dialog', {name:'设置'})).toBeVisible();
  await waitFor(() => expect(screen.getByRole('button', {name:'编辑成员 12'})).toHaveFocus());
});
