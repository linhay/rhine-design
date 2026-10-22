# Integration and diagnosis

## Supported baseline

Rhine Design 0.3.0 ships TypeScript/TSX, CSS and SVG source for React 19 + Vite. Install `@linhey/rhine-design`; GitHub remains `linhay/rhine-design`. Check the installed package's engine and peer dependencies. Node 24 is the development baseline. Do not assume precompiled JavaScript, arbitrary SSR support or a complete dark theme.

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

- The entry imports CSS automatically. Keep the package's entry and CSS `sideEffects` declarations so production tree shaking retains styles.
- Put `.rhine-theme` at the page root. Do not transform, clip or apply containment to it: overlays portal to the nearest theme root and need its variables and reduced-motion settings.
- For a locally linked checkout, use Vite `resolve.dedupe: ['react', 'react-dom']`. Duplicate React can break hooks; do not patch component state to mask this.
- Preserve SVG `?no-inline` handling. Logo uses a shared geometric master; missing symbols in production warrant checking the emitted SVG asset before replacing the logo.
- Reuse tokens for layout and state styling. Full dark theme is not exported in 0.3.0; the logo's dark variant alone does not establish dark-mode support.

## Host responsibilities

Pass controlled form values, data, sorting/pagination intentions and operation results through the documented APIs. The host owns network requests, debouncing, IME composition, cancellation and stale-response protection. Do not replace server filtering with an unrequested full-data download.

Await actual copy/confirm outcomes. Errors remain actionable; busy state preserves meaningful focus. Inspect overlay focus return, Escape and keyboard navigation in the browser when changing those interactions. Progress with unknown duration is indeterminate; startup animation ends when the host is ready rather than imposing a decorative delay.

## Upgrade and feedback

Check the installed version against this skill's metadata, then consult `CHANGELOG.md`. Refresh the copied skill together with the package; keep local customizations when comparing versions. If types and docs disagree, use source for the immediate API and repair the stale reference when in scope.

For reproducible feedback record package version, component/API, relevant source or reference path, expected and actual behavior, and the smallest reproduction. Public reports need no private host payloads or credentials. Filing an external issue remains a user-directed action.
