import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = new URL('../', import.meta.url);
const read = async relative => readFile(new URL(relative, root), 'utf8');
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const preview = await read('preview/preview.css');
const provided = await read('components/provided.css');
const patterns = await read('components/patterns.css');
const extensions = await read('components/extensions.css');
const arknights = await read('components/theme-arknights.css');
const main = await read('preview/main.tsx');
const dayDivider = await read('components/chat-foundation/DayDivider.tsx');
const chatFoundation = await read('components/chat-foundation.css');
const themePickerGallery = await read('preview/ThemePickerGallery.tsx');
const extensionsGallery = await read('preview/ExtensionsGallery.tsx');

// Gallery layout owns direct chapter frames only. Descendant component sections are public internals.
expect(!/\.ds-gallery\s+section\s*\{/.test(preview), 'preview .ds-gallery must not style arbitrary descendant sections');
expect(/\.ds-gallery\s*>\s*section\s*\{/.test(preview), 'preview must retain an explicit direct chapter section rule');
// Decoration must never consume the hit area of its children.
expect(/\.rhine-border-beam::before[\s\S]*?pointer-events\s*:\s*none/.test(provided), 'BorderBeam decoration must set pointer-events:none');
// Public navigation and tree targets keep the standard target and text roles.
expect(/\.rhine-side-nav__children a\s*\{[^}]*min-height\s*:\s*44px[^}]*font-size\s*:\s*var\(--rhine-text-body\)/.test(patterns), 'SideNav children must retain body text and 44px target');
expect(/\.rhine-tree__spacer\s*\{\s*flex\s*:\s*0 0 44px/.test(extensions), 'Tree leaf placeholder must align with branch target width');
// Theme identity cannot reduce business status text below the project floor or add decorative Chinese spacing.
const arknightsBadge = arknights.match(/\.rhine-theme\[data-rhine-theme="arknights"\] \.rhine-badge\s*\{([^}]*)\}/)?.[1] ?? '';
expect(arknightsBadge.length > 0, 'Arknights Badge rule must remain explicit');
expect(!/\b11px\b/.test(arknightsBadge), 'Arknights Badge must not use 11px business text');
expect(!/letter-spacing\s*:\s*\.1em/.test(arknightsBadge), 'Arknights Badge must not add decorative Chinese letter spacing');
// Default component chapters use the library text primitive rather than UA h1 defaults.
expect((main.match(/<section className="ds-section"><Text as="h1" variant="section">/g) ?? []).length >= 2, 'default component chapters must use Text section titles');
// Preview consumes public component entries; only the dedicated theme entry is a separate public sub-entry.
expect(!/from ['"]\.\.\/components\/(?:components|ThemePicker|Actions|Forms|Overlays|Layout|Typography|provided|parity|AdvancedForms|data|config|ChatFoundation|Chat)['"]/.test(themePickerGallery), 'ThemePicker gallery must consume the public component entry');
expect(!/from ['"]\.\.\/components\/(?:components|ThemePicker|Actions|Forms|Overlays|Layout|Typography|provided|parity|AdvancedForms|data|config|ChatFoundation|Chat)['"]/.test(extensionsGallery), 'Extensions gallery must consume public component types/values');

expect(dayDivider.includes('rhine-chat-day-divider'), 'DayDivider must use its own class namespace');
expect(/\.rhine-chat-day-divider span\[aria-hidden\]/.test(chatFoundation), 'DayDivider lines must be styled by Chat Foundation');
if (failures.length) {
  console.error(JSON.stringify({ pass: false, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ pass: true, checks: 10, failures: [] }));
