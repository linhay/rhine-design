import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChatFoundationGallery } from '../preview/ChatFoundationGallery';
import { ChatFoundationComponentGallery } from '../preview/ChatFoundationComponentGallery';

describe('isolated Chat Foundation showcases', () => {
  it('keeps failed composer drafts and blocks submission while busy', () => {
    render(<ChatFoundationComponentGallery componentId="chat-foundation-composer" />);
    const input=screen.getByRole('textbox',{name:'消息'});
    fireEvent.change(input,{target:{value:'合成草稿'}});
    fireEvent.click(screen.getByRole('button',{name:'模拟失败'}));
    fireEvent.keyDown(input,{key:'Enter'});
    expect(input).toHaveValue('合成草稿');
    expect(within(input.closest('form')!).getByRole('alert')).toHaveTextContent('草稿已保留');
    fireEvent.click(screen.getByRole('button',{name:'模拟忙碌'}));
    expect(input).toBeDisabled();
    expect(screen.getByRole('button',{name:'发送消息'})).toBeDisabled();
  });
  it('selects filtered Agents and exposes empty results', () => {
    render(<ChatFoundationComponentGallery componentId="chat-foundation-agent-list" />);
    const search=screen.getByRole('textbox',{name:'搜索 Agent'});
    fireEvent.change(search,{target:{value:'Writer'}});
    const row=screen.getByRole('button',{name:/Writer/});
    fireEvent.click(row);expect(row).toHaveAttribute('aria-current','page');
    fireEvent.change(search,{target:{value:'no-synthetic-match'}});
    expect(screen.getByRole('status')).toHaveTextContent('未找到');
    expect(screen.queryByRole('button',{name:/Writer/})).not.toBeInTheDocument();
  });
  it('closes the Inspector, restores focus and can reopen it', () => {
    render(<ChatFoundationComponentGallery componentId="chat-foundation-inspector" />);
    fireEvent.click(screen.getByRole('button',{name:'关闭详情'}));
    expect(screen.queryByRole('complementary',{name:'Agent 信息'})).not.toBeInTheDocument();
    const reopen=screen.getByRole('button',{name:'显示详情'});expect(reopen).toHaveFocus();
    fireEvent.click(reopen);
    expect(screen.getByRole('complementary',{name:'Agent 信息'})).toBeInTheDocument();
  });
});


it('uses host session state across Agent selection, failed submission and inspector dismissal', () => {
  render(<ChatFoundationGallery />);
  const input = screen.getByRole('textbox', { name:'消息' });
  fireEvent.change(input, { target:{ value:'保留的合成草稿' } });
  fireEvent.click(screen.getByRole('button', { name:'模拟失败' }));
  fireEvent.keyDown(input, { key:'Enter' });
  expect(within(input.closest('form')!).getByRole('alert')).toHaveTextContent('草稿已保留');
  fireEvent.click(screen.getByRole('button', { name:/WWriter/ }));
  expect(input).toHaveValue('保留的合成草稿');
  expect(input).toHaveAttribute('placeholder', '给 Writer 发消息…');
  fireEvent.click(screen.getByRole('button', { name:'关闭详情' }));
  expect(screen.getByRole('button', { name:'显示详情' })).toHaveFocus();
});

it('replaces only the requested message type in the renderer showcase', () => {
  render(<ChatFoundationComponentGallery componentId="chat-foundation-message-renderer" />);
  fireEvent.click(screen.getByRole('button', { name:'使用自定义 Agent 渲染器' }));
  expect(screen.getByText(/自定义呈现/)).toBeVisible();
  expect(document.querySelector('.rhine-chat-message--person')).toHaveTextContent('先从资料 v2 开始');
});
