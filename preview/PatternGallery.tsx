import { useId, useState } from 'react';
import { Dialog, Link, Inline, StatusTimeline, TimelineLegend, Badge, Breadcrumbs, Button, Drawer, ErrorSummary, Fieldset, KeyValue, Metric, Notice, Select, SideNav, Stack, Steps, Surface, Text, TextField, type FieldError } from '../components';
import './patterns.css';

export const scenarios = [
  ['navigation', '跨模块工作', 'SideNav + Breadcrumbs', '侧边栏切换工作区；面包屑表达父子层级。当前位置用 aria-current，切换后聚焦主内容。', '导航状态即时变化，内容 180ms / 3px 进入。', '同页少量内容用 Tabs；面包屑不表示操作历史。'],
  ['tabs', '同一对象的不同视图', 'Tabs / SegmentedControl', 'Tabs 切换独立内容区域；SegmentedControl 改变一个视图的指标或模式。方向键操作，焦点留在选项。', '边界 120ms，面板进入 180ms。', '不要把筛选指标做成全局导航。'],
  ['form', '复杂表单与纠错', 'Fieldset + TextField + ErrorSummary', '按任务分组，提交后同时显示字段错误与顶部摘要。摘要获得焦点，点问题回到字段；保留已填值。', '立即显示错误，不抖动、不滚动循环。', '单字段就地错误即可；不能只给 Toast。'],
  ['steps', '分阶段配置', 'Steps + Fieldset', '当前步骤由业务校验推进；允许返回已完成步骤。步骤完成与真实结果一致。', '当前段 180ms 淡入 / 3px；不自动走步骤。', '未知耗时用 Progress 不确定态；步骤条不是百分比。'],
  ['reading', '文件与笔记阅读', '居中 Dialog + Tabs', '先遵守产品明确的居中偏好；正文、来源与关联同窗切换，关联跳转关闭弹窗，返回恢复阅读上下文。', '160ms 淡入；减少动态立即显示，保留焦点规则。', 'Drawer 也是模态，但不等于居中；操作背景时评估非模态分栏或独立页。'],
  ['detail', '明确采用侧边详情', 'Drawer + KeyValue', '保持列表上下文，临时查看详情。焦点进入抽屉，Escape 关闭后返回入口。', '160ms / 3px 由右侧进入，关闭即时归还焦点。', '需要长期链接或大量编辑时使用独立详情页。'],
  ['confirm', '不可逆操作', 'ConfirmDialog', '说明对象、影响和明确动词；默认焦点在取消。等待真实结果，失败保留上下文。', '160ms 淡入；等待期间保持尺寸，不延迟结果。', '普通保存不弹二次确认；可撤销操作优先撤销。'],
  ['feedback', '任务结果与系统异常', 'Toast / Notice', '短暂成功用 Toast；字段或区域失败用就地 Notice；需要行动的错误持续显示。', '通知 180ms / 3px；悬停或聚焦暂停倒计时。', '不能让关键错误自动消失，也不抢占焦点。'],
  ['load', '首次读取与重新请求', 'Skeleton / Progress / Button busy', '首次已知结构用骨架；提交用按钮 busy；刷新保留旧数据并标记更新状态。', '内容就绪 180ms 原位淡入；减少动态时静态占位。', '不伪造百分比，不清空用户正在看的内容。'],
  ['search', '大列表搜索与选择', 'SearchField / Combobox + Pagination', '输入法完成后查询，防抖、取消过期请求；服务端返回结果和排序。加载时不可选旧结果。', '状态即时更新；结果区域 180ms，不逐条错峰。', '不能拉取全量数据后假装服务端搜索。'],
  ['choice', '选项数量与选择规则', 'RadioGroup / Select / Checkbox / Switch', '少量互斥项用 Radio；较多互斥项用 Select；多选用 Checkbox；即时生效的二态偏好用 Switch。', '选择边界 120ms，开关保持固定位置。', '需要保存才生效的选项应说明保存规则；不伪装即时生效。'],
  ['overlay', '局部说明与次级操作', 'Tooltip / Popover / Menu', 'Tooltip 是非必要补充；Popover 放可交互详情；Menu 提供命令。都应有键盘入口和关闭路径。', '160ms / 3px，按实际放置方向进入。', '必要说明常驻；不要把表单放进 Tooltip。'],
  ['empty', '空白、无结果、无权限', 'EmptyState / Notice', '区分尚未创建、筛选无结果、读取失败与无权限；提供对应的创建、清除筛选或重试动作。', '静态为主，状态替换 180ms。', '失败不是空列表；无权限不能提供无效创建按钮。'],
  ['monitor', '监控数据与告警', 'Metric + Badge + DataTable + Notice', '值、单位、时间范围和最后更新时间一起展示。告警须有文字、级别和处理入口，过期数据标明陈旧。', '更新值原位替换，不滚动数字、不闪烁告警。', '未知值显示 —；不要用 0 掩盖采集失败或只靠红绿色。'],
  ['motion', '品牌与日常交互', 'Logo / 启动编排 / 基础过渡', '品牌动画只在启动或明确重播时出现；业务界面用几何边界和稳定位置建立识别。', '日常 120–240ms；品牌独立编排，减少动态直接到最终态。', '不把 Logo 当加载器，不因动画阻塞可用页面。'],
] as const;

export function PatternGallery({ section }: { section: string }) {
  const [step, setStep] = useState(0), [chapter, setChapter] = useState('overview');
  const [choice, setChoice] = useState('navigation');
  const [monitor, setMonitor] = useState('normal');
  const [previewScope, setPreviewScope] = useState('primary');
  const [name, setName] = useState(''), [endpoint, setEndpoint] = useState('');
  const [attempt, setAttempt] = useState(0), [errors, setErrors] = useState<FieldError[]>([]), [saved, setSaved] = useState(false);
  const id = useId(), nameId = `${id}-name`, endpointId = `${id}-endpoint`;
  const scenario = scenarios.find(item => item[0] === choice)!;
  if (section === 'navigation') return <section id="navigation"><div className="ds-section-title"><span>NAV</span><h2>去哪里，现在到哪一步。</h2></div><p className="ds-caption">导航表达空间层级，步骤表达任务顺序。当前位置始终有文字与边界提示。</p>
    <Surface><Breadcrumbs items={[{label:'设计总览',href:'#top'},{label:'导航与步骤'}]} /><div className="ds-navigation-demo"><SideNav aria-label="工作区演示导航" currentId={chapter} groups={[{label:'工作区',items:[{id:'overview',label:'概览',href:'#navigation',icon:'chart'},{id:'records',label:'记录',href:'#navigation',icon:'connection'},{id:'settings',label:'设置',href:'#navigation',icon:'info'}]}]} onNavigate={(item,event) => {event.preventDefault(); setChapter(item.id);}}/><div className="ds-navigation-content"><Badge>SideNav</Badge><h3>{({overview:'概览',records:'记录',settings:'设置'})[chapter]}</h3><Text>20px线性图标辅助识别，文字始终可见。44px操作行、4px行间距，选中项以苔绿底和细边界标识，不使用外链箭头。图标可选；长名称自然换行。页面路由、数据和权限由业务提供。</Text></div></div></Surface>
    <Surface className="ds-gap-top"><h3>Steps · 验证后推进</h3><Steps current={step} onStepChange={setStep} items={[{id:'scope',label:'选择范围',description:'确认任务边界'},{id:'setup',label:'完成配置',description:'校验必填信息'},{id:'review',label:'核对结果',description:'完成后才显示成功'}]}/><div className="ds-row ds-gap-top"><Button onClick={()=>setStep(value=>Math.min(3,value+1))} disabled={step===3}>模拟本步完成</Button><Button variant="secondary" onClick={()=>setStep(0)}>重置步骤</Button></div><p role="status" className="ds-caption">{step===3?'全部完成 · 合成演示':'未完成的步骤不能点击跳过；已完成步骤可返回。'}</p></Surface>
  </section>;
  if (section === 'form-workflow') return <section id="form-workflow"><div className="ds-section-title"><span>FORM</span><h2>让问题可定位，让输入被保留。</h2></div><p className="ds-caption">试着直接提交，再点击错误摘要回到字段。这里只做本地验证，不发送或保存数据。</p>
    <Surface><form noValidate onSubmit={event => {
      event.preventDefault(); const next: FieldError[]=[];
      if (!name.trim()) next.push({fieldId:nameId,message:'请输入工作区名称'});
      let validAddress=false;
      try { const url=new URL(endpoint); validAddress=url.protocol==='https:' && !!url.hostname && !url.username && !url.password; } catch { /* Invalid address stays in the form for correction. */ }
      if (!validAddress) next.push({fieldId:endpointId,message:'请输入有效的 HTTPS 服务地址'});
      setErrors(next);setAttempt(value=>value+1);setSaved(next.length===0);
    }}><Stack><ErrorSummary errors={errors} focusKey={attempt}/><Fieldset legend="工作区信息" hint="两项均为必填；失败后保留已输入内容。"><TextField id={nameId} label="工作区名称" required value={name} onChange={event=>{setName(event.target.value);setSaved(false);}} error={errors.find(error=>error.fieldId===nameId)?.message}/><TextField id={endpointId} label="服务地址" required type="url" value={endpoint} placeholder="https://example.com" onChange={event=>{setEndpoint(event.target.value);setSaved(false);}} error={errors.find(error=>error.fieldId===endpointId)?.message}/></Fieldset><div className="ds-row"><Button type="submit">验证配置</Button><Drawer trigger={<Button variant="secondary">查看填写说明</Button>} title="填写说明" description="临时帮助保留当前表单。关闭后回到入口，内容不会丢失。"><Stack><Text>名称用于识别工作区。服务地址必须以 HTTPS 开头。</Text><Notice title="仅为演示">不要填入密码、Token 或真实凭证。这里不发起网络请求。</Notice></Stack></Drawer></div>{saved && <Notice tone="success" title="配置格式通过">演示已完成，没有保存到服务端。</Notice>}</Stack></form></Surface>
    <p className="ds-caption">Fieldset 保留原生分组语义；ErrorSummary 在失败提交后获得焦点；Drawer 继承弹窗的焦点约束与 Escape 关闭。</p>
  </section>;
  if (section !== 'patterns') return null;
  return <section id="patterns"><div className="ds-section-title"><span>PLAYBOOK</span><h2>先选交互，再选组件。</h2></div><p className="ds-caption">14 个常见场景。按任务、信息持续时间和是否需要打断来选择，动效只解释状态变化。</p><Surface><Select label="我正在设计什么场景" value={choice} onChange={event=>setChoice(event.target.value)}>{scenarios.map(item=><option key={item[0]} value={item[0]}>{item[1]}</option>)}</Select><div className="ds-pattern-detail" key={choice}><Text variant="overline">推荐组合</Text><h3>{scenario[2]}</h3><dl><dt>交互规则</dt><dd>{scenario[3]}</dd><dt>动效规则</dt><dd>{scenario[4]}</dd><dt>避免误用</dt><dd>{scenario[5]}</dd></dl></div></Surface>
    {choice==='reading' && <Link href="#object-reading">打开工作空间阅读展台</Link>}
    {choice==='monitor' && <Surface className="ds-gap-top"><Stack><Text variant="section">健康记录时间轴</Text><Text variant="caption">合成数据；键盘方向键、Home / End 或指针查看时段。更新不播放装饰动画。</Text><StatusTimeline label="示例历史时段" startLabel="昨天 15:30" endLabel="今天 15:30" segments={Array.from({length:96},(_,i)=>({id:String(i),label:`时段 ${i+1}`,status:monitor==='unknown'?'unknown':i%23===0?'failed':i%17===0?'degraded':i%11===0?'recovered':i%7===0?'unknown':'healthy'}))}/><TimelineLegend/><Dialog trigger={<Button variant="secondary">左右分栏预览</Button>} title="选择范围" description="左侧操作，右侧查看选择对应的证据。此演示不保存更改。" sidePanel={closeButton => <Stack><Inline role="group" aria-label="预览导航" style={{justifyContent:'space-between'}}><Text as="h3" variant="body">{previewScope==='primary'?'主要资源':'备用资源'} · 健康记录</Text>{closeButton}</Inline><StatusTimeline compact label="范围历史时段" startLabel="昨天" endLabel="今天" segments={Array.from({length:96},(_,i)=>({id:String(i),label:`时段 ${i+1}`,status:previewScope==='primary'?'healthy':'unknown'}))}/><TimelineLegend/></Stack>}><Select label="范围" value={previewScope} onChange={event=>setPreviewScope(event.target.value)}><option value="primary">主要资源</option><option value="backup">备用资源</option></Select></Dialog></Stack></Surface>}
    {choice==='monitor' && <Surface className="ds-gap-top"><Stack><Select label="监控状态演示" value={monitor} onChange={event=>setMonitor(event.target.value)}><option value="normal">正常</option><option value="stale">数据陈旧</option><option value="unknown">首次采集失败</option></Select><div className="ds-row"><Metric label="请求成功率" value={monitor==='unknown'?null:'99.2'} unit="%" description="最近 5 分钟 · 合成数据"/><Badge tone={monitor==='normal'?'success':monitor==='stale'?'warning':'error'}>{monitor==='normal'?'采集正常':monitor==='stale'?'数据已过期':'暂无有效数据'}</Badge></div><KeyValue items={[{key:'time',label:'最后成功采集',value:monitor==='unknown'?null:'14:32:00 · 上海时区（示例）'},{key:'rule',label:'新鲜度规则',value:'超过 60 秒未成功采集即标为陈旧'}]}/>{monitor!=='normal' && <Notice tone={monitor==='stale'?'warning':'error'} title={monitor==='stale'?'显示上次结果，不代表当前状态':'未能获取指标'} action={<Drawer trigger={<Button variant="secondary">查看处理建议</Button>} title="采集恢复建议" description="这是一段监控交互示例，不连接真实系统。"><Text>检查采集器状态与数据源连接，恢复后重新读取。不要把未知值重置为零。</Text></Drawer>}>{monitor==='stale'?'本例模拟超过 60 秒未更新，请检查采集状态。':'首次读取失败，因此数值显示 —。'}</Notice>}</Stack></Surface>}
    <div className="ds-overview-links ds-gap-top"><a href="#navigation"><strong>导航与步骤</strong><span>↗</span><p>侧边栏、层级位置、阶段进度。</p></a><a href="#form-workflow"><strong>表单纠错与抽屉</strong><span>↗</span><p>试一次失败提交，观察焦点与输入保留。</p></a><a href="#motion"><strong>动效实验室</strong><span>↗</span><p>播放、重播和减少动态对照。</p></a><a href="https://github.com/linhay/rhine-design/blob/main/docs/INTERACTION_PATTERNS.md"><strong>完整使用规范</strong><span>↗</span><p>组件选择、代码契约与参考来源。</p></a></div>
  </section>;
}
