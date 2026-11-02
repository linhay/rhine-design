import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { startTransition, Suspense, type ChangeEvent } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import type { TextProps } from '../components/Typography';

const gate = vi.hoisted(() => ({ suspend: false, attempts: 0, change: null as null | ((value: string) => void) }));
vi.mock('../components', async () => {
  const actual = await vi.importActual<typeof import('../components')>('../components');
  const pending = new Promise<never>(() => {});
  return { ...actual, Select: (props: Parameters<typeof actual.Select>[0]) => {
    if (props.label === '阅读场景') gate.change = value => props.onChange?.({ target: { value } } as ChangeEvent<HTMLSelectElement>);
    return <actual.Select {...props} />;
  }, Text: (props: TextProps) => {
    if (gate.suspend && props.children === '观察正文') { gate.attempts++; throw pending; }
    return <actual.Text {...props} />;
  } };
});
import { ObjectReadingGallery } from '../preview/ObjectReadingGallery';

afterEach(() => { gate.suspend = false; gate.attempts = 0; vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('does not let a suspended, discarded ready render overwrite committed placeholder memory', async () => {
  // JSDOM models only the two layout ranges; browser geometry has separate coverage.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return this.getAttribute('role') === 'dialog' ? new DOMRect(0, 0, 400, 400) : new DOMRect(10, 10, 200, 30);
  });
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(400);
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function (this: HTMLElement) {
    return this.querySelector('[data-testid="reading-end"]') ? 2400 : 400;
  });
  let id = 0;
  const frames = new Map<number, FrameRequestCallback>();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++id, callback); return id; });
  vi.stubGlobal('cancelAnimationFrame', (key: number) => { frames.delete(key); });
  const frame = () => act(() => { const work = [...frames.values()]; frames.clear(); work.forEach(callback => callback(0)); });
  render(<Suspense fallback={<p>pending render</p>}><ObjectReadingGallery /></Suspense>);
  const scenario = screen.getByRole('combobox', { name: '阅读场景' });
  const open = () => fireEvent.click(screen.getByRole('button', { name: /^阅读：河谷观察笔记/ }));
  const close = async () => {
    fireEvent.click(screen.getByRole('button', { name: '关闭对话框' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  };
  open(); frame();
  let dialog = screen.getByRole('dialog');
  dialog.scrollTop = 700; fireEvent.scroll(dialog);
  await close();
  open(); frame();
  expect(screen.getByRole('dialog').scrollTop).toBe(700);
  await close();
  fireEvent.change(scenario, { target: { value: 'error' } }); open();
  dialog = screen.getByRole('dialog');
  expect(within(dialog).getByText('正文加载失败')).toBeVisible();
  gate.suspend = true;
  await act(async () => { startTransition(() => { gate.change?.('ready'); }); });
  expect(gate.attempts).toBeGreaterThan(0);
  expect(screen.queryByTestId('reading-end')).not.toBeInTheDocument();
  expect(screen.queryByText('pending render')).not.toBeInTheDocument();
  expect(within(dialog).getByText('正文加载失败')).toBeVisible();
  // A queued callback still sees the committed short error placeholder.
  frame(); fireEvent.scroll(dialog);
  gate.suspend = false;
  fireEvent.change(scenario, { target: { value: 'unsupported' } });
  await close();
  fireEvent.change(scenario, { target: { value: 'error' } }); open(); frame();
  fireEvent.click(screen.getByRole('button', { name: '重试正文' }));
  await waitFor(() => expect(screen.getByTestId('reading-end')).toBeVisible());
  frame();
  expect(screen.getByRole('dialog').scrollTop).toBe(700);
});
