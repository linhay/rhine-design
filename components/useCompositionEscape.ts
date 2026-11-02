import { useLayoutEffect, type RefObject } from 'react';

/** Let the IME own Escape before Radix's document-capture dismissal runs. */
export function useCompositionEscape(scope: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const view = (scope.current?.ownerDocument ?? document).defaultView;
    if (!view) return;
    let composingTarget: EventTarget | null = null;
    const owns = (target: EventTarget | null) => target instanceof Node && !!scope.current?.contains(target);
    const start = (event: CompositionEvent) => { if (owns(event.target)) composingTarget = event.target; };
    const end = (event: Event) => { if (event.target === event.currentTarget || event.target === composingTarget) composingTarget = null; };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !owns(event.target)) return;
      if (event.isComposing || event.keyCode === 229 || composingTarget === event.target) {
        // Do not preventDefault: the browser/IME must still cancel its candidate.
        event.stopImmediatePropagation();
      }
    };
    view.addEventListener('compositionstart', start, true);
    view.addEventListener('compositionend', end, true);
    view.addEventListener('blur', end, true);
    view.addEventListener('keydown', escape, true);
    return () => {
      view.removeEventListener('compositionstart', start, true);
      view.removeEventListener('compositionend', end, true);
      view.removeEventListener('blur', end, true);
      view.removeEventListener('keydown', escape, true);
    };
  }, [scope]);
}
