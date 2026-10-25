# 侧栏双行多选

`Checkbox layout="row"` 是未发布源码能力，npm 0.9.1 尚不包含。适用于侧栏、来源列表和筛选项；导航仍用 SideNav，需要内容卡片时用 SelectionCard。

```tsx
<Checkbox layout="row" label="示例项目 A" hint="内存卡 · 14 项"
  checked={selectedIds.includes('a')}
  onChange={event => updateSelection('a', event.target.checked)} />
```

- 默认 `layout="form"` 保留原表单布局；`CheckboxProps` 从公共入口导出，继续接受原生 name/value、受控与非受控状态及事件。
- row 的复选框单独占 18px 列，与文字列间隔 8px。名称 14/22px，使用标签字重 token（默认 500，橙趣主题 600）；说明 12/18px、400，二者相隔 4px，具有同一文字起点。长名称与长连续字符串自然换行，不缩字或截断。
- 行使用上下左右对称 8px 内距、最小 44px 命中高度，随文字自然增高。两行基础高度为 62px（22+4+18+16+2），不用 44px 名称行的透明余量充当文字间距。宿主用 Stack gap={2} 排列，避免覆盖内部 label CSS。
- 外边框内的说明、文字及留白全部属于同一个原生 label；一次点击仅触发一次原生 change，Space 保留原生键盘选择。说明用 aria-describedby 关联，默认可访问名称只包含名称文字；调用方的 aria-label / aria-labelledby 继续生效。
- checked 与 indeterminate 使用主题选中背景、强调边界及原生勾选/混合态；focus-visible 使用行内焦点框，紧贴滚动边缘也不会因外扩而裁切。disabled 保持可读并禁止选择，仍可展示已选状态。
- 混合态由宿主根据选中 IDs 计算；原生 checkbox 没有只读行为，禁用交互请使用 disabled。label/hint 保持纯文本，不在整行 label 内嵌链接或其他交互控件。

真实展台 `#checkbox-rows` 提供 160/240/320px 侧栏、单行/长名称、说明有无、混合态、禁用与默认表单对照。验收以实际文字行框、对称内距、完整点击区域和键盘焦点为准；CSS zoom 与原生浏览器菜单缩放分别记录。

## 验证（2026-10-26）

Node 24 下 259 测试、类型检查与生产构建通过。Chromium 三主题 × 400/520/880px 视口 × 100%/200% CSS zoom × 160/240/320px 侧栏，共 54 组几何检查通过；侧栏实际宽度受可用空间限制。验证名称/说明行框、字重、4px 间隔、同列起点、对称留白、最小 44px、无横溢出，并执行说明点击、行内留白点击、Tab 焦点、Space、混合态与禁用检查。三主题 400px / 200% 截图已检查，长名称、说明与焦点可见。未覆盖原生浏览器菜单缩放或所有浏览器。

先执行 `npm run check`，再在一个终端启动并保留预览：

```sh
npx vite preview --host 127.0.0.1 --port 18529 --strictPort
```

在另一终端运行浏览器回归：

```sh
playwright-cli -s=checkbox-rows open 'http://127.0.0.1:18529/#checkbox-rows'
mkdir -p output/playwright/issue-29
playwright-cli -s=checkbox-rows run-code --filename=scripts/check-checkbox-rows.js
```
