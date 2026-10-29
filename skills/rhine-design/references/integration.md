# Integration and diagnosis

## Supported baseline

Rhine Design 0.10.0 ships TypeScript/TSX, CSS and SVG source for React 19 + Vite. Install `@linhey/rhine-design`; GitHub remains `linhay/rhine-design`. Check the installed package's engine and peer dependencies. Node 24 is the development baseline. Do not assume precompiled JavaScript, arbitrary SSR support or a complete dark theme.

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

## Integration invariants

Version 0.4.0 also exports `ThemeProvider`, `useTheme`, `themes`, `ThemeName` and `ThemeProviderProps` from `@linhey/rhine-design/theme` (not in npm 0.3.0). Read `docs/THEMING.md` from the verified package root. For a standalone skill installation without the package, see [the theme contract snapshot](https://github.com/linhay/rhine-design/blob/cfcb400fa213d9905eae1cab5dcb8ab8f817e03f/docs/THEMING.md) at commit `cfcb400fa213d9905eae1cab5dcb8ab8f817e03f` (0.10.0 source baseline). This fixed snapshot does not track main or establish availability in another installed version; prefer that version's own contract and implementation. This entry loads base and built-in theme CSS and renders the `.rhine-theme` root. Use `defaultTheme` for local state, or `theme` with `onThemeChange` for host state; storage and URL preferences remain with the host. Sibling providers are supported; nested providers throw. Do not wrap it in another themed root or key the subtree by theme. Gallery decoration is excluded from the public theme CSS.

Version 0.5.0 adds `Background` with canvas/content/sidebar/surface/overlay/media roles. `decoration="auto"` is the default: only canvas uses theme texture; content and AppShell default to plain backgrounds. Use `appearance` for local color/text/texture/size overrides and theme-root scene tokens for shared configuration. Background is paint only, not a new theme root or modal. Preview `#backgrounds` shows only the selected theme and follows the theme picker. Check installed exports before adopting this API; it is not in npm 0.4.0.

- The entry imports CSS automatically. Keep the package's entry and CSS `sideEffects` declarations so production tree shaking retains styles.
- Put `.rhine-theme` at the page root. Do not transform, clip or apply containment to it: overlays portal to the nearest theme root and need its variables and reduced-motion settings.
- For a locally linked checkout, use Vite `resolve.dedupe: ['react', 'react-dom']`. Duplicate React can break hooks; do not patch component state to mask this.
- Preserve SVG `?no-inline` handling. Logo uses a shared geometric master; missing symbols in production warrant checking the emitted SVG asset before replacing the logo.
- Reuse tokens for layout and state styling. The arknights preset uses a dark palette; a general light/dark/system color-mode API is not provided. Logo color remains independent of the component theme.

## Host responsibilities

Pass controlled form values, data, sorting/pagination intentions and operation results through the documented APIs. The host owns network requests, debouncing, IME composition, cancellation and stale-response protection. Do not replace server filtering with an unrequested full-data download.

Await actual copy/confirm outcomes. Errors remain actionable; busy state preserves meaningful focus. Inspect overlay focus return, Escape and keyboard navigation in the browser when changing those interactions. Progress with unknown duration is indeterminate; startup animation ends when the host is ready rather than imposing a decorative delay.

## Upgrade and feedback

Check the installed version against this skill's metadata, then consult `CHANGELOG.md`. Refresh the copied skill together with the package; keep local customizations when comparing versions. If types and docs disagree, use source for the immediate API and repair the stale reference when in scope.

Follow [continuous design feedback](../SKILL.md#continuous-design-feedback) for project specifications, preferences, details, successful practices and validation findings, even without a missing component. Check open/closed issues, submit new information directly to `linhay/rhine-design` without repeated confirmation, read back the result and retain the URL. Record scope, basis, actual version (or unknown/N/A) and safe evidence; keep private product artifacts local. For verified capability gaps also apply [gap-specific requirements](../SKILL.md#report-missing-components-and-styles). Later related tasks should check adoption and consumer validation separately from issue closure.

## 设置工作区选型

短任务使用自然高度 Dialog。多栏目设置/编辑优先组合 `height`、`footer`、`navigation`，由宿主指定期望高度并持有跨栏目草稿。footer 直接传按钮或 Fragment；description 仅提供决策所需说明。空态、增删行、加载和错误应保持外框稳定；标题/关闭和操作区固定、正文与长导航分别滚动，不添加 wheel 转发。验收短屏正文的实际操作空间、44px目标和末项可达，不只看外框或正文非零。窄导航轨道修复为未发布源码能力，固定候选消费后才删除适配，见源码/安装包中的 `docs/SETTINGS_DIALOG.md`。
