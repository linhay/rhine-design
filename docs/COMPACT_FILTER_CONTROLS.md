# 紧凑筛选控件

未发布源码能力，尚不代表已发布的 0.9.1 API。真实组件组合为 `preview/CompactFilterBarGallery.tsx`。

统一展台入口 `#compact-filters`，同时运行 `preview/DenseFilterControlsGallery.tsx`：100 个候选、90 个已选项及一体日期区间。`RemoteMultiSelect maxVisibleTags={2}` 默认只显示两个标签与总数，展开后使用有界滚动，不将大量已选项常驻到筛选抽屉。`DateRangePicker compact` 将两端原生日期放在同一边框内，保留无障碍标签、原生日期键盘与错误关联；极窄容器允许内部换行，不能裁切日期。

- `SegmentedControl fullWidth` 占满可用行宽，选项等宽；长标签在所属选项中换行。选中背景和可见文本区域共同撑满 label，文字水平/垂直居中，不把扩大点击区域误认为扩大选中背景。
- 默认 `fullWidth=false` 保持既有按内容布局。原生 radio 的 checked、禁用、Tab 和方向键行为不变；独立实例继续使用独立 name。
- 有限标签在极窄容器内允许换行，保留完整的移除按钮；展开只影响呈现，不裁减表单值。清空或宿主将选择数降至限制以内后，再次批量选择恢复折叠。
- `ListFilterBar drawerDescription={null} drawerResult={null}` 删除可省略说明与重复统计。没有内容时不留下空段落/反馈容器；关闭后仍显示栏内完整摘要。
- 正在更新和错误不是冗余说明，抽屉打开时继续提供反馈。减少文字不能掩盖请求失败或把旧结果解释为当前条件成功。
- `Dialog` / `Drawer` 的 description 接收 ReactNode，`null` 不渲染描述，同时移除 aria-describedby；标题和关闭入口始终保留。

验收三主题、400/520/880px、200% 内容缩放及长标签；检查每个选项的几何宽度和文字中心、整个选中底色的宽度、键盘原生单选、抽屉关闭归焦、无描述时的可访问名称。JSDOM 验证语义与回调，真实浏览器验证几何。

## 回归记录（2026-10-25）

Node 24：254 项测试、类型检查和生产构建通过。生产预览下三主题 × 400/520/880px × 100%/200% CSS zoom 的 18 组检查通过，覆盖有限标签与完整移除入口、有界展开、清空后重新折叠、原生日期最后一段编辑、等宽单选键盘操作、可省略摘要及保留加载/错误、关闭归焦。400px / 200% 的三主题日期截图人工核对完整年月日与日历入口；不外推为原生菜单缩放或所有浏览器验收。

```sh
npm run check
```

在一个终端启动预览，并在浏览器检查期间保持运行：

```sh
npx vite preview --host 127.0.0.1 --port 18527 --strictPort
```

预览就绪后，在另一个终端执行：

```sh
playwright-cli -s=dense-filters open 'http://127.0.0.1:18527/#compact-filters'
mkdir -p output/playwright/issue-27
playwright-cli -s=dense-filters run-code --filename=scripts/check-dense-filters.js
```

每个矩阵场景使用独立导航参数重建示例状态，避免前次未关闭浮层导致下轮读到隐藏的底层内容。全程只使用手写合成数据。
