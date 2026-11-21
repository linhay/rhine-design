import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
    expect(input).not.toBeDisabled();
    expect(input).toHaveAttribute('readonly');
    expect(screen.getByRole('button',{name:'发送消息'})).toHaveAttribute('aria-disabled','true');
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
  expect(input).toHaveValue('');
  expect(within(input.closest('form')!).queryByRole('alert')).not.toBeInTheDocument();
  expect(input).toHaveAttribute('placeholder', '给 Writer 发消息…');
  fireEvent.click(screen.getByRole('button', {name:/Chief of Staff/}));
  expect(input).toHaveValue('保留的合成草稿');
  expect(within(input.closest('form')!).getByRole('alert')).toHaveTextContent('草稿已保留');
  fireEvent.click(screen.getByRole('button', { name:'关闭详情' }));
  expect(screen.getByRole('button', { name:'显示详情' })).toHaveFocus();
});

it('uses the same reference panel from plus and @, adding without submission', async () => {
  render(<ChatFoundationGallery/>);
  const draft=screen.getByRole('textbox',{name:'消息'});
  fireEvent.click(screen.getByRole('button',{name:'添加引用'}));
  let dialog=await screen.findByRole('dialog',{name:'添加引用'});
  const query=within(dialog).getByRole('textbox',{name:'搜索引用'});
  fireEvent.change(query,{target:{value:'会议'}});
  fireEvent.keyDown(query,{key:'Enter'});
  expect(draft).toHaveValue('@会议纪要 ');
  expect(screen.getByRole('button',{name:'移除引用：会议纪要'})).toBeInTheDocument();
  expect(screen.queryByText(/未发送给 Agent/)).not.toBeInTheDocument();
  fireEvent.change(draft,{target:{value:'核对 @ ',selectionStart:4}});
  dialog=await screen.findByRole('dialog',{name:'添加引用'});
  fireEvent.click(within(dialog).getByRole('button',{name:'引用：资料 v2'}));
  expect(draft).toHaveValue('核对 @资料 v2 ');
  expect(screen.queryByText(/未发送给 Agent/)).not.toBeInTheDocument();
});

it.each([
  ['@ 后文',1,'@会议纪要 后文'],
  ['前文 @ 后文',4,'前文 @会议纪要 后文'],
])('reuses a pending @ when switching to the plus button: %s',async (text,position,expected)=>{
  render(<ChatFoundationGallery/>);
  const draft=screen.getByRole('textbox',{name:'消息'}) as HTMLTextAreaElement;
  act(()=>draft.focus());
  fireEvent.change(draft,{target:{value:text,selectionStart:position,selectionEnd:position}});
  const original=await screen.findByRole('dialog',{name:'添加引用'});
  fireEvent.keyDown(within(original).getByRole('textbox',{name:'搜索引用'}),{key:'Escape'});
  expect(draft).toHaveValue(text);
  expect(draft.selectionStart).toBe(position);
  expect(draft.selectionEnd).toBe(position);
  fireEvent.click(screen.getByRole('button',{name:'添加引用'}));
  const reopened=await screen.findByRole('dialog',{name:'添加引用'});
  fireEvent.click(within(reopened).getByRole('button',{name:'引用：会议纪要'}));
  expect(draft).toHaveValue(expected);
  expect(draft.selectionStart).toBe(expected.indexOf(' 后文'));
  expect(screen.getByRole('button',{name:'移除引用：会议纪要'})).toBeInTheDocument();
  expect(screen.queryByText(/未发送给 Agent/)).not.toBeInTheDocument();
});

it('keeps a literal non-trigger @ when using the plus button',async()=>{
  render(<ChatFoundationGallery/>);
  const draft=screen.getByRole('textbox',{name:'消息'});
  fireEvent.change(draft,{target:{value:'alice@'}});
  expect(screen.queryByRole('dialog',{name:'添加引用'})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'添加引用'}));
  fireEvent.click(within(await screen.findByRole('dialog',{name:'添加引用'})).getByRole('button',{name:'引用：会议纪要'}));
  expect(draft).toHaveValue('alice@ @会议纪要 ');
});

it('does not let an earlier response clear the active conversation or its references', async () => {
  vi.useFakeTimers();
  try {
    render(<ChatFoundationGallery/>);
    const draft=screen.getByRole('textbox',{name:'消息'});
    fireEvent.change(draft,{target:{value:'甲内容'}});
    fireEvent.click(screen.getByRole('button',{name:'模拟异步'}));fireEvent.keyDown(draft,{key:'Enter'});
    fireEvent.click(screen.getByRole('button',{name:/WWriter/}));
    fireEvent.change(draft,{target:{value:'乙内容'}});
    fireEvent.click(screen.getByRole('button',{name:'添加引用'}));
    fireEvent.click(within(screen.getByRole('dialog',{name:'添加引用'})).getByRole('button',{name:'引用：资料 v2'}));
    await act(async()=>vi.advanceTimersByTime(450));
    expect(draft).toHaveValue('乙内容 @资料 v2 ');
    expect(screen.getByRole('button',{name:'移除引用：资料 v2'})).toBeInTheDocument();
    expect(screen.queryByText(/未发送给 Agent/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'新任务'}));
    expect(draft).toHaveValue('');expect(screen.queryByRole('button',{name:'移除引用：资料 v2'})).not.toBeInTheDocument();
    fireEvent.change(draft,{target:{value:'新任务草稿'}});
    fireEvent.click(screen.getByRole('button',{name:/WWriter/}));
    expect(draft).toHaveValue('乙内容 @资料 v2 ');
    fireEvent.click(screen.getByRole('button',{name:'新任务'}));expect(draft).toHaveValue('新任务草稿');
  } finally {vi.useRealTimers();}
});

it('replaces only the requested message type in the renderer showcase', () => {
  render(<ChatFoundationComponentGallery componentId="chat-foundation-message-renderer" />);
  fireEvent.click(screen.getByRole('button', { name:'使用自定义 Agent 渲染器' }));
  expect(screen.getByText(/自定义呈现/)).toBeVisible();
  expect(document.querySelector('.rhine-chat-message--person')).toHaveTextContent('先从资料 v2 开始');
});
