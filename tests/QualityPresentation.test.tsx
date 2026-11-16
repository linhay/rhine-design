import { readFileSync } from 'node:fs';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button, Card, Collapse, CountBadge, Descriptions, Result, TreeSelect, WorkspaceRail } from '../components';

const source = (name: string) => readFileSync(new URL(name, import.meta.url), 'utf8');
const rule = (css: string, selector: string) => {
  const start = css.indexOf(`${selector} {`);
  return start < 0 ? '' : css.slice(start, css.indexOf('}', start) + 1);
};

describe('quality presentation ownership', () => {
  it('keeps gallery chapter padding out of arbitrary descendant sections', () => {
    expect(source('../preview/preview.css')).not.toMatch(/\.ds-gallery\s+section\s*\{/);
  });
  it('makes the decorative beam pointer transparent', () => {
    expect(rule(source('../components/provided.css'), '.rhine-border-beam::before')).toMatch(/pointer-events:\s*none/);
  });
  it('uses text roles for composition headings instead of UA heading defaults', () => {
    render(<><Card title="卡片"><p>内容</p></Card><Descriptions title="说明" items={[]} /><Result status="info" title="结果" description="详情" /></>);
    for (const name of ['卡片', '说明']) expect(screen.getByRole('heading', { name })).toHaveClass('rhine-text--heading');
    expect(screen.getByRole('heading', { name: '结果' })).toHaveClass('rhine-text--section');
  });
  it('shows the inline tree field name and labels its actual tree', () => {
    render(<TreeSelect label="项目层级" nodes={[{ id: 'a', label: '甲' }]} value={[]} onValueChange={() => undefined} expandedKeys={[]} onExpandedChange={() => undefined} />);
    expect(screen.getByText('项目层级')).toBeVisible();
    expect(screen.getByRole('tree', { name: '项目层级' })).toBeInTheDocument();
  });
  it('renders a visible collapse cue without changing its accessible button name', () => {
    render(<Collapse label="组" items={[{ id: 'a', title: '第一组', content: <p>正文</p> }]} />);
    const toggle = screen.getByRole('button', { name: '第一组' });
    expect(toggle.querySelector('[aria-hidden=true]')).not.toBeNull();
    fireEvent.click(toggle); expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
  it('self-hosts workspace actions while preserving names and disabled semantics', () => {
    render(<WorkspaceRail items={[{ id: 'a', label: '聊天', icon: '⌁' }, { id: 'b', label: '文件不可用', icon: '▤', disabled: true }]} />);
    expect(screen.getByRole('button', { name: '聊天' })).toHaveClass('rhine-button');
    expect(screen.getByRole('button', { name: '文件不可用' })).toBeDisabled();
  });
  it('keeps long AgentRow identities available instead of forcing ellipsis', () => {
    const css = source('../preview/chat-foundation.css');
    expect(css).not.toMatch(/rhine-chat-agent-row__identity[^}]*white-space\s*:\s*nowrap/);
    render(<WorkspaceRail items={[]} />);
  });
  it('keeps exact CountBadge values available while showing a compact summary', () => {
    render(<CountBadge count={120} label="条未读"><Button>收件</Button></CountBadge>);
    expect(screen.getByText('99+ 条未读')).toHaveAttribute('title', '120 条未读');
    expect(screen.getByLabelText('120 条未读')).toBeInTheDocument();
  });
  it('does not retain the 11px tactical status override', () => {
    expect(rule(source('../components/theme-arknights.css'), '.rhine-theme[data-rhine-theme="arknights"] .rhine-badge')).not.toMatch(/\b11px\b/);
  });
});
