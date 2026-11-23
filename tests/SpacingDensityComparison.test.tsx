import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { SpacingDensityComparison } from '../preview/SpacingDensityComparison';

it('uses the adopted B layout by default while keeping A available for comparison', () => {
  render(<SpacingDensityComparison />);
  const comparison = screen.getByRole('combobox', { name: '对照布局' });
  expect(comparison).toHaveValue('grouped');
  expect(within(comparison).getByRole('option', { name: '对照 A · 分组有框' })).toHaveValue('framed');
  expect(screen.getByRole('region', { name: '工作区信息' })).toHaveAttribute('data-boxed', 'false');
  const tableSurface = screen.getByRole('table', { name: '同步记录表' }).closest('[data-density-table-surface]');
  expect(tableSurface).toHaveClass('rhine-surface--padding-none');
});
