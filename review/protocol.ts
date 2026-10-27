export const protocol = 'rhine-review/2';
export function isReviewMessage(event: MessageEvent, source: Window | null): boolean {
  return event.origin === location.origin && event.source === source && event.data?.protocol === protocol;
}
export function sendReview(target: Window, data: Record<string, unknown>) {
  target.postMessage({ ...data, protocol }, location.origin);
}
