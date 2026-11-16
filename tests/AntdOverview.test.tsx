import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GalleryShell } from '../preview/GalleryShell';
import { ComponentOverview } from '../preview/ComponentOverview';
import { antdCategoryOrder, antdComponents, galleryGroups, isKnownGallerySection, menuCurrentId } from '../preview/antd-overview';

const previousSections = ['top', 'subscriptions', 'compact-filters', 'checkbox-rows', 'component-typography', 'chat-foundation', 'app-shell', 'advanced-forms', 'advanced-data', 'media', 'monitoring', 'editorial-layout', 'graphite', 'neutral', 'foundation', 'backgrounds', 'spacing', 'typography', 'brand', 'button-actions', 'responsive-actions', 'actions', 'selection', 'summary-tabs', 'feedback', 'disclosure', 'data', 'forms', 'utilities', 'overlays', 'overlay-bounds', 'tray-usage', 'settings-composition', 'settings-dialog', 'template-settings', 'parameter-config', 'theme-picker', 'nav-actions', 'navigation', 'form-workflow', 'patterns', 'object-reading', 'resident-tree', 'agent-chat', 'compact-selection', 'compact-account', 'metric-comparison', 'periodic-report', 'personal-notifications', 'automation-settings', 'object-lifecycle', 'async-snapshot-recipes', 'list-card-recipes', 'single-search', 'list-filter-bar', 'date-range-filter', 'motion', 'startup', 'orbit', 'neutron-star'];

function Demo() {
  const [motion, setMotion] = useState('system');
  return <GalleryShell motion={motion} onMotionChange={setMotion}>{section => <h1>{section}</h1>}</GalleryShell>;
}

describe('Ant Design overview alignment', () => {
  it('puts the official component names in the sidebar, in official order', () => {
    expect(galleryGroups.map(group => group.label).filter(Boolean)).toEqual([...antdCategoryOrder]);
    const menu = galleryGroups.flatMap(group => group.items.map(item => ({ id: item[0], label: item[1] })));
    expect(menu.filter(item => antdComponents.some(entry => entry.id === item.id)).map(item => `${item.id}:${item.label}`)).toEqual(antdComponents.map(item => `${item.id}:${item.en} ${item.zh}`));
    expect(new Set(menu.map(item => item.id)).size).toBe(menu.length);
  });

  it('keeps every previous chapter address reachable', () => {
    for (const id of previousSections) expect(isKnownGallerySection(id), id).toBe(true);
    const menuIds = galleryGroups.flatMap(group => group.items.map(item => item[0]));
    for (const id of previousSections) expect(menuIds, id).toContain(id);
    expect(menuCurrentId('forms')).toBe('forms');
    expect(menuCurrentId('button-actions')).toBe('button-actions');
  });

  it('links every official item, including ones Rhine does not implement', () => {
    expect(antdComponents).toHaveLength(73);
    render(<ComponentOverview />);
    const general = screen.getByRole('region', { name: /通用/ });
    expect(within(general).getByRole('link', { name: /Button 按钮/ })).toHaveAttribute('href', '#button');
    expect(within(general).getByRole('link', { name: /FloatButton 悬浮按钮/ })).toHaveAttribute('href', '#float-button');
    expect(screen.getAllByRole('link')).toHaveLength(73);
  });

  it('opens a missing menu item without pretending it is an old chapter', () => {
    window.history.replaceState(null, '', '#float-button');
    render(<Demo />);
    expect(screen.getByRole('heading')).toHaveTextContent('float-button');
    expect(screen.getByRole('link', { name: 'FloatButton 悬浮按钮' })).toHaveAttribute('aria-current', 'page');
    window.history.replaceState(null, '', '/');
  });
});
