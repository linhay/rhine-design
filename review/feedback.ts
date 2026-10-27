export interface ReviewFeedback {
  id: number;
  scene: string;
  message: string;
  kind: 'info' | 'error';
}
export interface ReviewFeedbackLog {
  entries: ReviewFeedback[];
  errors: number;
  omittedErrors: number;
}
export const emptyFeedback = (): ReviewFeedbackLog => ({ entries: [], errors: 0, omittedErrors: 0 });
export function appendFeedback(log: ReviewFeedbackLog, entry: ReviewFeedback): ReviewFeedbackLog {
  const entries = [...log.entries, { ...entry, message: entry.message.slice(0, 2000) }];
  const omitted = entries.splice(0, Math.max(0, entries.length - 20));
  return { entries, errors: log.errors + Number(entry.kind === 'error'), omittedErrors: log.omittedErrors + omitted.filter(item => item.kind === 'error').length };
}
