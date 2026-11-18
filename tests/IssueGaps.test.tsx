import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { expect, it, vi } from 'vitest';
import { DataTable, Dialog, RichText } from '../components';
import { parseInline, parseRichBlocks } from '../components/rich-text-parser';

it('exposes caller-owned mixed selection and toggles expandable rows without bubbling commands', () => {
  const onSelect = vi.fn(), onExpand = vi.fn(), onActivate = vi.fn();
  const rows: { id: string; name: string; children?: { id: string; name: string }[] }[] = [{ id: 'org', name: '组织甲', children: [{ id: 'child', name: '成员乙' }] }];
  render(<DataTable caption="组织" columns={[{ key: 'name', header: '名称', render: row => row.name }]} rows={rows} rowKey={row => row.id} rowLabel={row => row.name}
    selection={{ keys: ['child'], mixedKeys: ['org'], onChange: onSelect }}
    expansion={{ keys: [], onChange: onExpand, rowToggle: true, getChildren: row => row.children ?? [] }}
    rowAction={{ label: () => '查看', onActivate }} />);
  expect(screen.getByRole('checkbox', { name: '选择组织甲' })).toHaveAttribute('aria-checked', 'mixed');
  fireEvent.click(screen.getByRole('row', { name: /组织甲/ }));
  expect(onExpand).toHaveBeenCalledWith(['org']);
  expect(onActivate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '查看' }));
  expect(onExpand).toHaveBeenCalledTimes(1);
  expect(onActivate).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('checkbox', { name: '选择组织甲' }));
  expect(onSelect).toHaveBeenCalled();
  expect(onExpand).toHaveBeenCalledTimes(1);
});

it('keeps hidden selected descendants when the parent row is collapsed', () => {
  const onSelect = vi.fn();
  function Host() {
    const [open, setOpen] = useState(['org']);
    const rows: { id: string; name: string; children?: { id: string; name: string }[] }[] = [{ id: 'org', name: '组织甲', children: [{ id: 'child', name: '成员乙' }] }];
    return <DataTable caption="组织" columns={[{ key: 'name', header: '名称', render: row => row.name }]} rows={rows} rowKey={row => row.id} rowLabel={row => row.name}
      selection={{ keys: ['org', 'child'], onChange: onSelect }}
      expansion={{ keys: open, onChange: setOpen, getChildren: row => row.children ?? [] }} />;
  }
  render(<Host />);
  fireEvent.click(screen.getByRole('button', { name: '收起组织甲' }));
  expect(screen.queryByRole('checkbox', { name: '选择成员乙' })).toBeNull();
  expect(onSelect).not.toHaveBeenCalled();
});

it('does not close a dialog from the backdrop when outside dismissal is disabled', () => {
  const onOpenChange = vi.fn();
  render(<Dialog title="订阅" open outsideDismiss={false} onOpenChange={onOpenChange} footer={<button type="button">取消</button>}>内容</Dialog>);
  fireEvent.pointerDown(document.body);
  fireEvent.click(document.body);
  expect(onOpenChange).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '关闭对话框' }));
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

it('renders historical emphasis, indented code, case-insensitive marks, and a noninteractive preview', () => {
  expect(parseInline('保留 file_name，强调 _术语_ 和 __保存__').some(token => token.kind === 'emphasis' || token.kind === 'strong')).toBe(true);
  expect(parseInline('file_name').every(token => token.kind === 'text')).toBe(true);
  expect(parseRichBlocks('    缩进代码').some(block => block.kind === 'code' && block.raw === '缩进代码')).toBe(true);
  render(<><button>打开卡片</button><RichText label="预览" source="保存 _配置_ 与 Config" highlight="config" highlightCase="insensitive" interactive={false} links="navigate" /></>);
  expect(screen.getByText('config', { exact: false }).closest('mark') || document.querySelector('mark')).toBeTruthy();
  expect(screen.queryByRole('button', { name: '复制原文' })).toBeNull();
  expect(screen.queryByRole('link')).toBeNull();
  expect(screen.getByRole('button', { name: '打开卡片' })).toBeEnabled();
});
