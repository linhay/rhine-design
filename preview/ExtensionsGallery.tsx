import { useEffect, useState } from 'react';
import { AppShell, AppShellToggle, Inline, Background, Button, Checkbox, DataTable, DateField, DateRangePicker, Dialog, EmptyState, MediaCard, MediaViewer, Notice, NumberField, Pagination, RemoteMultiSelect, Select, SideNav, Skeleton, Stack, Surface, TextField, TreeSelect, type AppShellProps, type DateRange, type TreeNode, type TableSort } from '../components';
import type { Choice } from '../components/components';
import './extensions.css';

const longName = '非常长的工作区名称与跨区域协作资料—Workspace-2026-archive';
const sampleImage = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640"><rect width="960" height="640" fill="#d2dacf"/><circle cx="720" cy="150" r="65" fill="#f8f2d8"/><path d="M0 520 310 140 620 550 800 280 960 500V640H0Z" fill="#536b5d"/><path d="M0 560 320 400 610 590 960 480V640H0Z" fill="#293f37"/></svg>')}`;

function StateControl({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <Select label="演示状态" value={value} onChange={event => onChange(event.target.value)}><option value="ready">默认</option><option value="loading">加载 / 保留旧数据</option><option value="error">失败</option><option value="empty">空内容</option><option value="disabled">禁用</option></Select>;
}

export function ShellGallery() {
  const [layout, setLayout] = useState<AppShellProps['layout']>('double-left');
  const [navOpen, setNavOpen] = useState(true), [secondaryOpen, setSecondaryOpen] = useState(true);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const [current, setCurrent] = useState('inbox'), [draft, setDraft] = useState('主题切换和侧栏折叠会保留这段内容。');
  const [plain, setPlain] = useState(true), [state, setState] = useState('ready');
  const [inlineControls, setInlineControls] = useState(true);
  return <section><div className="ds-section-title"><span>LAYOUT</span><h2>画布与应用外壳</h2></div>
    <p className="ds-caption">单侧栏适合简单工具；双左栏适合目录与列表；左右栏适合编辑器与检查器。可用宽度不足 1120px 时次栏转抽屉，不足 760px 时全局导航也转抽屉。正文始终保留。</p>
    <div className="ds-extension-controls"><Select label="布局方案" value={layout} onChange={event => setLayout(event.target.value as AppShellProps['layout'])}><option value="single">单侧栏</option><option value="double-left">双左侧栏</option><option value="left-right">左右侧栏</option></Select><Checkbox label="控制按钮放入侧栏和正文" checked={inlineControls} onChange={event => setInlineControls(event.target.checked)} /><Checkbox label="纯色背景" checked={plain} onChange={event => setPlain(event.target.checked)} /><StateControl value={state} onChange={setState} /></div>
    <div className="ds-shell-stage"><AppShell controls={inlineControls ? 'inline' : 'header'} layout={layout} decoration={plain ? 'none' : 'theme'}
      navigation={{ label: '全局导航', open: navOpen, onOpenChange: setNavOpen, drawerOpen: navDrawerOpen, onDrawerOpenChange: setNavDrawerOpen, content: <Stack gap={4}>{inlineControls && <Inline><strong>Rhine Workspace</strong><AppShellToggle placement="panel" iconOnly /></Inline>}<SideNav aria-label="应用导航" currentId={current} groups={[{ label: '工作空间', items: [{ id: 'inbox', label: '收件箱', href: '#app-shell' }, { id: 'archive', label: longName, href: '#app-shell' }] }]} onNavigate={(item, event) => { event.preventDefault(); setCurrent(item.id); setNavDrawerOpen(false); }} /></Stack> }}
      secondary={{ label: layout === 'left-right' ? '辅助详情' : '上下文目录', open: secondaryOpen, onOpenChange: setSecondaryOpen, content: <Stack gap={4}>{inlineControls && <AppShellToggle panel="secondary" placement="panel" />}<strong>{current === 'inbox' ? '收件箱' : longName}</strong>{state === 'loading' ? <Skeleton label="目录加载中" /> : state === 'error' ? <Notice title="目录读取失败" tone="error">可以继续编辑正文。</Notice> : state === 'empty' ? <EmptyState title="目录暂无内容" description="选择其他项目或继续编辑正文。" /> : <><p>当前条目、所属目录和属性。</p><Button variant="secondary" disabled={state === 'disabled'}>上下文操作</Button></>}</Stack> }}
      header={inlineControls ? undefined : <Dialog title="背景与浮层" description="浮层仍然挂载在唯一主题根；不受局部背景裁剪。" trigger={<Button>打开对话框</Button>}><TextField label="对话框输入" placeholder="试试 Tab 和 Escape" /></Dialog>}>
      <Stack gap={6}>{inlineControls && <Inline><AppShellToggle placement="content" /><AppShellToggle panel="secondary" placement="content" /></Inline>}<div><p className="ds-kicker">CURRENT TASK / {current}</p><h3>同一主题，独立正文背景</h3><p>正文默认使用纯色背景。关闭“纯色背景”可显式启用主题纹理；纸面主题保持纯净。</p></div>
        <Surface><Stack gap={4}><TextField label="正文草稿" value={draft} onChange={event => setDraft(event.target.value)} /><Button disabled={state === 'disabled'}>继续当前任务</Button></Stack></Surface>
        {Array.from({ length: 5 }, (_, i) => <Surface key={i}><h3>内容段落 {i + 1}</h3><p>滚动正文时顶部操作栏保持可达；每栏仅有一个滚动容器。Tab 可依次访问导航、正文与辅助详情。</p></Surface>)}
      </Stack>
    </AppShell></div>
    <div className="ds-extension-grid ds-gap-top">{(['canvas','content','sidebar'] as const).map(role => <Background key={role} roleTone={role} decoration={plain ? 'none' : 'theme'} className="ds-background-swatch"><strong>{role}</strong><Surface>Surface 始终提供不透明阅读表面。</Surface></Background>)}</div>
  </section>;
}

export function AdvancedFormsGallery() {
  const [range, setRange] = useState<DateRange>({ start: '2026-10-01', end: '2026-10-23' }), [date, setDate] = useState('2026-10-23');
  const [number, setNumber] = useState<number | null>(1.5), [query, setQuery] = useState(''), [options, setOptions] = useState<Choice[]>([]), [selected, setSelected] = useState<Choice[]>([]);
  const [pending, setPending] = useState(false), [state, setState] = useState('ready');
  const [readOnly, setReadOnly] = useState(false);
  const [keys, setKeys] = useState<string[]>(['leaf']), [expanded, setExpanded] = useState<string[]>(['root']), [multiple, setMultiple] = useState(true);
  const nodes: TreeNode[] = [{ id: 'root', label: '协作项目', children: [{ id: 'leaf', label: longName }, { id: 'locked', label: '归档项目', disabled: true }] }, { id: 'other', label: '独立项目' }];
  useEffect(() => {
    setPending(true);
    // This host mock cancels superseded requests; the component never fetches or filters.
    const timer = setTimeout(() => { setOptions([{ value: `${query || 'all'}-1`, label: `${query || '远程结果'} · ${longName}` }, { value: 'disabled', label: '无访问权限', disabled: true }, { value: `${query || 'all'}-2`, label: `${query || '远程结果'} · 第二项` }]); setPending(false); }, 400);
    return () => clearTimeout(timer);
  }, [query]);
  const disabled = state === 'disabled', error = state === 'error' ? '无法读取，请重试。' : undefined;
  return <section><div className="ds-section-title"><span>FORMS</span><h2>复杂输入，明确的数据所有权</h2></div><div className="ds-extension-controls"><StateControl value={state} onChange={setState} /><Checkbox label="只读输入" checked={readOnly} onChange={event => setReadOnly(event.target.checked)} /></div>
    <p className="ds-caption">日期为 YYYY-MM-DD，时区由宿主解释。数字在失焦或 Enter 时提交，Escape 撤销草稿。树支持方向键、字符定位、空格选择与多选 Ctrl/⌘ A；远程结果可连续选择，空查询按 Backspace 移除最后一个可移除标签。只读时可浏览和复制，不能更改值。</p>
    <div className="ds-extension-grid"><Surface><Stack gap={4}><DateRangePicker label="统计范围" value={range} onValueChange={setRange} min="2026-01-01" max="2026-12-31" disabled={disabled} readOnly={readOnly} error={error} presets={[{ label: '本月演示', value: { start: '2026-10-01', end: '2026-10-23' } }, { label: '最近 7 天', value: { start: '2026-10-17', end: '2026-10-23' } }, { label: '无效预设（禁用）', value: { start: '2026-11-01', end: '2026-10-01' } }]} /><DateField label="单个日期" value={date} onValueChange={setDate} disabled={disabled} readOnly={readOnly} /><p>范围：{range.start || '未选'} — {range.end || '未选'}</p></Stack></Surface>
      <Surface><NumberField label="配额" value={number} onValueChange={setNumber} min={-10} max={100} step={0.25} precision={2} disabled={disabled} readOnly={readOnly} error={error} /><p>已提交数值：{number ?? '空值'}。试输入 - 或 1.，编辑时不会丢失。</p></Surface>
      <Surface><RemoteMultiSelect label="远程项目" query={query} onQueryChange={setQuery} value={selected} onValueChange={setSelected} options={state === 'empty' ? [] : options} loading={pending || state === 'loading'} error={error} disabled={disabled} readOnly={readOnly} hint="已选标签跨查询保留；选择后可继续添加。" /></Surface>
      <Surface><Stack gap={4}><Checkbox label="树多选模式" checked={multiple} onChange={event => { setMultiple(event.target.checked); setKeys([]); }} /><TreeSelect label="项目层级" nodes={state === 'empty' ? [] : nodes} value={keys} onValueChange={setKeys} expandedKeys={expanded} onExpandedChange={setExpanded} multiple={multiple} disabled={disabled} readOnly={readOnly} loading={state === 'loading'} error={error} /><p>选中键：{keys.join(', ') || '无'}；父子勾选互不联动。</p></Stack></Surface>
    </div>
  </section>;
}

interface DemoRow { id: string; name: string; disabled?: boolean; children?: DemoRow[] }
const demoRows: DemoRow[] = [{ id: 'one', name: longName, children: [{ id: 'child', name: '子记录 / 保留层级' }] }, { id: 'locked', name: '不可选择的记录', disabled: true }, ...Array.from({ length: 8 }, (_, i) => ({ id: `row-${i}`, name: `记录 ${i + 3}` }))];
export function AdvancedDataGallery() {
  const [state, setState] = useState('ready'), [keys, setKeys] = useState<string[]>(['off-page']), [expanded, setExpanded] = useState<string[]>(['one']);
  const [page, setPage] = useState(1), [pageSize, setPageSize] = useState(10), [unknown, setUnknown] = useState(false), [compact, setCompact] = useState(false);
  const [single, setSingle] = useState(false), [hideSelectAll, setHideSelectAll] = useState(false), [sort, setSort] = useState<TableSort>();
  return <section><div className="ds-section-title"><span>DATA</span><h2>受控选择、层级与服务端分页</h2></div>
    <div className="ds-extension-controls"><StateControl value={state} onChange={setState} /><Checkbox label="未知总数" checked={unknown} onChange={event => setUnknown(event.target.checked)} /><Checkbox label="紧凑密度" checked={compact} onChange={event => setCompact(event.target.checked)} /><Checkbox label="表格单选" checked={single} onChange={event => { setSingle(event.target.checked); setKeys([]); }} /><Checkbox label="隐藏全选" checked={hideSelectAll} onChange={event => setHideSelectAll(event.target.checked)} /></div>
    <p className="ds-caption">多选表头只作用于当前可见且可选的行，保留跨页键；单选选取新记录会替换旧键。子行与详情独立呈现。右侧两列自动累计固定偏移，表格内部滚动。排序演示仅回传意图，不请求后端。</p>
    <Surface><Stack gap={4}><DataTable caption="项目记录" rows={state === 'empty' ? [] : page === 1 ? demoRows : [{ id: 'next-page', name: '宿主返回的第二页' }]} rowKey={row => row.id} rowLabel={row => row.name} loading={state === 'loading'} error={state === 'error' ? '读取失败，保留上次数据。' : undefined} onRetry={() => setState('ready')}
      selection={{ keys, onChange: setKeys, mode: single ? 'single' : 'multiple', hideSelectAll, isDisabled: row => !!row.disabled || state === 'disabled' }} expansion={{ keys: expanded, onChange: setExpanded, getChildren: row => row.children ?? [], renderDetail: row => <p>独立详情：{row.name}。导出与查询由宿主实现。</p> }} sort={sort} onSortChange={setSort} onSortReset={() => setSort(undefined)} density={compact ? 'compact' : 'comfortable'} stickyHeader maxHeight={420}
      columns={[{ key: 'name', header: '项目名称', width: 300, rowHeader: true, sortable: true, render: row => row.name }, { key: 'id', header: '标识', width: 80, sticky: 'right', render: row => row.id }, { key: 'action', header: '操作（固定）', width: 112, sticky: 'right', render: row => <Button variant="secondary" disabled={state === 'disabled'} onClick={() => setExpanded([...new Set([...expanded, row.id])])}>查看详情</Button> }]} />
      <Pagination label="项目记录分页" page={page} pageSize={pageSize} total={unknown ? undefined : 28} hasNext={page < 3} disabled={state === 'disabled'} loading={state === 'loading'} showFirstButton showLastButton onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} />
      <p role="status">已选 {keys.length} 项：{keys.join(', ') || '无'}。排序意图：{sort ? `${sort.key} ${sort.direction}` : '无'}；分页只回传意图。</p>
    </Stack></Surface>
  </section>;
}

export function MediaGallery() {
  const [selected, setSelected] = useState(false), [open, setOpen] = useState(false), [index, setIndex] = useState(0), [metadata, setMetadata] = useState(true), [version, setVersion] = useState('original');
  const titles = ['山野 · 午后的光', longName, '视频预览示例'];
  const [retried, setRetried] = useState(false);
  return <section><div className="ds-section-title"><span>MEDIA</span><h2>媒体保持比例，画布保持中性</h2></div><p className="ds-caption">照片、RAW、Live 和视频共享卡片契约。中性暗色查看器独立于三套界面主题；媒体请求、视频播放、下载与版本资源均由宿主提供。示例只使用本地内嵌矢量预览。</p>
    <MediaViewer open={open} onOpenChange={setOpen} trigger={<Button>打开全屏查看器</Button>} title={titles[index]} description={`${index + 1} / 3 · 左右方向键切换；输入和播放器保留自身按键`} onPrevious={() => setIndex(current => Math.max(0, current - 1))} onNext={() => setIndex(current => Math.min(2, current + 1))} previousDisabled={index === 0} nextDisabled={index === 2} metadataOpen={metadata} onMetadataOpenChange={setMetadata}
      actions={<><label>资源版本 <select aria-label="资源版本" value={version} onChange={event => setVersion(event.target.value)}><option value="original">原始资源</option><option value="preview">预览资源</option></select></label><a href={sampleImage} download="rhine-demo.svg">下载演示资源</a></>}
      metadata={<><h3>媒体信息</h3><p>{titles[index]}</p><p>类型：{index === 2 ? '视频' : '照片'}</p><p>版本：{version}</p><p>日期：未知</p><Dialog title="资源说明" description="Escape 先关闭此层，再关闭媒体查看器。" trigger={<button type="button">打开资源说明</button>}><p>业务元数据由宿主管理。</p></Dialog></>}
    >{index === 2 ? <video controls poster={sampleImage} aria-label="视频播放器示例" /> : <img src={sampleImage} alt="山峰与太阳构成的演示插画" />}</MediaViewer>
    <div className="ds-extension-grid ds-gap-top">
      <MediaCard title={titles[0]} kind="photo" date="2026-10-23" preview={<img src={sampleImage} alt="山野插画" />} onOpen={() => { setIndex(0); setOpen(true); }} selected={selected} onSelectedChange={setSelected} />
      <MediaCard title={titles[1]} kind="RAW" preview={<img src={sampleImage} alt="原始预览" />} aspectRatio="3 / 2" onOpen={() => { setIndex(1); setOpen(true); }} />
      <MediaCard title="视频，保持原始比例" kind="video" preview={<img src={sampleImage} alt="视频封面" />} onOpen={() => { setIndex(2); setOpen(true); }} />
      <MediaCard title="加载中的 Live 资源" kind="Live" state="loading" onOpen={() => setOpen(true)} />
      <MediaCard title="不可解码的文件" kind="RAW" state={retried ? 'ready' : 'error'} preview={retried ? <img src={sampleImage} alt="重试后恢复的示例预览" /> : undefined} onOpen={() => { setIndex(1); setOpen(true); }} actions={<Button variant="secondary" onClick={() => setRetried(true)} disabled={retried}>{retried ? '预览已恢复' : '重试预览'}</Button>} />
      <MediaCard title="尚无预览的资源" kind="photo" state="empty" onOpen={() => setOpen(true)} />
    </div>
  </section>;
}
