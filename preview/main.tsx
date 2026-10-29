import { NeutralGallery, NeutralFixture } from './NeutralGallery';
import { LabelActionGallery, LabelActionFixture } from './LabelActionGallery';
import { TimelineDensityFixture } from './TimelineDensityFixture';
import { TemplateSettingsGallery, TemplateSettingsFixture, SwitchRowsExample, MappingDensityExamples } from './TemplateSettingsGallery';
import { RemoteSelectionGallery, RemoteSelectionFixture } from './RemoteSelectionGallery';
import { ObjectReadingGallery, ObjectReadingFixture } from './ObjectReadingGallery';
import { SettingsCompositionGallery, SettingsCompositionFixture } from './SettingsCompositionGallery';
import { TrayUsageGallery, TrayUsageFixture } from './TrayUsageGallery';
import { ChatGallery } from './ChatGallery';
import { BackgroundFiltersFixture } from './BackgroundFiltersFixture';
import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Badge, Button, Checkbox, Disclosure, EmptyState, Link, Logo, Notice, Progress, SegmentedControl, Select, SelectionCard, Skeleton, Surface, Tabs, Text, TextField, Toolbar, type TextVariant } from '../components/index';
import './preview.css';
import { OverlayBoundsFixture, OverlayBoundsGallery } from './OverlayBoundsGallery';
import { SettingsDialogGallery, SettingsDialogFixture } from './SettingsDialogGallery';
import { ThemePickerGallery, ThemePickerFixture } from './ThemePickerGallery';
import { CommonGallery } from './CommonGallery';
import { MotionGallery } from './MotionGallery';
import { StartupGallery } from './StartupGallery';
import { PatternGallery } from './PatternGallery';
import { GalleryShell } from './GalleryShell';
import { componentCount } from './packageInfo';
import { SpacingGallery } from './SpacingGallery';
import { LineHeightGallery } from './LineHeightGallery';
import { SubscriptionGallery } from './SubscriptionGallery';
import { BackgroundGallery } from './BackgroundGallery';
import { OrbitGallery } from './OrbitGallery';
import { NeutronStarGallery } from './NeutronStarGallery';
import { AdvancedDataGallery, AdvancedFormsGallery, MediaGallery, ShellGallery } from './ExtensionsGallery';
import { MonitoringGallery } from './MonitoringGallery';
import { DateRangeFilterGallery } from './DateRangeFilterGallery';
import { ListFilterBarGallery } from './ListFilterBarGallery';
import { CompactAccountGallery } from './CompactAccountGallery';
import { CompactFilterBarGallery } from './CompactFilterBarGallery';
import { DenseFilterControlsGallery } from './DenseFilterControlsGallery';
import { CheckboxRowGallery } from './CheckboxRowGallery';
import { ComponentTypographyGallery } from './ComponentTypographyGallery';
import { NavActionsGallery } from './NavActionsGallery';
import { SingleSearchGallery } from './SingleSearchGallery';
import { CompactSelectionGallery } from './CompactSelectionGallery';
import { ButtonActionsGallery } from './ButtonActionsGallery';
import { SummaryTabsGallery } from './SummaryTabsGallery';

function Gallery() {
  const [motion, setMotion] = useState('system');
  const [logoReplay, setLogoReplay] = useState(0);
  const [previewPage, setPreviewPage] = useState('oauth');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(false);
  const [showSelectionIndicator, setShowSelectionIndicator] = useState(false);
  const [tab, setTab] = useState('tokens');
  const [metric, setMetric] = useState('tokens');
  const [progress, setProgress] = useState<number | null>(38);
  const [field, setField] = useState('');
  const [showError, setShowError] = useState(false);
  const [notice, setNotice] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const simulate = () => { setBusy(true); timer.current = setTimeout(() => { setBusy(false); setNotice(true); }, 900); };
  return <GalleryShell motion={motion} onMotionChange={setMotion}>{section => <>
    {section === 'neutral' && <NeutralGallery />}
    {section === 'theme-picker' && <ThemePickerGallery />}
    {section === 'tray-usage' && <TrayUsageGallery />}
    {section === 'settings-composition' && <SettingsCompositionGallery />}
    {section === 'object-reading' && <ObjectReadingGallery />}
    {section === 'template-settings' && <><TemplateSettingsGallery /><MappingDensityExamples /><SwitchRowsExample /></>}
    {section === 'settings-dialog' && <SettingsDialogGallery />}
    {section === 'overlay-bounds' && <OverlayBoundsGallery />}
    {section === 'monitoring' && <MonitoringGallery />}
    {section === 'date-range-filter' && <DateRangeFilterGallery />}
    {section === 'list-filter-bar' && <ListFilterBarGallery />}
    {section === 'compact-account' && <CompactAccountGallery />}
    {section === 'compact-filters' && <><LabelActionGallery /><RemoteSelectionGallery /><CompactFilterBarGallery /><DenseFilterControlsGallery /></>}
    {section === 'checkbox-rows' && <CheckboxRowGallery />}
    {section === 'component-typography' && <ComponentTypographyGallery />}
    {section === 'nav-actions' && <NavActionsGallery />}
    {section === 'agent-chat' && <ChatGallery />}
    {section === 'single-search' && <SingleSearchGallery />}
    {section === 'compact-selection' && <CompactSelectionGallery />}
    {section === 'button-actions' && <ButtonActionsGallery />}
    {section === 'summary-tabs' && <SummaryTabsGallery />}
    {section === 'backgrounds' && <BackgroundGallery />}
    {section === 'app-shell' && <ShellGallery />}
    {section === 'orbit' && <OrbitGallery />}
    {section === 'neutron-star' && <NeutronStarGallery />}
    {section === 'advanced-forms' && <AdvancedFormsGallery />}
    {section === 'advanced-data' && <AdvancedDataGallery />}
    {section === 'media' && <MediaGallery />}
    {section === 'subscriptions' && <SubscriptionGallery />}
    {section === 'top' && <>
      <div className="ds-hero"><div><p className="ds-kicker">FOUNDATIONS / COMPONENTS / MOTION</p><h1>精密，有序。<br /><span>每一次交互都有回应。</span></h1><p>{componentCount} 个通用组件，共用一套视觉变量和动效规则。<br />展台运行当前源码，可能包含未发布能力；接入前请核对安装版本与<Link href="https://github.com/linhay/rhine-design/blob/main/CHANGELOG.md">版本记录</Link>。</p></div></div>
      <div className="ds-overview-links">{[
        ['foundation','视觉基础','从色彩、间距与材质开始。'],
        ['typography','字体与文字','清晰的层级，稳定的阅读节奏。'],
        ['patterns','场景与交互指南','先明确任务，再选择组件和动效。'],
        ['motion','动效实验室','播放、重播，观察交互的连续性。'],
      ].map(([id,title,description]) => <a key={id} href={`#${id}`}><strong>{title}</strong><span aria-hidden="true">↗</span><p>{description}</p></a>)}</div>
    </>}


      {['navigation','form-workflow','patterns'].includes(section) && <PatternGallery section={section} />}
      {section === 'spacing' && <SpacingGallery />}
      {section === 'startup' && <StartupGallery reduced={motion==='reduced'} />}
      {section === 'motion' && <MotionGallery reduced={motion==='reduced'} />}
      {section === 'brand' && <section id="brand"><div className="ds-section-title"><span>00</span><h2>三角构架 · Rhine Design</h2></div>
        <div className="ds-logo-pair">
          <div className="ds-logo-stage"><Logo variant="icon" size={192} theme="light" /><span>浅色 / LIGHT</span></div>
          <div className="ds-logo-stage ds-logo-stage--dark"><Logo variant="icon" size={192} theme="dark" /><span>深色 / DARK</span></div>
        </div>
        <p className="ds-caption">浅色与深色共用同一份矢量母版，图形在方形画布内水平、垂直居中。</p>
        <div className="ds-grid"><Surface><div className="ds-component-title"><h3>Logo · 尺寸与组合</h3><span>16 / 24 / 32 / 48 / 64px</span></div><div className="ds-row">{[16,24,32,48,64].map(size=><Logo key={size} size={size} label={`Rhine Design ${size}px`} />)}</div><div className="ds-gap-top"><Logo variant="lockup" size={48} /></div></Surface>
          <Surface><div className="ds-component-title"><h3>Logo · 三块归位</h3><span>240ms / 单次入场</span></div><div className="ds-row"><Logo key={logoReplay} size={80} animate /><Button variant="secondary" onClick={()=>setLogoReplay(value=>value+1)}>重播标志动画</Button></div><p className="ds-caption">默认静态；减少动态时直接呈现。标志不表示同步进度。</p></Surface></div>
      </section>}

      {section === 'foundation' && <section id="foundation"><div className="ds-section-title"><span>01</span><h2>同一套变量，贯穿所有组件</h2></div>
        <div className="ds-palette">{[['PAPER','#F2F1E9'],['INK','#242B28'],['SAGE','#E5ECE3'],['GREEN','#425C4B'],['SIGNAL','#C65C34']].map(([name,color])=><div key={name}><div style={{background:color}} /><strong>{name}</strong><code>{color}</code></div>)}</div>
        <div className="ds-notes"><span>14px 正文 / 12px 辅助信息</span><span>4px 卡片 / 3px 按钮圆角</span><span>120–240ms 交互过渡</span></div>
      </section>}

      {section === 'typography' && <section id="typography"><div className="ds-section-title"><span>TYPE</span><h2>字体与文字 · 清晰先于装饰</h2></div>
        <p className="ds-caption">系统无衬线用于中英文正文；等宽字体用于路径、模型标识和代码。业务字号不低于 12px，中文不增加装饰字距。</p>
        <Surface><div className="ds-type-scale">{([
          ['title','30 / 38 · 600','连接你的工作空间'],
          ['section','18 / 26 · 600','数据概览'],
          ['heading','16 / 24 · 600','研究账号 A'],
          ['body','14 / 22 · 400','选择一个项目后，继续你的工作。'],
          ['label','14 / 22 · 500','在浏览器中登录'],
          ['caption','12 / 18 · 400','最近检查 14:32 · 上海时区'],
          ['overline','12 / 18 · 500','连接方式'],
          ['metric','26 / 32 · 600','1,280.00'],
          ['code','12 / 20 · 400','~/.codex/auth.json'],
        ] satisfies [TextVariant,string,string][]).map(([variant,spec,sample])=><div className="ds-type-row" key={variant}><div><Text variant="code">{variant}</Text><Text variant="caption" tone="muted">{spec}</Text></div><Text variant={variant}>{sample}</Text></div>)}</div></Surface>
        <LineHeightGallery />
        <div className="ds-grid ds-gap-top"><Surface><Text as="h3" variant="heading">中英文与数字</Text><div className="ds-type-copy"><Text>已完成 128 次请求，共使用 1.4M Token。</Text><Text numeric>预估费用 $5.44 · 平均耗时 2.4 s</Text><Text tone="muted" variant="caption">2026-10-22 14:32 · 上海（UTC+8）</Text><Text variant="overline" lang="en">Usage / Today</Text><Text>未采集的数据显示「—」，不替换为 0。小数位按指标语义固定，原始值保持可查。</Text></div></Surface>
        <Surface><Text as="h3" variant="heading">换行与状态文案</Text><div className="ds-type-copy"><Text>长标题、错误原因和下一步操作允许自然换行。</Text><Text variant="code">example-very-long-model-identifier-for-wrapping-preview-2026-10-22</Text><Text tone="error">暂时无法读取列表。请检查连接后重试。</Text><Text variant="caption" tone="muted">文字不缩放、不跑马灯、不逐字播放；复制或展开应能获取完整内容。</Text></div></Surface></div>
        <div className="ds-gap-top"><Toolbar title="Rhine Design / 设计评审" description="工具栏与静态页面样稿共用一套样式。">
          <Select label="页面示例" value={previewPage} onChange={event=>setPreviewPage(event.target.value)}><option value="oauth">项目列表</option><option value="usage">数据概览</option></Select>
          <Select label="场景示例" defaultValue="normal"><option value="normal">正常</option><option value="loading">读取中 / 等待授权</option></Select>
        </Toolbar></div>
        <div className="ds-grid ds-gap-top"><Select label="错误状态" defaultValue="" error="请选择一个页面后继续。"><option value="" disabled>请选择</option><option value="usage">数据概览</option></Select><Select label="禁用状态" disabled defaultValue="fixed" hint="原生菜单保留键盘操作，箭头不接收点击。"><option value="fixed">暂不可更改</option></Select></div>
      </section>}

      {section === 'actions' && <section id="actions"><div className="ds-section-title"><span>02</span><h2>操作有分量，反馈不打断</h2></div>
        <div className="ds-grid"><Surface><div className="ds-component-title"><h3>Button</h3><span>悬停 120ms / 按下 80ms</span></div><div className="ds-row"><Button busy={busy} busyLabel="正在保存" onClick={simulate}>保存修改</Button><Button variant="secondary" onClick={()=>setNotice(false)}>取消提示</Button><Button variant="quiet" onClick={()=>setNotice(true)}>查看反馈</Button><Button variant="danger" disabled>删除记录</Button></div><p className="ds-caption">处理中保持尺寸和键盘焦点，阻止重复提交。</p><Button disabled>暂不可用</Button></Surface>
        <Surface><div className="ds-component-title"><h3>TextField</h3><span>边框反馈 / 不抖动报错</span></div><TextField label="显示名称" value={field} onChange={event=>setField(event.target.value)} hint="此字段仅演示输入状态，不保存数据。" error={showError&&!field.trim()?'请输入显示名称':undefined} placeholder="例如：研究工作区" /><div className="ds-row ds-gap-top"><Button variant="secondary" onClick={()=>setShowError(true)}>验证输入</Button></div></Surface></div>
      </section>}

      {section === 'selection' && <section id="selection"><div className="ds-section-title"><span>03</span><h2>选择清楚，位置稳定</h2></div>
        <div className="ds-grid"><div><Checkbox label="显示卡片勾选框" checked={showSelectionIndicator} onChange={event => setShowSelectionIndicator(event.target.checked)} /><SelectionCard showIndicator={showSelectionIndicator} label="可选择容器" selected={selected} onSelectedChange={setSelected}><span className="ds-caption">适用于账号、模板或可取消选择项。<br />同一位置切换底色与边框，不抬升卡片。</span><div className="ds-gap-top"><Badge tone={selected?'success':'neutral'}>{selected?'已选择':'未选择'}</Badge></div></SelectionCard><p className="ds-caption">SelectionCard · 背景与边界 120ms</p></div>
        <Surface><div className="ds-component-title"><h3>SegmentedControl</h3><span>原生单选 / 120ms</span></div><SegmentedControl label="展示指标" items={[{value:'tokens',label:'Token'},{value:'requests',label:'请求数'},{value:'cost',label:'费用',disabled:true}]} value={metric} onValueChange={setMetric} /><p className="ds-caption">当前指标：{metric==='tokens'?'Token':'请求数'}。方向键切换，自动跳过禁用项。</p></Surface></div>
        <Surface className="ds-gap-top"><div className="ds-component-title"><h3>Tabs</h3><span>下划线与内容进入 180ms</span></div><Tabs label="组件说明" value={tab} onValueChange={setTab} items={[{value:'tokens',label:'视觉变量',content:<p>颜色、间距、字体与动效集中定义。业务页面只消费语义变量。</p>},{value:'disabled',label:'预留示例',disabled:true,content:null},{value:'motion',label:'动效规则',content:<p>内容进入最多移动 3px。保留隐藏面板状态，切换不触发重复业务操作。</p>}]} /></Surface>
        <Text className="ds-gap-top">需要同时展示对象身份和状态时，查看<a href="#summary-tabs">带摘要的页签规范与交互展台</a>。</Text>
      </section>}

      {section === 'feedback' && <section id="feedback"><div className="ds-section-title"><span>04</span><h2>告诉用户发生了什么</h2></div>
        <div className="ds-row ds-badges"><Badge>未开始</Badge><Badge tone="success">已完成</Badge><Badge tone="warning">需要处理</Badge><Badge tone="error">操作失败</Badge></div>
        <div className="ds-grid"><Surface><div className="ds-component-title"><h3>Progress</h3><span>数值更新 240ms</span></div><Progress label="进度示例" value={progress} /><div className="ds-row ds-gap-top"><Button variant="secondary" onClick={()=>setProgress(value=>value===null?38:Math.min(100,value+20))}>推进进度</Button><Button variant="quiet" onClick={()=>setProgress(value=>value===null?38:null)}>切换未知进度</Button></div><p className="ds-caption">只有真实进度才显示百分比；未知进度单独表达。</p></Surface>
        <Surface><div className="ds-component-title"><h3>Skeleton</h3><span>1400ms 低幅明暗</span></div>{loading?<Skeleton label="正在读取组件示例" />:<p className="ds-loaded">内容已准备好。加载占位与内容共用容器。</p>}<div className="ds-gap-top"><Button variant="secondary" onClick={()=>setLoading(value=>!value)}>切换加载状态</Button></div></Surface></div>
        <div className="ds-gap-top"><Button variant="secondary" onClick={()=>setNotice(value=>!value)}>切换提示</Button></div>
        {notice&&<div className="ds-gap-top"><Notice tone="success" title="修改已保存（演示）" action={<Button variant="quiet" onClick={()=>setNotice(false)}>关闭提示</Button>}>这是组件的本地反馈，没有写入任何业务数据。</Notice></div>}
        <div className="ds-gap-top"><Notice tone="warning" title="状态文字始终可见">颜色和动画只增强反馈，不承担唯一的状态含义。</Notice></div>
      </section>}

      {section === 'disclosure' && <section id="disclosure"><div className="ds-section-title"><span>05</span><h2>逐步展开，保持可读</h2></div>
        <div className="ds-grid"><Surface><div className="ds-component-title"><h3>Disclosure</h3><span>实测高度 / 200ms</span></div><Disclosure title="查看组件动画规则"><p>展开和收起都支持中途反向。关闭后内容不参与 Tab 导航。</p><Button variant="secondary" onClick={()=>setNotice(true)}>内容内操作</Button><p>减少动态模式直接到达最终状态，信息不会丢失。</p></Disclosure><Disclosure title="相邻分组共用一条分隔线"><p>分组连续排列，不加组间 gap；相邻边框合并，展开和收起各自独立。</p></Disclosure></Surface>
        <EmptyState title="暂无记录" description="用一句话说明当前状态，按业务需要提供一个下一步操作。" action={<Button variant="secondary" onClick={()=>setNotice(true)}>演示下一步</Button>} /></div>
      </section>}
      {['data','forms','utilities','overlays'].includes(section) && <CommonGallery key={section} section={section} />}
  </>}</GalleryShell>;

}

createRoot(document.getElementById('root')!).render(<StrictMode>{new URLSearchParams(location.search).get('fixture') === 'neutral' ? <NeutralFixture /> : new URLSearchParams(location.search).get('fixture') === 'label-action' ? <LabelActionFixture /> : new URLSearchParams(location.search).get('fixture') === 'timeline-density' ? <TimelineDensityFixture /> : new URLSearchParams(location.search).get('fixture') === 'template-settings' ? <TemplateSettingsFixture /> : new URLSearchParams(location.search).get('fixture') === 'remote-selection' ? <RemoteSelectionFixture /> : new URLSearchParams(location.search).get('fixture') === 'object-reading' ? <ObjectReadingFixture /> : ['orbit-entry', 'list-filters'].includes(new URLSearchParams(location.search).get('fixture') || '') ? <BackgroundFiltersFixture /> : new URLSearchParams(location.search).get('fixture') === 'overlay-bounds' ? <OverlayBoundsFixture /> : new URLSearchParams(location.search).get('fixture') === 'settings-dialog' ? <SettingsDialogFixture /> : new URLSearchParams(location.search).get('fixture') === 'theme-picker' ? <ThemePickerFixture /> : new URLSearchParams(location.search).get('fixture') === 'settings-composition' ? <SettingsCompositionFixture /> : new URLSearchParams(location.search).get('fixture') === 'tray-usage' ? <TrayUsageFixture /> : <Gallery />}</StrictMode>);
