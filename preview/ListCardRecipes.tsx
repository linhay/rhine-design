import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge, Button, Checkbox, Dialog, EmptyState, Inline, Notice, Select, Skeleton, Stack, Surface, Tabs, Text } from '../components';
import { ThemeProvider, type ThemeName } from '../components/theme';
import './list-card-recipes.css';

export const accessKinds = [{ value: 'all', label: '全部' }, { value: 'oauth', label: 'OAuth' }, { value: 'key', label: 'API Key' }];
export const ownershipLabels = ['研究组', '设计组', '合成团队 A', '共享资源', '长期验证', '跨区域协作', '只读成员', '跨部门联合研究与长期设计验证团队 Synthetic ownership label with complete unabridged identity'];

/** Read-only ownership, not an interactive tag input. Layout uses public Inline.style. */
export function OwnershipLabels({ labels = ownershipLabels }: { labels?: string[] }) {
  if (!labels.length) return <Text tone="muted">暂无归属分组</Text>;
  return <Inline gap={2} className="rhine-recipe-labels" role="region" aria-label="归属分组（可左右滚动查看完整标签）" tabIndex={0}
    style={{ flexWrap: 'nowrap', overflowX: 'auto', maxWidth: '100%', padding: 'var(--rhine-space-1)' }}>
    {labels.map(label => <span key={label} style={{ flex: '0 0 auto', whiteSpace: 'nowrap' }}><Badge>{label}</Badge></span>)}
  </Inline>;
}

export function CompactDates() {
  const dates = [['更新 14:32', '数据更新：2026-10-30 14:32 上海时间'], ['账号 11/8', '账号到期：2026-11-08 18:00 上海时间'], ['订阅 2027/1/9', '订阅到期：2027-01-09 09:00 上海时间']];
  return <Inline gap={2} data-compact-dates>
    {dates.map(([short, full]) => <Text key={full} variant="caption" tone="muted" title={full} aria-label={full}>{short}</Text>)}
    <Dialog title="完整时间" trigger={<Button variant="quiet" aria-label="查看完整日期与时间">?</Button>}>
      <Stack gap={3}>{dates.map(([, full]) => <Text key={full}>{full}</Text>)}<Text>未知时间显示“未知”；过期状态单独标明。摘要不合并两种到期语义。</Text></Stack>
    </Dialog>
  </Inline>;
}

export function ResourceCard({ kind, long = false, emptyLabels = false }: { kind: string; long?: boolean; emptyLabels?: boolean }) {
  return <Surface className="rhine-recipe-card"><Stack gap={3}>
    <Text as="h3" variant="heading">{long ? '跨区域联合研究与长期设计验证资源 Synthetic resource with a complete identity' : `合成资源 · ${kind === 'key' ? 'API Key' : 'OAuth'}`}</Text>
    <OwnershipLabels labels={emptyLabels ? [] : ownershipLabels} />
    <Text>可用额度：{kind === 'key' ? '不提供额度' : '128.00 USD'}</Text>
    <CompactDates />
    <Dialog title="资源详情" trigger={<Button variant="secondary">查看资源详情</Button>}><Text>合成只读记录；不更改权限或业务数据。</Text></Dialog>
  </Stack></Surface>;
}

function ResourceResult({ kind, ready, scenario, long }: { kind: string; ready: boolean; scenario: string; long: boolean }) {
  return <div style={{ clear: 'both' }} data-result-kind={kind}>
    {scenario === 'error' ? <Notice tone="error" title="无法读取此分类">合成读取失败；可切换场景重新读取。</Notice>
      : scenario === 'empty' ? <EmptyState title="此分类暂无资源" description="这是已完成读取后的有效空结果。" />
      : !ready || scenario === 'loading' ? <Skeleton label={`正在读取 ${kind} 资源`} lines={5} />
      : <ResourceCard kind={kind} long={long} emptyLabels={scenario === 'no-labels'} />}
  </div>;
}

export function ListCardRecipes() {
  const [selected, setSelected] = useState('all');
  const [bulk, setBulk] = useState(true), [keyAllowed, setKeyAllowed] = useState(true), [long, setLong] = useState(false);
  const [scenario, setScenario] = useState('normal');
  const [readyScope, setReadyScope] = useState<string | null>(null);
  const scope = `${selected}:${scenario}`;
  const ready = readyScope === scope && ['normal', 'no-labels'].includes(scenario);
  const list = useRef<HTMLDivElement>(null), bulkNode = useRef<HTMLDivElement | null>(null);
  const bindBulk = useCallback((node: HTMLDivElement | null) => {
    if (!node && bulkNode.current?.contains(document.activeElement)) {
      list.current?.querySelector<HTMLButtonElement>('[role=tab][aria-selected=true]')?.focus();
    }
    bulkNode.current = node;
  }, []);
  useEffect(() => {
    setReadyScope(null);
    const controller = new AbortController();
    const timer = setTimeout(() => { if (!controller.signal.aborted) setReadyScope(scope); }, 450);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [scope]);
  const select = (value: string) => { if (value === selected) return; setReadyScope(null); setSelected(value); };
  const kinds = accessKinds.filter(item => keyAllowed || item.value !== 'key');
  return <Stack gap={4}>
    <Text as="h2" variant="section">列表分类与只读归属</Text>
    <Text tone="muted">合成配方：分类属于结果，批量动作独立；归属标签单行原生滚动。这些是局部组合偏好。</Text>
    <Inline gap={3}>
      <Checkbox label="有批量权限" checked={bulk} onChange={e => setBulk(e.target.checked)} />
      <Checkbox label="可查看 API Key" checked={keyAllowed} onChange={e => { setKeyAllowed(e.target.checked); if (!e.target.checked && selected === 'key') select('all'); }} />
      <Checkbox label="长资源名称" checked={long} onChange={e => setLong(e.target.checked)} />
      <Select label="列表配方状态" value={scenario} onChange={e => { setReadyScope(null); setScenario(e.target.value); }}>{[['normal', '正常'], ['loading', '首次读取'], ['error', '读取失败'], ['empty', '有效空结果'], ['no-labels', '无归属标签']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
    </Inline>
    <div ref={list} className="rhine-recipe-list" data-list-recipe>
      {bulk && ready && <div ref={bindBulk} className="rhine-recipe-bulk"><Dialog title="批量设置（合成）" trigger={<Button variant="secondary">批量设置</Button>}><Text>批量动作不改变当前分类。实际权限和保存结果由宿主负责。</Text></Dialog></div>}
      <Tabs label="接入方式" value={selected} onValueChange={select} items={kinds.map(item => ({ ...item, content: <ResourceResult kind={item.value} ready={ready && selected === item.value} scenario={scenario} long={long} /> }))} />
    </div>
  </Stack>;
}

export function ListCardRecipesFixture() {
  const params = new URLSearchParams(location.search);
  return <ThemeProvider defaultTheme={(params.get('theme') || 'rhine') as ThemeName} data-rhine-motion={params.get('motion') === 'manual' ? 'reduced' : 'system'}>
    <main style={{ padding: 16 }}><ListCardRecipes /></main>
  </ThemeProvider>;
}
