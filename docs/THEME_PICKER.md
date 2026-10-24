# 主题预览与选择

`ThemePicker` 与 `ThemePreview` 自 0.8.0 提供，对应 #20；0.6.0 及未发布的 0.7.0 候选不包含它们。

```tsx
function Appearance() {
  const { theme, setTheme } = useTheme();
  return <ThemePicker value={theme} onValueChange={setTheme} />;
}
```

`ThemePicker` 是受控原生单选组：`value: ThemeName`、`onValueChange(theme)`、可选 `label`（默认“界面主题”）、`disabled` 和 `options`。默认列出三套内置主题；每个 option 的 `value` 必填，`label`、`description`、`disabled`、`previewSrc` 可选。自定义 options 不应包含重复 value。

点击卡片、Space 或方向键选择会回传变更；Tab 聚焦和悬停不会应用主题。当前项同时使用勾选文字和原生 checked 状态。整组禁用及单项禁用遵循原生表单语义。库不访问 localStorage、网络业务接口或权限状态，偏好持久化由宿主决定。

`ThemePreview({ theme, src? })` 是装饰性缩略图，需由外部标题描述；默认资源随组件包交付，也可传入业务自己的合成截图。加载时预留 8:5 空间，失败保留文字与选择入口；src 变化会重试。图片中的控制不能点击，也不应成为另一套可交互 UI。

## 预览资源维护

官方图片为 960×600 PNG，由 `preview/theme-sample.html` 使用公开组件、同一个合成场景分别渲染三种主题后生成。源码为 `preview/ThemeSample.tsx`，校验记录在 `components/assets/theme-previews/manifest.json`。不包含用户数据、业务地址或外部媒体请求。

更新 tokens、主题或样本组件视觉时，同时重新生成三张图片、更新 manifest 的源文件/图片 SHA-256，并检查三张完整截图；不能只替换其中一套。使用开发服务器打开 `/preview/theme-sample.html?theme=<name>`，将视口设为 960×600，等待样本按钮和字体完成布局后截图到对应 PNG。预览是随包版本固定的样本，不跟随线上 Pages 自动变化。

静态图片不会继承宿主 CSS 或 Portal 样式，因此可同时比较主题；禁止嵌套 ThemeProvider 来制作实时缩略图。正常切换只更新宿主 Provider 的 theme 属性，不为业务子树添加新的 key。

展台 `#theme-picker` 包含三主题、长名称、加载/失败、禁用和弹窗内切换。浏览器回归覆盖 390/400/520/880/889/1440px、100%/200% CSS zoom、键盘选择、图片失败仍可选择、草稿节点与打开的 Dialog 保持。
