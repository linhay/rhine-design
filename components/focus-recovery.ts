import { useLayoutEffect, useRef, type FocusEvent, type RefObject } from 'react';

function available(node: HTMLElement | null | undefined): node is HTMLElement {
  if (!node?.isConnected || node.matches(':disabled,[aria-disabled="true"]') || node.closest('[hidden],[inert],[aria-hidden="true"]')) return false;
  for (let parent: HTMLElement | null = node; parent; parent = parent.parentElement) {
    const style = parent.ownerDocument.defaultView?.getComputedStyle(parent);
    if (style?.display === 'none' || style?.visibility === 'hidden') return false;
  }
  return true;
}

function focusContext(node: HTMLElement) {
  const temporary = !node.hasAttribute('tabindex') && node.tabIndex < 0;
  if (temporary) node.setAttribute('tabindex', '-1');
  node.focus({ preventScroll: true });
  if (temporary) {
    if (node.ownerDocument.activeElement !== node) node.removeAttribute('tabindex');
    else node.addEventListener('blur', () => { if (node.getAttribute('tabindex') === '-1') node.removeAttribute('tabindex'); }, { once: true });
  }
}

/** Local, one-shot recovery for accepted dismissals. No document focus manager or delayed intent. */
export function useDismissFocus(root: RefObject<HTMLElement | null>, {
  open = true,
  origin = root,
  peerSelector,
}: {
  open?: boolean;
  origin?: RefObject<HTMLElement | null>;
  peerSelector?: string;
} = {}) {
  const previous = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (!open) return;
    const doc = root.current?.ownerDocument ?? origin.current?.ownerDocument;
    const active = doc?.activeElement;
    if (active instanceof HTMLElement && active !== doc?.body && active !== doc?.documentElement && !root.current?.contains(active) && available(active)) previous.current = active;
  }, [open, origin, root]);

  const onFocusCapture = (event: FocusEvent<HTMLElement>) => {
    const from = event.relatedTarget;
    if (from instanceof HTMLElement && from !== from.ownerDocument.body && !event.currentTarget.contains(from) && available(from)) previous.current = from;
  };

  const dismiss = (trigger: HTMLElement, action: () => void) => {
    const doc = trigger.ownerDocument;
    const hadFocus = trigger.contains(doc.activeElement);
    const owned = root.current;
    const originNode = origin.current ?? owned;
    const parent = originNode?.parentElement;
    const context = parent?.closest<HTMLElement>('main,[role="group"],[role="region"],[role="dialog"],[tabindex]');
    const peers = peerSelector && parent ? [...parent.querySelectorAll<HTMLElement>(peerSelector)].filter(node => !owned?.contains(node)) : [];
    const following = peers.filter(node => originNode && originNode.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING);
    const preceding = peers.filter(node => originNode && originNode.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING).reverse();
    const targets = [...following, ...preceding, previous.current, context];
    action();
    queueMicrotask(() => {
      // Rejection or asynchronous acceptance is the host's responsibility. Never replay an old intent.
      if (!hadFocus || trigger.isConnected) return;
      const active = doc.activeElement;
      if (active && active !== doc.body && active !== doc.documentElement && !active.hasAttribute('data-radix-focus-guard')) return;
      const target = targets.find(node => available(node) && node.ownerDocument === doc);
      if (target) focusContext(target);
    });
  };
  return { onFocusCapture, dismiss };
}
