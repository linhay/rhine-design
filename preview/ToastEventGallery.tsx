import { useEffect, useRef, useState } from 'react';
import { Button, Checkbox, Inline, Stack, Text, Toast } from '../components';
import { ThemeProvider, type ThemeName } from '../components/theme';

export function ToastEventGallery() {
  const [event, setEvent] = useState({ id: 0, open: false, tone: 'success' as 'success' | 'error' | 'warning' });
  const [renderCount, setRenderCount] = useState(0), [long, setLong] = useState(false), [pending, setPending] = useState(false);
  const delayed = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(delayed.current), []);
  const show = (tone: typeof event.tone) => setEvent(previous => ({ id: previous.id + 1, open: true, tone }));
  return <Stack data-toast-demo>
    <Inline><Button variant="secondary" onClick={() => show('success')}>显示成功通知</Button><Button variant="secondary" onClick={() => show('error')}>显示错误通知</Button><Button variant="secondary" onClick={() => show('warning')}>显示警告通知</Button></Inline>
    <Inline><Button variant="secondary" disabled={pending} onClick={() => {
      setPending(true);
      delayed.current = setTimeout(() => { setPending(false); show('success'); }, 1500);
    }}>1.5 秒后再次成功</Button><Button variant="quiet" onClick={() => setRenderCount(value => value + 1)}>普通重渲染</Button></Inline>
    <Checkbox label="长通知内容" checked={long} onChange={event => setLong(event.target.checked)} />
    <Text variant="caption" tone="muted">连续成功使用相同文案，每次新通知重新获得 5 秒；悬停、聚焦和页面隐藏期间暂停。同一通知的普通重渲染不续期，可在延迟期间 Tab 到关闭按钮检查焦点保留。</Text>
    <Text variant="caption">事件 {event.id} · 普通重渲染 {renderCount} · {pending ? '等待合成成功' : '无待完成操作'}</Text>
    <Toast eventId={event.id} placement="floating" open={event.open} onOpenChange={open => setEvent(previous => ({ ...previous, open }))} tone={event.tone}
      title={event.tone === 'success' ? '演示操作已完成' : event.tone === 'error' ? '演示操作失败' : '演示操作需要检查'}
      description={long ? '北区共享研究工作区的合成操作结果已记录。请检查完整说明与后续步骤；这段较长的通知用于验证窄容器和放大后的换行，关闭按钮始终可以通过键盘操作。' : event.tone === 'success' ? '5秒后关闭；悬停、聚焦或页面隐藏时暂停。' : '通知保持显示，请检查结果或手动关闭。'} />
  </Stack>;
}

export function ToastEventFixture() {
  const params = new URLSearchParams(location.search);
  const [mounted, setMounted] = useState(true);
  return <ThemeProvider defaultTheme={(params.get('theme') || 'rhine') as ThemeName} data-rhine-motion={params.get('motion') === 'manual' ? 'reduced' : 'system'}><main style={{ padding: 16 }}>
    <Button variant="quiet" onClick={() => setMounted(value => !value)}>{mounted ? '退出通知示例' : '进入通知示例'}</Button>
    {mounted && <ToastEventGallery />}
  </main></ThemeProvider>;
}
