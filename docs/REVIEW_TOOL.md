# 产品设计稿评审工具（自 0.11.0）

对应 [#40](https://github.com/linhay/rhine-design/issues/40)。`@linhey/rhine-design/review` 与 `/review/vite` 自 **0.11.0** 提供；npm 0.10.0 不包含它们。安装时固定 `@linhey/rhine-design@0.11.0` 并提交 lockfile，确认 registry 已提供该版本。历史同为 0.10.0 字段的本地候选快照不等同 npm 正式制品。

工具统一维护目录、搜索、评审控件、深链接、独立 iframe、模拟边界和静态构建。产品维护页面、路由、权限、状态维度、业务模拟、说明和验收记录。普通 React 设计稿、真实 App + HTTP mock、真实组件 + 平台 client 均可接入，不要求把平台接口转换成 HTTP。

评审外壳把视口分成固定头部和剩余工作区：桌面目录与右侧主区各自纵向滚动，目录搜索在滚动时保持可见；短目录不会被强制显示滚动条。窄屏目录由“场景目录”展开，展开区域有自己的滚动边界，主区仍保留独立阅读滚动；Escape 会关闭目录并把焦点归还触发按钮。消费方不需要复制或覆盖外壳 CSS。

## 运行两个合成例子

在源码仓使用 Node 24 安装依赖。两个 dev 命令分别在独立终端运行；构建/静态服务是另一种运行方式：

```sh
npm run review:http       # http://127.0.0.1:18340/review-http/
npm run review:platform   # http://127.0.0.1:18341/review-platform/
npm run review:build      # dist/review-http 与 dist/review-platform
python3 -m http.server 18342 --bind 127.0.0.1 --directory dist
```

构建后可用 `playwright-cli run-code --filename scripts/check-review-scroll.js` 验证长目录、目录/主区独立 `scrollTop`、搜索定位，以及 520/400px 窄屏目录的 Escape 焦点归还。该脚本使用真实 review 展台，并在运行时加入合成目录项以覆盖长目录边界。

示例开发服务保留各自 `/review-http/`、`/review-platform/` 路径；构建产物使用相对资源路径，可放在任意嵌套目录（例如项目型 GitHub Pages）。构建后访问 `/review-http/`、`/review-platform/`。这是本地进程地址，不是已部署的持久在线服务。关闭进程后链接失效。也可以使用 `vite preview --config examples/review/http/vite.config.ts --host 127.0.0.1` 预览对应制品；以启动输出为准。

HTTP 示例有正常、加载、空、错误、密集长文及只读角色；支持搜索、弹窗保存与延迟模块。平台示例注入内存 client，覆盖独立连接/用量维度、慢初始化、渲染异常、清理错误/挂起恢复和 Canvas 动效。示例只展示工具契约，不代表桌面原生或 iOS 验收。

开发服务没有 HMR/WebSocket：Vite 6/8 的 CSS 导入由官方样式客户端处理，修改页面后手动刷新；修改配置或工具插件后重启服务。不要用放开业务代理来换取热更新。

## 最小消费配置

在消费项目安装固定的 0.11.0 正式制品，并把 `vite`、`@vitejs/plugin-react` 放在开发依赖中。只在独立预览配置中导入 Node/Vite 入口，正式 App 不导入它：

```ts
// design/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { reviewPlugin } from '@linhey/rhine-design/review/vite';

export default defineConfig({
  root: import.meta.dirname,
  base: '/product-review/',
  plugins: [react(), reviewPlugin({ catalog: './catalog.tsx', routerBase: '/app/' })],
  build: { outDir: '../dist-review', emptyOutDir: true },
});
```

运行 `vite --config design/vite.config.ts`、`vite build --config design/vite.config.ts`、`vite preview --config design/vite.config.ts`。插件生成 `index.html` 和 `canvas.html`，消费方不复制评审外壳、URL 状态代码或工具栏。只复制/编写自身目录与页面；两个合成例子分别在 `examples/review/http`、`examples/review/platform`，共同的示例样式在 `examples/review/product.css`。

`base` 是静态资源部署路径；可用相对 `./` 或固定子路径。`routerBase` 仅覆盖产品使用的 `import.meta.env.BASE_URL`，不会改写资源路径，也不替产品建立路由。产品可在 setup 中设置 frame 内 history 并触发自己的路由更新；外层评审 hash 与产品路由各自独立。静态服务器提供带尾斜杠的目录 URL，不必为每个场景配置服务端路由。

## 场景与生命周期

```tsx
import { defineReview } from '@linhey/rhine-design/review';

export default defineReview({
  title: '产品评审',
  widths: [400, 520, 880, 1280],
  scenes: [{
    id: 'workspace', title: '工作区', group: '产品页面',
    themeRoot: 'host', // 真实 App 已有 ThemeProvider 时必须声明
    source: 'src/Workspace.tsx', // 产品仓相对路径
    dimensions: [{ id: 'role', label: '角色', options: [
      { id: 'editor', label: '编辑者' }, { id: 'reader', label: '只读成员' },
    ] }],
    async setup(context) {
      const client = createSyntheticClient(context.signal); // 产品实现
      context.onDispose(() => client.dispose());
      // 必须在模拟适配与清理回调安装后，再求值真实 App 模块。
      const { App } = await import('../src/App');
      context.signal.throwIfAborted();
      return {
        render: environment => <App client={client} theme={environment.theme}
          reducedMotion={environment.reducedMotion} paused={environment.paused} />,
        dispose() {}, // 已登记的清理由 onDispose 承担，避免重复释放
      };
    },
  }],
});
```

这是接入结构示例；`createSyntheticClient` 和 `App` 属性由产品定义，完整可运行代码见两个合成例子。

- 目录模块必须无业务副作用。App、真实平台模块、首次 API 请求放在 `setup` 安装适配之后的动态 import 内。静态 import App 会先于场景 mock 求值，属于错误接入。
- `setup(context)` 可异步。`context` 提供只读维度、`signal`、`reason`、`onDispose`、`mockHttp` 和 `report`。初始化前期获得的监听器、计时器、连接、动画和临时路由状态立即登记 `onDispose`，不能等 Promise 返回后才登记。
- `render(environment)` 返回普通 React 树；组件类型和 key 要保持稳定。主题、宽度、CSS zoom、动态偏好更新只重渲染同一实例，不重新 setup；用户自然将焦点移到外层控件时，工具不会抢回焦点。
- 场景或任一维度变化：先卸载 React 树、abort 旧请求，依次执行清理与 session.dispose，再 setup 新场景。快速切换只接纳最新选择；迟到 session 不挂载并执行 dispose。
- 显式重置在上述过程中额外调用旧 session.reset（若提供），随后重新 setup、重置内存存储与模拟状态。`reset` 是通知，不是任意业务交互的历史恢复。
- setup/渲染/异步操作失败在评审反馈区显示；不要用失败 mock 返回业务成功。清理失败保留原场景归属并继续其余清理。界面就绪与错误记录独立：新场景就绪、主题更新和重新载入都不会抹掉此前错误，需用户“确认并清除反馈”。显示最近 20 条反馈；更早错误仍计入待确认数量。
- 首次连接或场景初始化/清理超过 10 秒时显示恢复入口；超时只说明尚未确认完成，可继续等待。显式“重新载入画布”销毁旧 iframe 上下文，清空未保存草稿并保留 URL 评审条件；不会绕过挂起的清理，在旧上下文继续 setup。就绪确认绑定选择序号和 React 实际提交，旧画布消息及迟到确认不更新新状态。
- 产品清理应尽快完成且幂等；浏览器关闭/整页卸载无法保证异步清理完成，持久远端资源不属于本工具的生命周期保障。重新载入也不是远端资源清理保证。
- 产品未遵守 AbortSignal 的任意后台副作用无法被框架自动撤销；框架拒绝迟到挂载和 fetch 结果，不等于能拦截所有用户代码。目录不是第二套路由/权限系统，业务列表仍经产品模拟服务按原筛选契约查询。

## HTTP、主题与动效

`context.mockHttp(handler)` 在当前场景替换 fetch。handler 接收标准 `Request`，保留 method、body、调用方 signal，并合并场景取消，credentials 固定 omit；返回 `Response` 或 Promise。未匹配返回 undefined 会 reject 并显示失败，永不回退真实 fetch。产品负责 URL/method 白名单和合成增删改；不支持 XHR 的真实请求回退。旧 mock 若采用 `(input, options) => Response`，需薄适配传入 `request.url`、method、headers、signal，以及非 GET/HEAD 时的 `await request.text()`，或改为直接消费 Request；不能用类型断言把旧函数直接接上。

默认 `themeRoot: 'runtime'` 为普通组件提供单一 Rhine ThemeProvider。真实 App 已有 Provider 时使用 `themeRoot: 'host'`，通过 render environment 更新自己的受控 Provider，并传播减少动态属性。现有宿主若只支持内部持久化主题，需要先暴露受控主题或桥接入口；`themeRoot: host` 不自动提供该能力，示意中的 App 属性必须按真实产品接口适配。不要用写 localStorage、重建 App 或再嵌套 Provider 来冒充原位切换。主题和尺寸不进入 iframe key，Portal 与表单保留同一 DOM 实例。

默认动态选项只有 system/reduced。只有完整适配了场景中全部动画的产品才声明 `motionControls: ['full', 'paused']`，对应消费 `environment.reducedMotion`、`environment.paused`。Canvas/WebGL 必须暂停帧循环，清理时取消 rAF/监听器并释放 GPU 资源；只禁 CSS 动画不够。

平台例子证明自有 Canvas 适配，不证明 OrbitBackdrop/NeutronStarBackdrop 全局受控暂停。它们仍遵循各自契约并尊重系统减少动态；未完成适配的场景不要声明 full/paused。工具不改变这两个现有组件的公开 API。

## 分享、隔离与正式产物

主工具栏保留主题、宽度、场景维度与重置，画布直接跟随工具栏。头部“评审工具”默认关闭，使用现有 Drawer 承载更多设置、CSS 缩放、动态偏好、重新载入、尺寸和完整反馈；正常就绪不再占用主区独立行。此画布优先组合对应 [#74](https://github.com/linhay/rhine-design/issues/74)，**npm 0.11.3 尚不包含，需固定包含该变更的提交或候选 tarball**。

入口在连接中也可用；连接/初始化、失败、超时和错误计数使用短提示，不把长错误铺在画布上方。状态使用 polite live region，错误使用 alert 播报。错误在恢复就绪、主题/宽度切换和重新载入后仍保留，不因关闭侧栏自动确认；完整来源、长文和被省略的较早错误数量在反馈区可查。空反馈显示“暂无评审反馈”。“确认并清除反馈”需在嵌套确认框明确确认；取消或 Escape 不清除。失败可重试场景；超时不在未完成清理的上下文重试，只提供显式重新载入。重新载入保留评审条件，但会清空草稿。

侧栏覆盖画布，不挤压主布局；桌面和窄屏复用 Drawer 的视口约束、正文滚动和焦点限制，关闭后内容卸载、退出键盘顺序。Escape 先关闭最内层确认框，再关闭工具侧栏并归焦入口；目录的独立滚动与窄屏 Escape 契约保持不变。打开/关闭辅助区、主题/宽度变更不重建 iframe、不清空场景草稿或主动重置主区滚动，不因 ready 状态抢焦点。手动减少动态传递给侧栏的主题根，系统减少动态也遵循组件规则。开关状态不持久化，不增加布局模式 API。就绪后的反馈计数变化不主动改变主区滚动或抢焦点；首次连接成功后主工具栏会随目录信息首次出现。画布 URL 中的 CSS zoom 只缩放 iframe 内容；外层文档 CSS zoom 是独立可达性验证，二者均不等同浏览器原生页面缩放。画布尺寸显示 iframe 可用区域（不含边框）的实际宽高，以及按 CSS zoom 折算的内容宽度；例如 400px 外宽有 2px 边框时，可用宽度为 398px，200% 下约 199 CSS px。

外层 URL hash 只允许稳定 scene ID、声明的维度值、三主题、宽度预设/fit、1/2 倍 CSS zoom、动态选项。刷新、前进/后退恢复这些评审条件；未知值稳定回退，未知字段和任意表单内容不进入 URL。切换后保留的草稿不等于可序列化业务会话。CSS zoom 不代表浏览器原生缩放。

预览配置禁止读取项目 dotenv/public 目录及业务代理；环境前缀限定为显式公开的 `RHINE_REVIEW_PUBLIC_`。不要继承带秘密 define 的生产配置。iframe 先安装内存 localStorage/sessionStorage、空 Cookie 视图和请求/平台防护，再加载目录；XHR、WebSocket、Worker、IndexedDB、CacheStorage、ServiceWorker、Beacon、业务剪贴板等均拒绝或报告未实现。需要这些能力的产品必须提供自己的内存适配。

CSP 使用 `connect-src 'none'`，脚本/样式/媒体仅本地资源及允许的 data/blob；真实网络请求没有兜底。表单使用 `allow-forms` 并由 React onSubmit preventDefault，CSP 仍禁止原生提交。普通链接仅允许当前文档 hash；SPA 路由需由产品 preventDefault 并操作 history。下载、外链、整页导航、window.open 被阻止并报告。外层“复制链接”是用户主动执行的评审工具操作，不属于业务剪贴板。

**这不是执行任意不可信代码的安全沙箱。** `allow-scripts + allow-same-origin` 用于保留正常 React/路由/浮层，浏览器会提示该组合不能约束恶意同源脚本。应在专用静态站点/源托管，只装合成数据，不接真实会话；产品主动绕过防护、直接 location 导航、服务端同源 Cookie 等不由 JS 替换 API 全面隔绝。不得将产品秘密或真实后端环境注入预览。

正式构建可启用独立排除检查：

```ts
import { reviewProductionGuard } from '@linhey/rhine-design/review/vite';
// 加入正式 App 的 Vite plugins；这些是相对正式 root 的精确文件/目录。
reviewProductionGuard({ forbidden: ['./design', './src/preview-fixtures'] });
```

默认只拒绝官方 review runtime；不会把所有名为 design/fixtures 的正常生产目录误判。消费方必须登记自己的预览目录。检查基于实际输出 chunk 的模块图，随包附带的 tests/examples 不会因主入口引用自动进入 App。生产与预览使用不同 outDir；静态托管只上传对应 dist-review，不上传源码目录、环境文件或本地日志。

## 静态托管与迁移

1. 保留现有可用预览，先固定并安装通过验证的官方候选/发布制品。
2. 将产品场景与多维状态映射到 catalog；先接 HTTP/平台模拟，再动态载入页面。保留 router base、Provider 所有权与已有视觉。
3. 通过主题切换保状态、重置/清理、深链接、键盘、状态矩阵、出站检查与正式产物排除后，删除本地评审外壳/工具栏/URL 同步实现。
4. 用独立 CI 构建，在静态服务器或 GitHub Pages 上传对应 outDir；设置与部署路径一致的 base。用实际部署 URL 重验资源、画布与 hash 刷新，才能称为“已上线”。私有设计稿由消费方管理访问控制；首版没有托管 SaaS 或权限中心。

兼容与实测范围见 [验收记录](REVIEW_VERIFICATION.md)。SSR、其他构建器、实时多人协作、自动截图差异、原生平台验证均不属于首版。最终关闭 #40 还需要固定版本发布及真实消费迁移证据，不能用本地工具通过代替。
