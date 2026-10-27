import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { ObjectReadingGallery } from '../preview/ObjectReadingGallery';

const openNote = () => fireEvent.click(screen.getByRole('button', { name: /^阅读：河谷观察笔记/ }));

it('hands focus to a related page, then restores query, type, selected object, tab and entry focus', async () => {
  render(<ObjectReadingGallery />);
  fireEvent.change(screen.getByRole('searchbox', { name: '搜索名称' }), { target: { value: '观察' } });
  fireEvent.change(screen.getByRole('combobox', { name: '类型' }), { target: { value: 'note' } });
  const entry = screen.getByRole('button', { name: /^阅读：河谷观察笔记/ });
  openNote();
  fireEvent.click(screen.getByRole('tab', { name: '来源' }));
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  fireEvent.click(screen.getByRole('tab', { name: '关联' }));
  fireEvent.click(screen.getByRole('button', { name: '打开关联对话' }));
  await waitFor(() => expect(screen.getByRole('heading', { name: '对话：河谷观察讨论' })).toHaveFocus());
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '返回工作空间' }));
  await waitFor(() => expect(entry).toHaveFocus());
  expect(screen.getByRole('searchbox')).toHaveValue('观察');
  expect(screen.getByRole('combobox', { name: '类型' })).toHaveValue('note');
  expect(screen.getByRole('combobox', { name: '目录' })).toHaveValue('research');
  expect(screen.getByTestId('reading-invariants')).toHaveTextContent('内容版本未修改 · 收件状态：未读');
  openNote();
  expect(screen.getByRole('tab', { name: '关联' })).toHaveAttribute('aria-selected', 'true');
  fireEvent.click(screen.getByRole('button', { name: '关闭对话框' }));
  await waitFor(() => expect(entry).toHaveFocus());
});

it.each([
  ['restricted', '正文受限'], ['unsupported', '格式不可预览'], ['loading', '正在加载正文'], ['error', '正文加载失败'],
])('retains identity and exit for %s without rendering readable content', (scenario, label) => {
  render(<ObjectReadingGallery />);
  fireEvent.change(screen.getByRole('combobox', { name: '阅读场景' }), { target: { value: scenario } });
  openNote();
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByText(label)).toBeVisible();
  expect(within(dialog).getByText('访问权限')).toBeVisible();
  expect(within(dialog).getByRole('button', { name: '关闭对话框' })).toBeVisible();
  expect(screen.queryByTestId('reading-end')).not.toBeInTheDocument();
  if (scenario === 'error') { fireEvent.click(screen.getByRole('button', { name: '重试正文' })); expect(screen.getByTestId('reading-end')).toBeVisible(); }
});

it.each(['source-unavailable', 'no-related', 'related-unavailable', 'restricted'])('offers no source or relation bypass for %s', scenario => {
  render(<ObjectReadingGallery />);
  fireEvent.change(screen.getByRole('combobox', { name: '阅读场景' }), { target: { value: scenario } });
  openNote();
  fireEvent.click(screen.getByRole('tab', { name: scenario === 'source-unavailable' ? '来源' : '关联' }));
  const panel = screen.getByRole('tabpanel');
  expect(within(panel).queryByRole('link')).not.toBeInTheDocument();
  expect(within(panel).queryByRole('button')).not.toBeInTheDocument();
});

it('distinguishes an empty folder from no matching results and provides recovery', () => {
  render(<ObjectReadingGallery />);
  fireEvent.change(screen.getByRole('combobox', { name: '目录' }), { target: { value: 'empty' } });
  expect(screen.getByText('目录为空')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: '返回资料目录' }));
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: '不存在' } });
  expect(screen.getByText('没有匹配结果')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: '清除筛选' }));
  expect(screen.getAllByRole('button', { name: /^阅读：/ })).toHaveLength(2);
});


it('moves focus to the visible related tab when leaving the bottom of the body', () => {
  render(<ObjectReadingGallery />);
  openNote();
  const jump = screen.getByRole('button', { name: '查看关联' });
  jump.focus();
  fireEvent.click(jump);
  expect(screen.getByRole('tab', { name: '关联' })).toHaveFocus();
  expect(document.activeElement?.closest('[hidden]')).toBeNull();
});
