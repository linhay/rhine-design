/** Alignment baseline: Ant Design component overview menu, fetched 2026-11-14 from https://ant.design/components/overview-cn/ (page changelog tag v6.7.0). Lookup taxonomy only, not an API compatibility claim. */

export const antdCategoryOrder = ['通用', '布局', '导航', '数据录入', '数据展示', '反馈', '其他'] as const;
export type AntdCategory = typeof antdCategoryOrder[number];
export type Coverage = 'present' | 'partial' | 'absent';

export interface AntdComponentEntry {
  id: string;
  category: AntdCategory;
  en: string;
  zh: string;
  coverage: Coverage;
  /** Existing gallery section rendered for this menu item. Omitted when Rhine has no corresponding exhibit. */
  renders?: string;
  note: string;
}

export const antdComponents: readonly AntdComponentEntry[] = [
  { id: 'button', category: '通用', en: 'Button', zh: '按钮', coverage: 'present', renders: 'button-actions', note: 'Button / IconButton / ButtonLink。悬浮按钮另见 FloatButton。' },
  { id: 'float-button', category: '通用', en: 'FloatButton', zh: '悬浮按钮', coverage: 'present', renders: 'float-button', note: 'FloatButton。固定在容器角，不表示业务成功。' },
  { id: 'icon', category: '通用', en: 'Icon', zh: '图标', coverage: 'present', renders: 'icon', note: 'Icon / IconButton。展台列出可用图标。' },
  { id: 'typography', category: '通用', en: 'Typography', zh: '排版', coverage: 'present', renders: 'typography', note: 'Text 与字体规范。不是可编辑排版组件。' },
  { id: 'divider', category: '布局', en: 'Divider', zh: '分割线', coverage: 'present', renders: 'utilities', note: 'Divider。' },
  { id: 'flex', category: '布局', en: 'Flex', zh: '弹性布局', coverage: 'present', renders: 'flex', note: 'Flex。方向、间距和换行由调用方决定。' },
  { id: 'grid', category: '布局', en: 'Grid', zh: '栅格', coverage: 'present', renders: 'grid', note: 'Columns 提供 24 栏。原 Grid 仍按最小宽度分列。' },
  { id: 'layout', category: '布局', en: 'Layout', zh: '布局', coverage: 'present', renders: 'app-shell', note: 'AppShell / SideNav。不从 Web 外壳推导 iOS。' },
  { id: 'masonry', category: '布局', en: 'Masonry', zh: '瀑布流', coverage: 'present', renders: 'masonry', note: 'Masonry。按列排列子项，不虚拟化。' },
  { id: 'space', category: '布局', en: 'Space', zh: '间距', coverage: 'present', renders: 'spacing', note: 'Stack / Inline / 间距规范。' },
  { id: 'splitter', category: '布局', en: 'Splitter', zh: '分隔面板', coverage: 'present', renders: 'splitter', note: 'Splitter。指针拖拽和键盘调整比例，不保存布局。' },
  { id: 'anchor', category: '导航', en: 'Anchor', zh: '锚点', coverage: 'present', renders: 'anchor', note: 'Anchor。链接到页内标题，并标出当前可见项。' },
  { id: 'breadcrumb', category: '导航', en: 'Breadcrumb', zh: '面包屑', coverage: 'present', renders: 'navigation', note: 'Breadcrumbs。' },
  { id: 'dropdown', category: '导航', en: 'Dropdown', zh: '下拉菜单', coverage: 'present', renders: 'dropdown', note: 'Dropdown。选择后关闭，不保存。' },
  { id: 'menu', category: '导航', en: 'Menu', zh: '导航菜单', coverage: 'present', renders: 'menu', note: 'NavigationMenu 提供横向与纵向原生导航；命令菜单仍是 Menu，不兼容 Ant Menu 的全部 API。' },
  { id: 'pagination', category: '导航', en: 'Pagination', zh: '分页', coverage: 'present', renders: 'data', note: 'Pagination 只回传翻页意图。' },
  { id: 'steps', category: '导航', en: 'Steps', zh: '步骤条', coverage: 'present', renders: 'navigation', note: 'Steps。回退焦点由宿主处理。' },
  { id: 'tabs', category: '导航', en: 'Tabs', zh: '标签页', coverage: 'present', renders: 'summary-tabs', note: 'Tabs。铺满不等于每项等宽。' },
  { id: 'auto-complete', category: '数据录入', en: 'AutoComplete', zh: '自动完成', coverage: 'present', renders: 'auto-complete', note: 'AutoComplete。可输入自定义文本，不查询远程服务。' },
  { id: 'cascader', category: '数据录入', en: 'Cascader', zh: '级联选择', coverage: 'present', renders: 'cascader', note: 'Cascader。选择路径，不保存。' },
  { id: 'checkbox', category: '数据录入', en: 'Checkbox', zh: '多选框', coverage: 'present', renders: 'selection', note: 'Checkbox。选中不是已保存。' },
  { id: 'color-picker', category: '数据录入', en: 'ColorPicker', zh: '颜色选择器', coverage: 'present', renders: 'color-picker', note: 'ColorPicker。返回色值，不写入主题。' },
  { id: 'date-picker', category: '数据录入', en: 'DatePicker', zh: '日期选择框', coverage: 'present', renders: 'advanced-forms', note: 'DateField / DateRangePicker。时区由宿主决定。' },
  { id: 'form', category: '数据录入', en: 'Form', zh: '表单', coverage: 'present', renders: 'form', note: 'Form 只提交宿主处理，不接管字段校验。' },
  { id: 'input', category: '数据录入', en: 'Input', zh: '输入框', coverage: 'present', renders: 'forms', note: 'TextField / Textarea / SearchField。' },
  { id: 'input-number', category: '数据录入', en: 'InputNumber', zh: '数字输入框', coverage: 'present', renders: 'advanced-forms', note: 'NumberField。不解释单位或舍入。' },
  { id: 'mentions', category: '数据录入', en: 'Mentions', zh: '提及', coverage: 'present', renders: 'mentions', note: 'Mentions。插入候选，不发送消息。' },
  { id: 'radio', category: '数据录入', en: 'Radio', zh: '单选框', coverage: 'present', renders: 'selection', note: 'RadioGroup。' },
  { id: 'rate', category: '数据录入', en: 'Rate', zh: '评分', coverage: 'present', renders: 'rate', note: 'Rate。选择分数，不提交评价。' },
  { id: 'select', category: '数据录入', en: 'Select', zh: '选择器', coverage: 'present', renders: 'forms', note: 'Select。搜索用 Combobox，不支持 multiple。' },
  { id: 'slider', category: '数据录入', en: 'Slider', zh: '滑动输入条', coverage: 'present', renders: 'slider', note: 'Slider。调整数值，不保存。' },
  { id: 'switch', category: '数据录入', en: 'Switch', zh: '开关', coverage: 'present', renders: 'selection', note: 'Switch 表示立即生效，不混同表单提交。' },
  { id: 'time-picker', category: '数据录入', en: 'TimePicker', zh: '时间选择框', coverage: 'present', renders: 'time-picker', note: 'TimePicker。返回当天时间，时区由宿主决定。' },
  { id: 'transfer', category: '数据录入', en: 'Transfer', zh: '穿梭框', coverage: 'present', renders: 'transfer', note: 'Transfer。在两列间移动，不请求数据。' },
  { id: 'tree-select', category: '数据录入', en: 'TreeSelect', zh: '树选择', coverage: 'present', renders: 'tree-select', note: 'TreeSelect 可选 dropdown；原内联模式仍为默认，数据与展开由宿主控制。' },
  { id: 'upload', category: '数据录入', en: 'Upload', zh: '上传', coverage: 'present', renders: 'upload', note: 'Upload。只记录本地文件名，不上传。' },
  { id: 'avatar', category: '数据展示', en: 'Avatar', zh: '头像', coverage: 'present', renders: 'avatar', note: 'Avatar。图片失败时显示名称首字。' },
  { id: 'badge', category: '数据展示', en: 'Badge', zh: '徽标数', coverage: 'present', renders: 'badge', note: 'CountBadge 显示数量和文字。原 Badge 仍是只读短状态。' },
  { id: 'calendar', category: '数据展示', en: 'Calendar', zh: '日历', coverage: 'present', renders: 'calendar', note: 'Calendar。选择日期，不选择时间。' },
  { id: 'card', category: '数据展示', en: 'Card', zh: '卡片', coverage: 'present', renders: 'card', note: 'Card 组织标题和内容。Surface 仍是无标题表面。' },
  { id: 'carousel', category: '数据展示', en: 'Carousel', zh: '走马灯', coverage: 'present', renders: 'carousel', note: 'Carousel。切换已有内容，不自动播放。' },
  { id: 'collapse', category: '数据展示', en: 'Collapse', zh: '折叠面板', coverage: 'present', renders: 'collapse', note: 'Collapse 可手风琴切换。Disclosure 仍是单组展开。' },
  { id: 'descriptions', category: '数据展示', en: 'Descriptions', zh: '描述列表', coverage: 'present', renders: 'descriptions', note: 'Descriptions 成组展示事实。KeyValue 仍是单对。' },
  { id: 'empty', category: '数据展示', en: 'Empty', zh: '空状态', coverage: 'present', renders: 'disclosure', note: 'EmptyState。失败不用空态顶替。' },
  { id: 'image', category: '数据展示', en: 'Image', zh: '图片', coverage: 'present', renders: 'image', note: 'Image 可打开预览。不解码业务资产。' },
  { id: 'list', category: '数据展示', en: 'List', zh: '列表', coverage: 'present', renders: 'list', note: 'List 展示宿主给出的项，不请求数据。' },
  { id: 'listy', category: '数据展示', en: 'Listy', zh: '虚拟列表', coverage: 'present', renders: 'listy', note: 'VirtualList。只渲染可见行，不是另一套 List。' },
  { id: 'popover', category: '数据展示', en: 'Popover', zh: '气泡卡片', coverage: 'present', renders: 'overlays', note: 'Popover。长任务用 Dialog。' },
  { id: 'qr-code', category: '数据展示', en: 'QRCode', zh: '二维码', coverage: 'present', renders: 'qr-code', note: 'QRCode。UTF-8、M 级纠错、78 字节上限；独立解码验证，不承诺所有相机。' },
  { id: 'segmented', category: '数据展示', en: 'Segmented', zh: '分段控制器', coverage: 'present', renders: 'selection', note: 'SegmentedControl。不是导航。' },
  { id: 'statistic', category: '数据展示', en: 'Statistic', zh: '统计数值', coverage: 'present', renders: 'metric-comparison', note: 'Metric。未知不显示成 0。' },
  { id: 'table', category: '数据展示', en: 'Table', zh: '表格', coverage: 'present', renders: 'advanced-data', note: 'DataTable。不本地冒充分页结果。' },
  { id: 'tag', category: '数据展示', en: 'Tag', zh: '标签', coverage: 'present', renders: 'tag', note: 'Tag。可移除的文字标签，颜色不单独表达状态。' },
  { id: 'timeline', category: '数据展示', en: 'Timeline', zh: '时间轴', coverage: 'present', renders: 'timeline', note: 'EventTimeline 是事件序列。StatusTimeline 仍是时段证据。' },
  { id: 'tooltip', category: '数据展示', en: 'Tooltip', zh: '文字提示', coverage: 'present', renders: 'overlays', note: 'Tooltip 只放非关键短说明。' },
  { id: 'tour', category: '数据展示', en: 'Tour', zh: '漫游式引导', coverage: 'present', renders: 'tour', note: 'Tour。逐步说明，Escape 关闭，不保存进度。' },
  { id: 'tree', category: '数据展示', en: 'Tree', zh: '树形控件', coverage: 'present', renders: 'tree', note: 'Tree 可展开并选择。TreeSelect 可选择内联或下拉，常驻树仍是只读配方。' },
  { id: 'alert', category: '反馈', en: 'Alert', zh: '警告提示', coverage: 'present', renders: 'feedback', note: 'Notice 留在页面上。' },
  { id: 'drawer', category: '反馈', en: 'Drawer', zh: '抽屉', coverage: 'present', renders: 'overlays', note: 'Drawer。位置不改变模态语义。' },
  { id: 'message', category: '反馈', en: 'Message', zh: '全局提示', coverage: 'present', renders: 'message', note: 'Message 由宿主放置和关闭，不建全局队列。' },
  { id: 'modal', category: '反馈', en: 'Modal', zh: '对话框', coverage: 'present', renders: 'overlays', note: 'Dialog。旁边继续操作时不用它。' },
  { id: 'notification', category: '反馈', en: 'Notification', zh: '通知提醒框', coverage: 'present', renders: 'notification', note: 'Notification 留到明确关闭，不自动排队。' },
  { id: 'popconfirm', category: '反馈', en: 'Popconfirm', zh: '气泡确认框', coverage: 'present', renders: 'popconfirm', note: 'Popconfirm 在触发处确认。ConfirmDialog 仍是对话框。' },
  { id: 'progress', category: '反馈', en: 'Progress', zh: '进度条', coverage: 'present', renders: 'feedback', note: 'Progress。不估算真实进度。' },
  { id: 'result', category: '反馈', en: 'Result', zh: '结果', coverage: 'present', renders: 'result', note: 'Result。展示结果文字，不代表业务已完成。' },
  { id: 'skeleton', category: '反馈', en: 'Skeleton', zh: '骨架屏', coverage: 'present', renders: 'feedback', note: 'Skeleton。失败不用骨架替换已有内容。' },
  { id: 'spin', category: '反馈', en: 'Spin', zh: '加载中', coverage: 'present', renders: 'spin', note: 'Spin。可见状态文字，不估算进度。' },
  { id: 'watermark', category: '反馈', en: 'Watermark', zh: '水印', coverage: 'present', renders: 'watermark', note: 'Watermark。重复文字，不拦截交互。' },
  { id: 'affix', category: '其他', en: 'Affix', zh: '固钉', coverage: 'present', renders: 'affix', note: 'Affix。在滚动容器内粘住，不固定到视口外。' },
  { id: 'app', category: '其他', en: 'App', zh: '包裹组件', coverage: 'present', renders: 'app', note: 'App。提供一块命名区域，不建立全局提示队列。' },
  { id: 'border-beam', category: '其他', en: 'BorderBeam', zh: '边框流光', coverage: 'present', renders: 'border-beam', note: 'BorderBeam。装饰边框，不表示进度。' },
  { id: 'config-provider', category: '其他', en: 'ConfigProvider', zh: '全局化配置', coverage: 'present', renders: 'config-provider', note: 'ConfigProvider 提供局部密度。主题仍由 ThemeProvider 拥有。' },
  { id: 'util', category: '其他', en: 'Util', zh: '工具类', coverage: 'present', renders: 'util', note: 'Util 提供 classNames 与 clamp 纯函数；不是 Ant Design 工具函数的全量复制。' },
];

/** Previous gallery chapters, filed under the official category. Unmatched chapters stay in 其他. */
export const categoryExtras: Record<AntdCategory, readonly (readonly [string, string])[]> = {
  通用: [['button-actions', '动作语义与尺寸'], ['responsive-actions', '容器自适应动作'], ['actions', '按钮与输入'], ['component-typography', '组件文字配对'], ['foundation', '视觉基础'], ['graphite', '石墨夜间主题'], ['neutral', '中性轻量主题'], ['brand', '品牌标志'], ['patterns', '场景与交互指南'], ['motion', '动效实验室'], ['startup', '启动动画']],
  布局: [['utilities', '操作与布局'], ['app-shell', '背景与多侧栏'], ['spacing', '间距与组合'], ['backgrounds', '场景背景'], ['editorial-layout', '编辑布局'], ['chat-foundation', 'Chat 基石'], ['orbit', '轨道星空'], ['neutron-star', '中子星']],
  导航: [['navigation', '导航与步骤'], ['nav-actions', '导航行操作'], ['summary-tabs', '带摘要的页签']],
  数据录入: [['remote-lifecycle', '远程多选生命周期'], ['forms', '表单与选择'], ['advanced-forms', '复杂表单'], ['selection', '选择与切换'], ['checkbox-rows', '侧栏双行多选'], ['compact-selection', '紧凑选择与保存'], ['compact-filters', '紧凑与大量筛选'], ['single-search', '单输入搜索'], ['list-filter-bar', '列表筛选栏'], ['date-range-filter', '日期筛选组合'], ['form-workflow', '表单流程'], ['form-integration', '表单接入与数据反馈'], ['settings-composition', '设置页组合'], ['template-settings', '模板驱动设置'], ['parameter-config', '参数与生成预览'], ['automation-settings', '周期自动化设置']],
  数据展示: [['disclosure', '展开与组合'], ['data', '数据与分页'], ['advanced-data', '受控数据表'], ['media', '媒体卡片与查看器'], ['monitoring', '健康详情与图表'], ['metric-comparison', '指标比较与基准'], ['list-card-recipes', '列表分类与只读归属'], ['resident-tree', '常驻树与画布'], ['object-lifecycle', '对象生命周期与观测'], ['agent-chat', '聊天消息与记录'], ['rich-text', '只读富文本与高亮'], ['subscriptions', '订阅管理示例'], ['object-reading', '工作空间对象阅读'], ['compact-account', '紧凑账号与凭证'], ['periodic-report', '周期报告与跨日来源'], ['tray-usage', '托盘用量组合']],
  反馈: [['feedback', '状态与加载'], ['overlays', '浮层与反馈'], ['overlay-bounds', '浮层缩放与边界'], ['settings-dialog', '设置导航弹窗'], ['personal-notifications', '个人事件通知'], ['async-snapshot-recipes', '异步快照与模块加载']],
  其他: [['theme-picker', '主题预览与选择']],
};

/** Older chapter hashes. They still open the same exhibit; the official menu item stays the current link. */
export const legacySections = {
  'button-actions': 'button',
  actions: 'icon',
  utilities: 'divider',
  'app-shell': 'layout',
  spacing: 'space',
  navigation: 'breadcrumb',
  overlays: 'modal',
  'summary-tabs': 'tabs',
  forms: 'input',
  'advanced-forms': 'date-picker',
  selection: 'checkbox',
  'form-workflow': 'form',
  data: 'table',
  disclosure: 'collapse',
  media: 'image',
  'list-card-recipes': 'list',
  'metric-comparison': 'statistic',
  'advanced-data': 'table',
  monitoring: 'timeline',
  'resident-tree': 'tree',
  feedback: 'alert',
  'personal-notifications': 'notification',
  'theme-picker': 'config-provider',
} as const;

const legacyLabels: Record<string, string> = {
  'button-actions': 'Button 按钮',
  actions: 'Icon 图标',
  utilities: 'Divider 分割线',
  'app-shell': 'Layout 布局',
  spacing: 'Space 间距',
  navigation: 'Breadcrumb 面包屑',
  overlays: 'Modal 对话框',
  'summary-tabs': 'Tabs 标签页',
  forms: 'Input 输入框',
  'advanced-forms': 'DatePicker 日期选择框',
  selection: 'Checkbox 多选框',
  'form-workflow': 'Form 表单',
  data: 'Table 表格',
  disclosure: 'Collapse 折叠面板',
  media: 'Image 图片',
  'list-card-recipes': 'List 列表',
  'metric-comparison': 'Statistic 统计数值',
  'advanced-data': 'Table 表格',
  monitoring: 'Timeline 时间轴',
  'resident-tree': 'Tree 树形控件',
  feedback: 'Alert 警告提示',
  'personal-notifications': 'Notification 通知提醒框',
  'theme-picker': 'ConfigProvider 全局化配置',
};

export const galleryGroups = [
  { label: '', items: [['top', '组件总览']] as const },
  ...antdCategoryOrder.map(category => ({
    label: category,
    items: [...antdComponents.filter(item => item.category === category).map(item => [item.id, `${item.en} ${item.zh}`] as const), ...categoryExtras[category]],
  })),
];

export function findAntdComponent(id: string) {
  return antdComponents.find(item => item.id === id);
}

export function galleryView(section: string) {
  return findAntdComponent(section)?.renders ?? section;
}

export function isGapSection(section: string) {
  const item = findAntdComponent(section);
  return !!item && !item.renders;
}

export function menuCurrentId(section: string) {
  if (galleryGroups.some(group => group.items.some(([id]) => id === section))) return section;
  return legacySections[section as keyof typeof legacySections] ?? section;
}

export function sectionLabel(section: string) {
  for (const group of galleryGroups) {
    const found = group.items.find(([id]) => id === section);
    if (found) return found[1];
  }
  return legacyLabels[section] ?? section;
}

export function isKnownGallerySection(section: string) {
  return galleryGroups.some(group => group.items.some(([id]) => id === section)) || section in legacySections;
}
