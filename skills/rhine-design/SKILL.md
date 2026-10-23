---
name: rhine-design
description: Use Rhine Design components and specifications to design, implement, or review React UI, typography, themes, and motion. Apply when a project uses Rhine Design or the user requests its visual language or component system.
metadata:
  version: "0.4.0"
---

# Rhine Design · 莱茵设计

Use the installed version's components and contracts to build consistent interfaces. This is an independently versioned, general design system; retain the host product's identity and data ownership.

## Locate the matching source

Package: `@linhey/rhine-design`. GitHub: `linhay/rhine-design` (different account spelling). This skill targets 0.4.0, including theme, navigation, form and timeline APIs. Never assume those APIs exist in an installed 0.3.0 package.

Find the package in the host's dependencies, normally `node_modules/@linhey/rhine-design/`, or its registered source checkout. Verify `package.json` name/version before using the paths below. Paths in references are relative to that package root, not the copied skill directory. Read installed types and source when versions differ; do not infer a new API from this skill. If the package is unavailable, use the task's supplied design sources and identify the missing implementation evidence.

## Route the task

- Screen design, interaction, typography, motion: start with [TASK_MAP.md](references/TASK_MAP.md), then read only the relevant contract.
- A named component or prop: use [API_MAP.md](references/API_MAP.md), then inspect its exported type and implementation.
- First integration, linking, theme or missing styles: read [integration.md](references/integration.md).

## Design before implementation

1. Identify the task, interruption cost, information lifetime and recovery path using `docs/INTERACTION_PATTERNS.md` when present. Choose navigation, form, notification or overlay patterns before styling. Inventory existing components and tokens for the requested behavior. Compose them before creating a new component or duplicating styles.
2. Update the host's page mockup or the library's real `preview/` showcase first. A new shared capability includes its contract and a usable example.
3. Verify the changed states and interaction in the preview; then integrate into the app when implementation is in scope. Continue both stages when already authorized; a design-only request does not authorize an app migration.
4. For library changes run `npm run check`; for visual changes inspect relevant widths (400/520/880), 200% zoom, keyboard/focus and reduced motion. For consumer changes run that project's checks. Documentation-only edits need link, example and version consistency checks, not an unrelated UI test campaign.

## Preserve these contracts

- Use public exports, the `.rhine-theme` root and existing tokens. Use the `rhine-` namespace for CSS variables, classes, animation names and motion data attributes; do not introduce host-product prefixes.
- Read the actual component signature before using it. Keep semantic headings separate from visual text variants.
- Host state determines data, selection and operation outcomes. Search and pagination remain host/server responsibilities; busy indicators never imply success.
- For multi-field failures, preserve input and focus a summary only after failed submission; links return to fields without changing routing. Use SideNav/Breadcrumbs/Steps only when exported by the installed source.
- Monitoring shows units, freshness and stale/unknown states; errors must not rely on color, flashing or transient toasts.
- Motion explains a change. Respect reduced motion, cancellation and replay; startup decoration never blocks real readiness. Preview-only experiments are not exported components.
- Keep independent release boundaries: do not change unrelated products or publish packages merely because this skill was invoked.
