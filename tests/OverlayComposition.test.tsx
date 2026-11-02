import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button, Combobox, Dialog, Popover, TextField } from '../components';

const signals = [
  { name: 'composition lifecycle', start: true, key: {} },
  { name: 'isComposing', start: false, key: { isComposing: true } },
  { name: 'legacy 229', start: false, key: { keyCode: 229 } },
];
for (const kind of ['dialog', 'popover', 'combobox', 'nested'] as const) {
  describe(kind, () => {
    for (const signal of signals) it(`preserves IME default and layers for ${signal.name}, then permits independent Escape`, async () => {
      const changed = vi.fn();
      const field = <TextField label="Draft" defaultValue="合成草稿" />;
      const combo = <Combobox label="Candidate" query="合成" onQueryChange={changed} value={null} onValueChange={vi.fn()} options={[{ value: 'a', label: '合成候选' }]} />;
      render(kind === 'dialog' ? <Dialog title="Editor" trigger={<Button>Open</Button>}>{field}</Dialog>
        : kind === 'popover' ? <Popover title="Editor" trigger={<Button>Open</Button>}>{field}</Popover>
        : kind === 'nested' ? <Dialog title="Editor" trigger={<Button>Open</Button>}>{combo}</Dialog> : combo);
      if (kind !== 'combobox') fireEvent.click(screen.getByRole('button', { name: 'Open' }));
      const input = screen.getByRole(kind === 'combobox' || kind === 'nested' ? 'combobox' : 'textbox');
      fireEvent.focus(input);
      if (signal.start) fireEvent.compositionStart(input);
      const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true, ...signal.key });
      fireEvent(input, escape);
      expect(escape.defaultPrevented).toBe(false);
      expect(input).toBeInTheDocument();
      if (kind === 'combobox' || kind === 'nested') expect(input).toHaveAttribute('aria-expanded', 'true');
      if (signal.start) fireEvent.compositionEnd(input);
      fireEvent.keyDown(input, { key: 'Escape' });
      if (kind === 'combobox' || kind === 'nested') {
        await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'false'));
        if (kind === 'nested') {
          expect(screen.getByRole('dialog', { name: 'Editor' })).toBeVisible();
          fireEvent.keyDown(input, { key: 'Escape' });
        }
      }
      if (kind !== 'combobox') await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });
  });
}

it('clears unfinished composition on blur and removes capture listeners on unmount', () => {
  const add = vi.spyOn(window, 'addEventListener'), remove = vi.spyOn(window, 'removeEventListener');
  const { unmount } = render(<Popover title="Editor" trigger={<Button>Open</Button>}><TextField label="Draft" /></Popover>);
  fireEvent.click(screen.getByRole('button', { name: 'Open' }));
  const input = screen.getByRole('textbox');
  fireEvent.compositionStart(input);
  fireEvent.blur(input);
  const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
  fireEvent(input, escape);
  expect(escape.defaultPrevented).toBe(true); // Radix handled a normal Escape.
  unmount();
  for (const [type, listener, options] of add.mock.calls.filter(([type]) => ['keydown', 'compositionstart', 'compositionend', 'blur'].includes(type))) {
    expect(remove).toHaveBeenCalledWith(type, listener, options);
  }
  add.mockRestore(); remove.mockRestore();
});

it('releases composition after the browser window loses focus without compositionend', async () => {
  render(<Dialog title="Editor" trigger={<Button>Open</Button>}><TextField label="Draft" /></Dialog>);
  fireEvent.click(screen.getByRole('button', { name: 'Open' }));
  const input=screen.getByRole('textbox'); input.focus();
  fireEvent.compositionStart(input);
  fireEvent(input.ownerDocument.defaultView!, new Event('blur'));
  fireEvent.keyDown(input, {key:'Escape'});
  await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});
