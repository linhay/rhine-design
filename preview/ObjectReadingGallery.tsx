import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Breadcrumbs, Button, Dialog, EmptyState, Inline, KeyValue, ListFilterBar, Notice, Select, Skeleton, Stack, Surface, Tabs, Text } from '../components';
import { ThemeProvider, type ThemeName } from '../components/theme';
import './object-reading.css';

type ReadingTab = 'content' | 'source' | 'related';
type Scenario = 'ready' | 'loading' | 'error' | 'restricted' | 'unsupported' | 'source-unavailable' | 'no-related' | 'related-unavailable';
interface ReadingObject { id: string; title: string; type: 'note' | 'file'; owner: string; revision: string }
const objects: ReadingObject[] = [
  { id: 'field-note', title: '河谷观察笔记：跨季节采样、长期维护与共享资料的整理方法', type: 'note', owner: '个人空间', revision: '笔记版本 3' },
  { id: 'shared-file', title: '共享文件：河谷生态观察与协作记录说明.txt', type: 'file', owner: '共享资料库', revision: '文件版本 2' },
];
const folderName = '河谷观察与跨季节长期资料整理';
const paragraphs = Array.from({ length: 18 }, (_, i) => `第 ${i + 1} 段 · 河谷观察记录。清晨的河面逐渐明亮，岸边的草木随着季节更替。本次整理保留每份记录的来源与版本，方便在后续阅读时核对背景。资料中的观察、推测与待确认内容分别记录，避免把暂时的判断当作最终结论。`);
const scenarioLabels: Record<Scenario, string> = { ready: '正常阅读', loading: '正文加载中', error: '正文加载失败', restricted: '正文受限', unsupported: '格式不可预览', 'source-unavailable': '来源不可用', 'no-related': '暂无关联', 'related-unavailable': '关联不可用' };

// Per-object state belongs to this synthetic host, never to Dialog or a data service.
function ObjectReader({ object, scenario, tab, onTab, positions, navigate, retry }: {
  object: ReadingObject; scenario: Scenario; tab: ReadingTab; onTab: (tab: ReadingTab) => void;
  positions: Partial<Record<ReadingTab, number>>; navigate: (target: string) => void; retry: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    // Ordinary Dialog owns scrolling. Use its public ARIA role, not private CSS.
    const dialog = root.current?.closest<HTMLElement>('[role="dialog"]');
    if (!dialog) return;
    const top = positions[tab] ?? 0;
    const frame = requestAnimationFrame(() => { dialog.scrollTop = top; dialog.addEventListener('scroll', remember); });
    function remember() { positions[tab] = dialog!.scrollTop; }
    return () => { cancelAnimationFrame(frame); dialog.removeEventListener('scroll', remember); };
  }, [positions, tab]);
  const content = scenario === 'loading' ? <Skeleton label="正在加载正文" />
    : scenario === 'error' ? <Notice tone="error" title="正文加载失败" action={<Button onClick={retry}>重试正文</Button>}>元信息仍可查看，也可以关闭后返回目录。</Notice>
    : scenario === 'restricted' ? <Notice title="正文受限">当前仅可查看元信息。归属共享资料库不代表拥有正文权限。</Notice>
    : scenario === 'unsupported' ? <Notice title="格式不可预览">已保留对象信息；请返回目录选择其他文件。</Notice>
    : <Stack gap={4}><Text as="h3" variant="heading">观察正文</Text>{paragraphs.map((text, i) => <Text key={i}>{text}</Text>)}<Text data-testid="reading-end">正文末段 · 本次阅读到此结束。</Text><Button variant="secondary" onClick={() => { onTab('related'); root.current?.querySelector<HTMLElement>('[role="tab"][aria-label="关联"]')?.focus({ preventScroll: true }); }}>查看关联</Button></Stack>;
  return <div ref={root} className="rhine-reading-content"><Stack gap={4}>
    <KeyValue items={[
      { key: 'owner', label: '归属', value: object.owner },
      { key: 'access', label: '访问权限', value: scenario === 'restricted' ? '仅元信息' : '可阅读' },
      { key: 'revision', label: '当前版本', value: object.revision },
    ]} />
    <Tabs label="对象阅读" value={tab} onValueChange={value => onTab(value as ReadingTab)} items={[
      { value: 'content', label: '正文', content },
      { value: 'source', label: '来源', content: scenario === 'source-unavailable' || scenario === 'restricted'
        ? <Notice title="来源不可用">来源已失效或当前不可访问。此处不提供原文入口。</Notice>
        : <Stack gap={4}><Text as="h3" variant="heading">来源与版本</Text><Text>合成资料 / {folderName} / {object.title}</Text><Text>{object.revision} · 2026-10-28</Text><Text>此内容为展台内的合成快照，没有外部原文链接。</Text></Stack> },
      { value: 'related', label: '关联', content: scenario === 'no-related' ? <EmptyState title="暂无关联" description="尚未关联目标或对话。" />
        : scenario === 'related-unavailable' || scenario === 'restricted' ? <Notice title="关联不可用">关联对象已失效或当前不可访问，无法跳转。</Notice>
        : <Stack gap={3}><Text>跳转后可返回此对象；内容和收件状态保持原样。</Text><Button variant="secondary" onClick={() => navigate('目标：河谷资料整理')}>打开关联目标</Button><Button variant="secondary" onClick={() => navigate('对话：河谷观察讨论')}>打开关联对话</Button></Stack> },
    ]} />
  </Stack></div>;
}

export function ObjectReadingGallery() {
  const [folder, setFolder] = useState('research'), [query, setQuery] = useState(''), [type, setType] = useState('all');
  const [scenario, setScenario] = useState<Scenario>('ready');
  const [selected, setSelected] = useState<string | null>(null), [open, setOpen] = useState(false);
  const [destination, setDestination] = useState<string | null>(null);
  const [tabs, setTabs] = useState<Record<string, ReadingTab>>({});
  const positions = useRef<Record<string, Partial<Record<ReadingTab, number>>>>({});
  const pendingNavigation = useRef<string | null>(null);
  const triggers = useRef(new Map<string, HTMLButtonElement>());
  const heading = useRef<HTMLHeadingElement>(null);
  const returning = useRef(false);
  useEffect(() => {
    if (destination) heading.current?.focus();
    else if (returning.current) { returning.current = false; if (selected) triggers.current.get(selected)?.focus(); }
  }, [destination, selected]);
  const rows = folder === 'empty' ? [] : objects.filter(object => (type === 'all' || object.type === type) && object.title.includes(query.trim()));
  const reset = () => { setQuery(''); setType('all'); };
  return <Stack gap={4} className="rhine-object-reading">
    <Text as="h2" variant="section">个人工作空间 · 对象阅读</Text>
    <Text tone="muted">合成文件与笔记，阅读不会修改内容或消息已读状态。</Text>
    <div hidden={destination !== null}>
      <Stack gap={4}>
        <Select label="阅读场景" value={scenario} onChange={event => setScenario(event.target.value as Scenario)}>{Object.entries(scenarioLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
        <Select label="目录" value={folder} onChange={event => setFolder(event.target.value)}><option value="research">{folderName}</option><option value="empty">待整理（空目录）</option></Select>
        <Breadcrumbs label="目录路径" items={[{ label: '个人工作空间' }, { label: '合成资料' }, { label: folder === 'empty' ? '待整理' : folderName }]} />
        <ListFilterBar label="查找文件与笔记" search={{ label: '搜索名称', value: query, onChange: event => setQuery(event.target.value) }} primary={[{ id: 'type', label: '类型', activeLabel: type === 'all' ? undefined : type === 'note' ? '笔记' : '文件', onClear: () => setType('all'), control: <Select label="类型" value={type} onChange={event => setType(event.target.value)}><option value="all">全部类型</option><option value="note">笔记</option><option value="file">文件</option></Select> }]} onReset={reset} result={`${rows.length} 个对象`} />
        {folder === 'empty' ? <EmptyState title="目录为空" description="此目录尚未添加资料。" action={<Button variant="secondary" onClick={() => setFolder('research')}>返回资料目录</Button>} />
          : !rows.length ? <EmptyState title="没有匹配结果" description="尝试其他名称或清除筛选。" action={<Button variant="secondary" onClick={reset}>清除筛选</Button>} />
          : <ul className="rhine-reading-list" aria-label="文件与笔记">{rows.map(object => {
            const savedPositions = positions.current[object.id] ??= {};
            return <li key={object.id}><Surface><Stack gap={3}>
              <Text>{object.type === 'note' ? '笔记' : '文件'} · {object.owner}</Text>
              <Dialog title={object.title} description="阅读快照；正文、来源与关联在同一窗口切换。" open={selected === object.id && open}
                onOpenChange={next => { if (next) setSelected(object.id); setOpen(next); }}
                onCloseAutoFocus={event => { if (pendingNavigation.current) { event.preventDefault(); setDestination(pendingNavigation.current); pendingNavigation.current = null; } }}
                trigger={<Button variant="secondary" onClick={event => triggers.current.set(object.id, event.currentTarget)} aria-label={`阅读：${object.title}`}>{object.title}</Button>}>
                <ObjectReader object={object} scenario={scenario} tab={tabs[object.id] ?? 'content'} onTab={tab => setTabs(current => ({ ...current, [object.id]: tab }))} positions={savedPositions}
                  navigate={target => { pendingNavigation.current = target; setOpen(false); }} retry={() => setScenario('ready')} />
              </Dialog>
              {selected === object.id && <Text variant="caption" tone="muted">上次阅读的对象</Text>}
            </Stack></Surface></li>;
          })}</ul>}
        <Text data-testid="reading-invariants">内容版本未修改 · 收件状态：未读</Text>
      </Stack>
    </div>
    {destination && <Surface><Stack gap={4}>
      <h3 ref={heading} tabIndex={-1}>{destination}</h3><Text>这是独立的合成关联页面。收件状态：未读。</Text>
      <Inline><Button onClick={() => { returning.current = true; setDestination(null); }}>返回工作空间</Button></Inline>
    </Stack></Surface>}
  </Stack>;
}

export function ObjectReadingFixture() {
  const params = new URLSearchParams(location.search);
  const zoom = Number(params.get('zoom')) || 1;
  const [motion, setMotion] = useState('system');
  useEffect(() => { document.documentElement.style.zoom = String(zoom); return () => { document.documentElement.style.zoom = ''; }; }, [zoom]);
  return <ThemeProvider theme={(params.get('theme') || 'rhine') as ThemeName} data-rhine-motion={motion}>
    <div className="rhine-reading-fixture"><Stack gap={4}><Select label="动态偏好" value={motion} onChange={event => setMotion(event.target.value)}><option value="system">跟随系统</option><option value="reduced">减少动态</option></Select><ObjectReadingGallery /></Stack></div>
  </ThemeProvider>;
}
