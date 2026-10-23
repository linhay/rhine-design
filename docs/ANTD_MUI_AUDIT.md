# Ant Design / MUI：应用组件逐项核对

2026-10-24，issues #1–#6 的 0.5.0 API。核对覆盖全部 11 个新组件及 DataTable、Pagination、StatusTimeline 的扩展。依据官方在线文档，再用本库测试和真实展台验证行为；未安装这两套 UI 库，也不声称 API 兼容或完整功能等价。

## 组件覆盖与修复

| 本库组件 | Ant Design 对应 | MUI 对应 | 本轮落地 |
| --- | --- | --- | --- |
| DateField | DatePicker | X DateField | 只读/表单标识、动态日期范围错误、校验通知 |
| DateRangePicker | RangePicker | X DateRangePicker | 两端校验、无效预设禁用、只读/清空配置、可定制字段标签 |
| NumberField | InputNumber | Number Field 官方 Base UI 组合示例 | 只读、Escape 撤销、空值步进修正、动态边界反馈、控制按钮配置 |
| RemoteMultiSelect | Select multiple | Autocomplete multiple | 连续选择、多选语义、空查询 Backspace、删除后焦点、只读、原生表单提交 |
| TreeSelect | TreeSelect / Tree | X Tree View | 已选项进入焦点、字符定位、批量键盘操作、结构节点、收起后焦点、只读 |
| DataTable 扩展 | Table | Table / X Data Grid | 单选/隐藏全选、取消排序、禁止展开约束、稳定详情 ID、行标题、多固定列自动偏移 |
| Pagination 扩展 | Pagination | TablePagination | 首末页、独立禁用/名称、未知总量和越界恢复、边界焦点 |
| Background | Layout / ConfigProvider tokens | Box / Paper / theme | 保留六场景语义与局部覆盖；补 DOM ref |
| AppShell | Layout.Sider / Drawer | permanent / temporary Drawer | 独立受控移动抽屉、正确左右方向、栏宽/断点配置、缩放下容器判断 |
| MediaCard | Card / Image | CardActionArea / CardMedia / CardActions | 独立重试等 actions、原生属性/ref、打开与选择保持分离 |
| MediaViewer | Image PreviewGroup / Modal | Dialog + 自定义画廊 | 方向键、首尾禁用与焦点、defaultOpen、可直接切换信息栏、嵌套编辑与播放按键隔离 |
| StatusTimeline 扩展 | Slider + Popover | Slider + 浮层 | 稳定 ID、受控/默认选中与开关、禁用、键盘进入详情 |
| TrendChart | 独立 Ant Design Charts Line / Column | X LineChart / BarChart | 键盘/指针逐点查看、受控高亮、格式化、原始数据保留、极值坐标修正 |
| StackedBar | Ant Design Charts Bar percent | X stacked BarChart | 数值格式化、零值不留假色段；保留未知总量保护 |

## 详细 API 与交互证据

- [表单逐项对照](audits/FORMS_ANTD_MUI.md)：5 个组件、官方 API 链接、数据类型、事件、键盘、状态、表单关联及保留差异。
- [数据表与分页逐项对照](audits/DATA_ANTD_MUI.md)：选择、排序、展开、固定列、分页与焦点。
- [背景、外壳与媒体逐项对照](audits/SHELL_MEDIA_ANTD_MUI.md)：组合、受控状态、响应式、浮层及媒体导航。
- [监控逐项对照](audits/MONITORING_ANTD_MUI.md)：时段与事件轴区分、图表数值/键盘、缺失数据及格式化。
- [最终验证](ISSUE_VALIDATION.md)：以本轮实测结果为准；官方库自身能力不能替代 Rhine 的验证。

## 接入变化与范围

原有必填参数保持兼容。RemoteMultiSelect 默认选择后保持候选打开，便于连续选择；如需原行为设 `closeOnSelect`。原单选 Combobox 仍默认选完关闭。其他新参数均为可选，现有受控调用无需迁移。新导出的 `PaginationProps`、`StatusTimelineProps` 与原有组件 Props 一同从包入口可用。

保留 ISO 日期字符串、宿主服务端查询与分页、树父子独立选择、原生 table、单序列轻图表及 slot 媒体内容。自绘日历/时区适配器、树级联与虚拟化、可编辑网格、多轴图表、图像旋转缩放/播放引擎未纳入；各分项说明了为何不采用以及对应差异。组件 props 不增加 AntD/MUI 同义别名，不新增运行时依赖，不迁移消费应用。

这些变化自 0.5.0 提供，npm 0.4.0 不包含本页 API；精确制品与消费验证见[版本验收](ISSUE_VALIDATION.md)。
