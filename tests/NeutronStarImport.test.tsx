import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { NeutronStarBackdrop } from '../components/NeutronStarBackdrop';

vi.mock('../components/neutronRenderer', () => { throw new Error('Lazy chunk unavailable'); });
afterEach(() => vi.unstubAllGlobals());

it('preserves the static artwork and interactive content if the lazy renderer import fails', async () => {
  vi.stubGlobal('WebGL2RenderingContext', function () {});
  const { container } = render(<NeutronStarBackdrop><button>继续工作</button></NeutronStarBackdrop>);
  await waitFor(() => expect(container.firstChild).toHaveAttribute('data-rhine-neutron-state', 'unavailable'));
  expect(screen.getByRole('button', { name: '继续工作' })).toBeEnabled();
  expect(screen.getByRole('button', { name: '静态画面' })).toBeDisabled();
  expect(container.querySelector('.rhine-neutron-fallback')).not.toBeNull();
});
