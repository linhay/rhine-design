# Task map

Resolve the matching package root as described in SKILL.md. Open the first relevant source; expand only when the task crosses domains.

| Task | First reference (relative to package root) | Implementation / example |
| --- | --- | --- |
| Application shell, backgrounds, media, advanced inputs, controlled tables | `docs/APPLICATION_COMPONENTS.md` (0.5.0 candidate, not published) | `preview/ExtensionsGallery.tsx`; `/#app-shell`, `/#advanced-forms`, `/#advanced-data`, `/#media` |
| Theme integration, switching, controlled preferences | `docs/THEMING.md` (0.4.0) | `components/theme.tsx`, `preview/GalleryShell.tsx` |
| Scenario selection, navigation, form recovery, monitoring | `docs/INTERACTION_PATTERNS.md` (0.4.0; check installed version) | `preview/PatternGallery.tsx`; research in `docs/REFERENCE_RESEARCH.md` |
| Visual direction, colors, spacing, layout | `docs/DESIGN_SYSTEM.md` | `components/tokens.css`, `components/Layout.tsx` |
| Spacing, grouping, card composition | `components/SPACING.md` (0.4.0 docs; existing gap API works in 0.3.0) | `components/Layout.tsx`, `preview/SpacingGallery.tsx`; `/#spacing` |
| Text hierarchy, line height, paragraphs, Chinese/Latin text, metrics | `components/TYPOGRAPHY.md` | `components/Typography.tsx`, `preview/LineHeightGallery.tsx`; `/#typography` |
| Logo, light/dark variants, wordmark | `components/README.md` → 品牌标志 | `components/Logo.tsx`, `components/assets/logo.svg` |
| Buttons, navigation, basic states | `components/README.md` → 组件契约 | `components/components.tsx` |
| Forms, selection, combobox, data tables | `components/COMMON_COMPONENTS.md` | Use API_MAP for the source file |
| Modal, menu, popover, tooltip, feedback | `components/COMMON_COMPONENTS.md` | `components/Overlays.tsx`, `components/Toast.tsx` |
| Transition, replay, cancellation, reduced motion | `components/MOTION.md` | `preview/`, `components/styles.css` |
| Startup sequence, logo assembly, ready handoff | `components/STARTUP.md` | Search `startup` in `preview/`; not a public Startup component |
| Missing capability or system coverage | `docs/DESIGN_SYSTEM_AUDIT.md` | Verify status against `components/index.ts` |
| Version upgrade | `CHANGELOG.md` | Installed `package.json`, current types |

Run the library showcase with `npm ci && npm run dev` in a source checkout. Default port is 18309; sections include `/#foundation`, `/#typography`, `/#brand`, `/#motion` and `/#startup`. Do not assume another project's server or local filesystem layout.

For host pages, keep product-specific drafts in the host project. The library's `preview/` demonstrates reusable behavior, not business APIs. Labels such as “candidate” or “preview” in motion docs identify experiments; check whether the behavior is actually exported before integrating it.
