// Synthetic host data only. Nothing in this file is a public permission or delivery API.
export type Member = 'alpha' | 'beta';
export type Identity = Member | 'admin';
export type EventKind = 'changed' | 'completed';
export type Operation = 'catalog' | 'save' | 'enable' | 'preview' | 'delivery-read';
export type Transport = (operation: Operation, signal: AbortSignal) => Promise<void>;
export interface Access { objects: string[]; channels: string[]; revision: number }
export interface Draft { event: EventKind; condition: string; objects: string[]; channel: string }
export interface Rule { id: string; title: string; draft: Draft; saved: Draft; enabled: boolean; review: boolean; revision: number }

export const identities = { alpha: '成员甲', beta: '成员乙', admin: '管理员' };
export const events = { changed: '资源内容变更', completed: '任务完成' };
export const objects = [
  { value: 'A', label: '资源 A', detail: '合成研究资料 A' },
  { value: 'B', label: '资源 B', detail: '合成设计资料 B' },
  { value: 'C', label: '资源 C', detail: '合成成员乙资料 C' },
  { value: 'D', label: '资源 D', detail: '合成共享资料 D' },
];
export const channels = [
  { value: 'personal', label: '个人通知箱', audience: '仅当前成员可查看', message: '可查看已授权的对象详情。' },
  { value: 'group', label: '协作群 · 点名提醒', audience: '群内所有成员可能看到；点名不是私信', message: '受众权限未验证：本例只发通用提醒，登录后按权限查看详情。' },
];
export const accessFor = (member: Member): Access => ({ objects: member === 'alpha' ? ['A', 'B', 'D'] : ['C', 'D'], channels: member === 'alpha' ? ['personal', 'group'] : ['personal'], revision: 1 });
export function initialRules(member: Member): Rule[] {
  const access = accessFor(member);
  return ['变更提醒', '完成提醒'].map((title, index) => {
    const draft: Draft = { event: index ? 'completed' : 'changed', condition: '所有变更', objects: index ? [access.objects[1]] : access.objects.slice(0, 2), channel: access.channels[0] };
    return { id: String(index + 1), title: `${identities[member]} · ${title}`, draft, saved: structuredClone(draft), enabled: false, review: false, revision: 1 };
  });
}
export function permitted(draft: Draft, access: Access): Draft {
  return { ...draft, objects: draft.objects.filter(id => access.objects.includes(id)), channel: access.channels.includes(draft.channel) ? draft.channel : '' };
}
export const sameDraft = (a: Draft, b: Draft) => a.event === b.event && a.condition === b.condition && a.channel === b.channel && a.objects.join() === b.objects.join();
export function restrictRule(rule: Rule, access: Access): Rule {
  const draft = permitted(rule.draft, access), saved = permitted(rule.saved, access);
  const lost = !sameDraft(draft, rule.draft) || !sameDraft(saved, rule.saved);
  return { ...rule, draft, saved, enabled: lost ? false : rule.enabled, review: rule.review || lost };
}
export function syntheticTransport(conflict = false, readFailure = false): Transport {
  return (operation, signal) => new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new DOMException('Cancelled', 'AbortError')); };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      if (operation === 'save' && conflict) reject(new Error('保存冲突：服务版本已变化。草稿保留，请核对后重新保存。'));
      else if (operation === 'delivery-read' && readFailure) reject(new Error('读取失败，投递结果仍未知。'));
      else resolve();
    }, operation === 'catalog' ? 450 : 650);
    if (signal.aborted) abort(); else signal.addEventListener('abort', abort, { once: true });
  });
}
