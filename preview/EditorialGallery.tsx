import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Badge, Button, Checkbox, DataTable, Dialog, Disclosure, Inline, Metric, Notice, Popover, Select, Stack, Surface, Tabs, Text, Textarea, TrendChart, type TableSort } from '../components';
import { ThemeProvider } from '../components/theme';
import './editorial-layout.css';

type Palette = 'neutral' | 'swiss';
type RecordRow = { id: string; title: string; value: number | null; status: '已核对' | '待补充' | '读取失败' };
const configs = [
  { id: 'report', label: '研究报告', title: '把异常恢复放回完整的任务里', subtitle: '交互研究 / 阶段观察', unit: '份', measure: '有效样本',
    summary: '首轮记录覆盖检索、阅读与草稿修改。已观察到的问题与尚未验证的假设分开呈现，未知数据不计为零。',
    paragraphs: ['取消操作之后，人们需要回到刚才的记录，同时保留已经写下的内容。观察材料中，错误出现的位置与恢复入口是否靠近，是这轮需要继续核对的两个维度。', '以下数据为对照用合成资料，不来自真实参与者。长标题、单位和异常说明都保留原意；页面外观的变化不意味着研究结论已经成立。'],
    rows: [{ id: 'a', title: '检索与结果核对', value: 12, status: '已核对' }, { id: 'b', title: '阅读过程中的上下文与长中文标题：关闭详情后继续核对原始记录', value: 8, status: '待补充' }, { id: 'c', title: '草稿恢复与取消路径', value: null, status: '读取失败' }] as RecordRow[] },
  { id: 'release', label: '发布说明', title: 'R12：把保存与取消的边界说清楚', subtitle: '版本记录 / 候选修订', unit: 'KiB', measure: '构建体积',
    summary: '本次候选补充草稿恢复和错误说明。等待仍可取消，关闭详情不会自动保存；候选状态不表示已经对外发布。',
    paragraphs: ['保存失败时，输入仍留在原位，重试入口明确说明下一次动作。取消编辑只放弃本次详情修改，不会把关闭操作解释成成功保存。', '部署说明与验证记录使用相同修订号。缺失制品保留未知体积与失败原因，不用零值掩盖未完成状态。下面三个合成制品可排序、筛选和查看详情。'],
    rows: [{ id: 'a', title: '界面资源与基础样式', value: 184, status: '已核对' }, { id: 'b', title: '包含长中文文案、错误恢复和键盘操作的交互示例制品', value: 96, status: '待补充' }, { id: 'c', title: '离线索引资源', value: null, status: '读取失败' }] as RecordRow[] },
  { id: 'overview', label: '数据概览', title: '采集仍在继续，异常需要单独核对', subtitle: '运行观察 / 合成快照', unit: 'ms', measure: 'p95 延迟',
    summary: '两条路径已有观测，一条路径读取失败。当前快照保留数值、单位与未知状态，不把缺失数据合并到正常区间。',
    paragraphs: ['概览帮助定位下一步要核对的对象，不代替原始记录。已核对、待补充和读取失败分别用文字标记，颜色只提供辅助线索。', '比较时先按数值排序，再筛选需要跟进的对象。打开详情可以补充本地备注，取消后回到原记录；页面持续保留当前筛选与排序。'],
    rows: [{ id: 'a', title: '摘要读取路径', value: 286, status: '已核对' }, { id: 'b', title: '跨多层上下文加载并保留阅读位置的详情读取路径', value: 413, status: '待补充' }, { id: 'c', title: '归档写入路径', value: null, status: '读取失败' }] as RecordRow[] },
];
const PaletteContext = createContext<{ palette: Palette; setPalette: (p: Palette) => void }>(null!);
function PaletteSelect({ overlay = false }: { overlay?: boolean }) {
  const { palette, setPalette } = useContext(PaletteContext);
  return <Select label={overlay ? '详情配色' : '局部配色'} value={palette} onChange={e => setPalette(e.target.value as Palette)}><option value="neutral">Neutral 黑白</option><option value="swiss">瑞士蓝局部示例</option></Select>;
}
function locateHeading(element: HTMLElement | null) {
  element?.focus({ preventScroll: true });
  element?.scrollIntoView({ block: 'start' });
}
function RecordDetails({ row, unit, saved, onSave }: { row: RecordRow; unit: string; saved: string; onSave: (note: string) => void }) {
  const [open, setOpen] = useState(false), [draft, setDraft] = useState('');
  return <Dialog title="记录详情" open={open} onOpenChange={next => { if (next) setDraft(saved); setOpen(next); }}
    trigger={<Button variant="quiet" aria-label={`查看${row.title}详情`}>详情</Button>}
    footer={<><Button variant="secondary" onClick={() => setOpen(false)}>取消编辑</Button><Button onClick={() => { onSave(draft); setOpen(false); }}>保存本地备注</Button></>}>
    <Stack gap={4}>
      <Text as="h3" variant="heading" data-evidence="record-title">{row.title}</Text>
      <Text data-evidence="record-value">{row.value == null ? `未知 ${unit} · 读取失败，等待补采` : `${row.value} ${unit} · ${row.status}`}</Text>
      <Text data-evidence="saved-note">已保存备注：{saved}</Text>
      <Textarea label="详情备注" value={draft} onChange={e => setDraft(e.target.value)} />
      <PaletteSelect overlay />
      <Text variant="caption" tone="muted">切换配色保留当前详情与草稿。</Text>
    </Stack>
  </Dialog>;
}
function Scenario({ config }: { config: typeof configs[number] }) {
  const [filter, setFilter] = useState('all'), [sort, setSort] = useState<TableSort>(), [draft, setDraft] = useState('下次继续核对未知记录。');
  const [save, setSave] = useState('idle');
  const [savedNotes, setSavedNotes] = useState<Record<string, string>>({});
  const [followHypothesis, setFollowHypothesis] = useState(false);
  const headingId = useId();
  const section = useRef<HTMLElement>(null);
  const rows = config.rows.filter(row => filter === 'all' || (filter === 'ready' ? row.status === '已核对' : row.status !== '已核对')).sort((a, b) => {
    if (!sort) return 0;
    if (a.value == null) return 1; if (b.value == null) return -1;
    return (a.value - b.value) * (sort.direction === 'asc' ? 1 : -1);
  });
  return <section ref={section} aria-labelledby={headingId} data-scene={config.id} className="rhine-editorial-scene">
    <header className="rhine-editorial-heading">
      <Text className="rhine-editorial-kicker" variant="caption">{config.subtitle}</Text>
      <Text as="h1" variant="title" id={headingId} data-evidence="title">{config.title}</Text>
      <Text className="rhine-editorial-summary" data-evidence="summary">{config.summary}</Text>
      <Inline gap={3}><Badge>待评审</Badge><Text variant="caption" tone="muted">2026 年 11 月 02 日 · 合成资料</Text></Inline>
    </header>
    <div className="rhine-editorial-grid">
      <Surface className="rhine-editorial-panel rhine-editorial-reading"><Stack gap={4}>
        {config.id === 'report' && <>
          <Text as="h2" variant="section">结论与证据</Text>
          <nav aria-label="报告目录"><Inline><Button variant="quiet" onClick={() => locateHeading(section.current?.querySelector<HTMLElement>('[data-anchor=evidence]') ?? null)}>跳到证据</Button><Button variant="quiet" onClick={() => locateHeading(section.current?.querySelector<HTMLElement>('[data-anchor=hypothesis]') ?? null)}>待验证假设</Button></Inline></nav>
          <Text as="h3" variant="heading">当前结论：恢复路径需要保留上下文</Text>
          <Text className="rhine-editorial-prose" data-evidence="paragraph-0">{config.paragraphs[0]}</Text>
          <Text as="h3" variant="heading" data-anchor="evidence" tabIndex={-1}>证据与缺口</Text>
          <Text className="rhine-editorial-prose" data-evidence="paragraph-1">{config.paragraphs[1]}</Text>
          <ul className="rhine-editorial-list"><li>检索路径：12 份样本已核对。</li><li>阅读路径：8 份样本仍需补充上下文。</li><li>草稿路径：材料读取失败，结论暂缺。</li></ul>
          <Text as="h3" variant="heading" data-anchor="hypothesis" tabIndex={-1}>待验证假设</Text>
          <Text className="rhine-editorial-prose">恢复入口靠近失败位置，可能帮助继续当前任务；尚无真人对照结果，不能据此声称效率提高。</Text>
          <Checkbox label="加入下一轮验证" checked={followHypothesis} onChange={e => setFollowHypothesis(e.target.checked)} />
          <Text variant="caption" tone="muted" role="status">{followHypothesis ? '假设已加入本地验证清单' : '该假设尚未确认'}</Text>
        </>}
        {config.id === 'release' && <>
          <Text as="h2" variant="section">R12 变更记录</Text>
          <Button variant="quiet" onClick={() => locateHeading(section.current?.querySelector<HTMLElement>('[data-anchor=compatibility]') ?? null)}>定位兼容说明</Button>
          <Text as="h3" variant="heading">改进 · 失败后继续编辑</Text>
          <Text className="rhine-editorial-prose" data-evidence="paragraph-0">{config.paragraphs[0]}</Text>
          <Text as="h3" variant="heading">修正 · 取消不再代表提交</Text>
          <ul className="rhine-editorial-list"><li>退出详情回到原记录，筛选和排序保留。</li><li>等待操作可以取消；再次保存需要新的明确动作。</li></ul>
          <Text as="h3" variant="heading" data-anchor="compatibility" tabIndex={-1}>兼容与发行边界</Text>
          <Text className="rhine-editorial-prose" data-evidence="paragraph-1">{config.paragraphs[1]}</Text>
          <Notice title="候选尚未发布" tone="warning">这份合成说明不对应真实发行。已有安装不会自动升级。</Notice>
          <Disclosure title="展开迁移核对项"><ul className="rhine-editorial-list"><li>固定并核对实际候选修订。</li><li>验证草稿、错误、取消和返回焦点。</li><li>消费方通过后再安排升级。</li></ul></Disclosure>
        </>}
        {config.id === 'overview' && <>
          <Text as="h2" variant="section">近四个时段</Text>
          <TrendChart label="摘要读取 p95" unit="ms" rangeLabel="09:00–12:00" description="合成小时快照；× 表示未知，未补零。" kind="line" points={[{ id: '09', label: '09:00', value: 240 }, { id: '10', label: '10:00', value: 310 }, { id: '11', label: '11:00', value: null }, { id: '12', label: '12:00', value: 286 }]} />
          <Text className="rhine-editorial-prose" data-evidence="paragraph-0">{config.paragraphs[0]}</Text>
          <Text className="rhine-editorial-prose" data-evidence="paragraph-1">{config.paragraphs[1]}</Text>
        </>}
        <Popover title="数据口径" trigger={<Button variant="secondary">查看数据口径</Button>}><Stack gap={3}><Text>全部记录均为本地合成样本。未知值不参与数值排序比较，始终排在末尾。</Text><Text tone="muted">按原记录的单位阅读；未知值不是零。</Text></Stack></Popover>
      </Stack></Surface>
      <Surface className="rhine-editorial-panel rhine-editorial-facts"><Stack gap={4}>
        <Text as="h2" variant="section">{config.id === 'report' ? '证据覆盖' : config.id === 'release' ? '候选信息' : '当前指标'}</Text>
        <Metric label={config.measure} value={config.rows[0].value} unit={config.unit} description="首条记录 · 已核对" />
        <Metric label="待跟进" value="2" unit="项" description="含 1 项未知，不按零处理" />
        {config.id === 'release' && <Text>版本 R12 / 基于 R11<br/>状态：未发布<br/>范围：草稿与恢复路径</Text>}
        {config.id === 'overview' && <Metric label="采样覆盖" value="75" unit="%" description="4 个时段中有 1 个未知" />}
        <Notice tone="warning" title="覆盖尚不完整">未知记录需要补采，不能据此判断整体结果。</Notice>
      </Stack></Surface>
      <Surface className="rhine-editorial-panel rhine-editorial-records"><Stack gap={4}>
        <Inline><Text as="h2" variant="section">逐项核对</Text><Badge>{rows.length} 条记录</Badge></Inline>
        <Select label="记录筛选" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">全部记录</option><option value="ready">已核对</option><option value="attention">需要跟进</option></Select>
        <DataTable caption={`${config.label}明细`} rows={rows} rowKey={row => row.id} rowLabel={row => row.title} sort={sort} onSortChange={setSort} onSortReset={() => setSort(undefined)} columns={[
          { key: 'title', header: '记录', rowHeader: true, width: 230, render: row => row.title },
          { key: 'value', header: config.measure, sortable: true, width: 120, align: 'right', render: row => <span data-evidence="table-value">{row.value ?? '未知'} {config.unit}</span> },
          { key: 'status', header: '状态', width: 120, render: row => <Badge tone={row.status === '已核对' ? 'success' : row.status === '读取失败' ? 'error' : 'warning'}>{row.status}</Badge> },
          { key: 'details', header: '操作', width: 100, render: row => <RecordDetails row={row} unit={config.unit} saved={savedNotes[row.id] ?? '尚无备注'} onSave={note => setSavedNotes(notes => ({ ...notes, [row.id]: note }))} /> },
        ]} />
      </Stack></Surface>
      <Surface className="rhine-editorial-panel rhine-editorial-draft"><Stack gap={4}>
        <Text as="h2" variant="section">{config.id === 'report' ? '研究跟进' : config.id === 'release' ? '迁移核对备注' : '异常跟进'}</Text>
        <Textarea label="跟进草稿" value={draft} onChange={e => { setDraft(e.target.value); setSave('idle'); }} error={save === 'error' ? '本次模拟保存失败，草稿已保留。可以重试。' : undefined} />
        <Inline><Button data-evidence="save" busy={save === 'busy'} busyLabel="等待保存" onClick={() => setSave(save === 'error' ? 'saved' : 'error')}>{save === 'error' ? '重试保存' : '保存备注'}</Button>
          <Button variant="secondary" onClick={() => setSave(save === 'busy' ? 'idle' : 'busy')}>{save === 'busy' ? '取消等待' : '模拟等待'}</Button><Button disabled variant="quiet">提交评审</Button></Inline>
        {save === 'saved' && <Notice tone="success" title="本地备注已保存">当前为合成演示结果，未请求真实服务。</Notice>}
      </Stack></Surface>
    </div>
  </section>;
}
/** Preview-only recipe. Tokens live on its owning theme root so Portals inherit. */
export function EditorialGallery({ initialPalette = 'neutral', initialScene = 'report' }: { initialPalette?: Palette; initialScene?: string }) {
  const [palette, setPalette] = useState<Palette>(initialPalette);
  const [scene, setScene] = useState(configs.some(c => c.id === initialScene) ? initialScene : 'report');
  const anchor = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = anchor.current?.closest('.rhine-theme');
    if (!root) return;
    const previous = root.getAttribute('data-rhine-editorial');
    root.setAttribute('data-rhine-editorial', palette);
    return () => { if (previous === null) root.removeAttribute('data-rhine-editorial'); else root.setAttribute('data-rhine-editorial', previous); };
  }, [palette]);
  return <PaletteContext.Provider value={{ palette, setPalette }}><div ref={anchor} className="rhine-editorial-wrap">
    <header className="rhine-editorial-controls"><Stack gap={4}>
      <Text as="h2" variant="section">编辑布局</Text>
      <Text tone="muted">研究报告、发布说明与数据概览。以中性主题为基础，可选瑞士蓝局部配色。</Text>
      <PaletteSelect />
    </Stack></header>
    <Tabs label="内容场景" value={scene} onValueChange={setScene} fullWidth items={configs.map(config => ({ value: config.id, label: config.label, content: <Scenario config={config} /> }))} />
  </div></PaletteContext.Provider>;
}

export function EditorialFixture() {
  const params = new URLSearchParams(location.search), zoom = params.get('zoom') === '2' ? 2 : 1;
  useEffect(() => { const previous = document.documentElement.style.zoom; document.documentElement.style.zoom = String(zoom); return () => { document.documentElement.style.zoom = previous; }; }, [zoom]);
  return <ThemeProvider theme="neutral" data-rhine-motion={params.get('motion') === 'manual' ? 'reduced' : undefined}>
    <div className="rhine-editorial-fixture"><EditorialGallery initialPalette={params.get('palette') === 'swiss' ? 'swiss' : 'neutral'} initialScene={params.get('scene') || 'report'} /></div>
  </ThemeProvider>;
}
