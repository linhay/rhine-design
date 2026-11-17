# Integration and diagnosis

## Install and verify

The checked-out package identifies itself as `@linhey/rhine-design` 0.14.0. Its npm scope differs from the `linhay/rhine-design` GitHub repository owner. Verify the installed manifest and lockfile before using its API. Use an exact version verified in the registry, or install a fixed local tarball and record its checksum when testing this checkout. A working tree can contain changes beyond a release with the same version number. The repository README targets 0.14.0; confirm registry availability before installing that version.

The manifest declares React and React DOM `^19.0.0`, and Node `^22.12.0 || ^24.0.0 || >=26.0.0`. Node 24 is the development baseline. The package ships TS/TSX, CSS and assets for a bundler. Use Vite for the verified build path. SSR, other bundlers and direct Node execution of the component entry need their own verification.

Copy the entire `skills/rhine-design/` directory from the actual installed package to the host's project Skill directory, `.agents/skills/rhine-design/` for Codex. Follow the same package's `README.md` installation procedure and preserve local customizations when updating an existing copy. Check the copied files and internal links, then run the host's relevant typecheck or production build with a minimal import. Confirm Skill discovery separately from copying.

In the library checkout, `npm test -- tests/SkillInstallation.test.tsx` checks both portable and project-directory copies. Set `RHINE_SKILL_SOURCE` to the installed package's `skills/rhine-design` directory to apply the same checks to files from a real tarball install.

## Public package entries

Append these subpaths to `@linhey/rhine-design` as shown in its `package.json` exports. Read docs and contracts as files relative to the installed package root.

| Entry | Use |
| --- | --- |
| Package root | Components and public types from `components/index.ts`. Imports base component CSS automatically. |
| `/theme` | `ThemeProvider`, `useTheme`, `themes`, `ThemeName` and `ThemeProviderProps`. Loads base and built-in theme CSS. |
| `/tokens.css`, `/styles.css` | Tokens or the whole base stylesheet for explicit CSS imports. The base stylesheet already includes tokens. |
| `/theme-arknights.css`, `/theme-neo-brutalism.css`, `/theme-neutral.css`, `/theme-graphite.css` | Opt-in styles for a handwritten theme root. Load base CSS before the chosen theme stylesheet. |
| `/logo.svg` | Shared SVG asset. The root `Logo` component uses the shared geometry. |
| `/review` | Review catalog/state APIs such as `defineReview`. See `docs/REVIEW_TOOL.md`. |
| `/review/vite` | Node ESM Vite entry with `reviewPlugin` and `reviewProductionGuard`, with types for configuration imports. Use a separate review build and keep its fixtures out of production. |

For a page using the default theme, the component entry plus a `.rhine-theme` root is sufficient.

```tsx
import { Button, Surface, Text } from '@linhey/rhine-design';

export function Example() {
  return (
    <div className="rhine-theme">
      <Surface>
        <Text as="h2" variant="section">工作空间</Text>
        <Button onClick={() => { /* host action */ }}>继续</Button>
      </Surface>
    </div>
  );
}
```

## Theme, density and backgrounds

- The `/theme` entry renders `div.rhine-theme` with `data-rhine-theme`. Built-in names are `rhine`, `arknights`, `neo-brutalism`, `neutral` and `graphite`. Use `themes` for stable names and display labels, and `ThemePicker` from the root entry for a controlled selection UI. For handwritten roots, use `.rhine-theme` and `data-rhine-theme` with the matching stylesheet. Gallery decoration is kept in the preview.
- Use `defaultTheme` for provider state, or `theme` and `onThemeChange` for host state. `useTheme().setTheme()` requests a change in controlled mode, so the host must pass the new value back. The host owns storage and URL preferences. Use sibling providers for independent regions. Nesting providers throws, and keying a subtree by theme remounts it. Supported names are style presets. Logo color is an independent `Logo.theme` choice. See `docs/THEMING.md` and `docs/THEME_PICKER.md`.
- `ConfigProvider` and `useConfig` from the root entry scope `regular` or `compact` density. The setting reaches supported portaled controls and does not choose a theme. See the density scope and affected controls in `components/PROVIDED_COMPONENTS.md`.
- `Background` paints `canvas`, `content`, `sidebar`, `surface`, `overlay` or `media` without creating a theme root. With the default `decoration="auto"`, only canvas uses the theme texture. `appearance` applies local paint overrides. Use an overlay component for interaction, and theme-root scene tokens for shared paint including portaled surfaces. See `docs/THEMING.md` and `docs/APPLICATION_COMPONENTS.md`.

## Diagnose a build or layout issue

- If styles disappear in production, check that the actual package entry and CSS files retain their `sideEffects` declarations. Verify the built CSS with a root-only import before adding consumer overrides.
- If an overlay is clipped or uses the wrong theme, inspect where it portals. It uses the nearest `.rhine-theme` to inherit the tokens and reduced-motion setting. Keep the theme root free of transform, clipping and CSS containment.
- If a linked checkout reports an invalid hook call, confirm React and React DOM resolve to the host's instances. In Vite, use `resolve.dedupe: ['react', 'react-dom']` for the linked packages.
- If the logo is missing from a production build, keep SVG `?no-inline` handling and check the emitted asset and its symbol references. The `Logo` component uses the same SVG geometry across variants.

## Host responsibilities

Pass controlled form values, data, sorting/pagination intentions and operation results through the documented APIs. The host owns network requests, debouncing, cancellation and stale-response protection. Respect the control's input composition handling when synchronizing a query or submitting a form. Do not replace server filtering with an unrequested full-data download.

Await actual copy/confirm outcomes. Errors remain actionable; busy state preserves meaningful focus. Inspect overlay focus return, Escape and keyboard navigation in the browser when changing those interactions. Progress with unknown duration is indeterminate; startup animation ends when the host is ready rather than imposing a decorative delay.

## Upgrade and feedback

Check the installed package's version and provenance against the copied Skill, then consult its `CHANGELOG.md`. Use the installed types and implementation to settle API discrepancies. Refresh the copied Skill with the package and repair stale references when in scope.

Follow [continuous design feedback](../SKILL.md#continuous-design-feedback) for project specifications, preferences, details, successful practices and validation findings, even without a missing component. Sanitize search terms and all outbound metadata before checking open/closed issues. Under current user/project feedback authorization, submit new information directly to `linhay/rhine-design` without repeated confirmation, read back the result and retain the URL; copying this skill alone grants no posting authorization. Record scope, basis, actual version (or unknown/N/A) and safe evidence; keep private product artifacts local. For verified capability gaps also apply [gap-specific requirements](../SKILL.md#report-missing-components-and-styles). Later related tasks should check adoption and consumer validation separately from issue closure.

## 设置工作区选型

短任务使用自然高度 Dialog。多栏目设置或编辑使用 `height`、`footer`、`navigation` 组合，由宿主持有跨栏目草稿。`navigation` 和 `sidePanel` 互斥。`footer` 直接传按钮或 Fragment。验收短屏的正文空间、44px 操作目标和末项可达，以及加载、空态或错误时的外框稳定性。标题与操作区保持可达，正文与长导航各自滚动。窄导航修复是否可用，以固定候选或实际安装的制品为准，接入时查 `docs/SETTINGS_DIALOG.md`。
