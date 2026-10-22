# ToD-AI Design Kit

可整体复制的设计与组件套件。40个React组件、字体与动效规范、页面样稿、10组动效实验和启动动画集中于此；不依赖父目录App、Tauri、网关API或凭证配置。独立私有仓库：[dxy-cn/tod-ai-design-kit](https://github.com/dxy-cn/tod-ai-design-kit)，默认分支main；客户端通过`design-kit/`子模块固定版本。未发布公共npm包。

## Git与接入登记

```sh
# 单独使用
git clone git@github.com:dxy-cn/tod-ai-design-kit.git
cd tod-ai-design-kit

# 在其他项目登记（需有本仓库读取权限）
git submodule add -b main git@github.com:dxy-cn/tod-ai-design-kit.git vendor/tod-design-kit
# 后续按父项目固定的提交初始化，不自动追随最新main
git submodule update --init -- vendor/tod-design-kit
```

先在套件仓提交、验证并推送，再更新消费项目的gitlink。不要只提交父项目指针却遗漏子仓提交。`branch=main`是分支约定，不改变gitlink固定版本；`npm ci`、预览和验证仍在本目录执行。

拆分来源为客户端`a820ab9`下的`design-kit/`；初始过滤提交`fecfce8`与原子目录tree完全一致，未重写客户端历史。仓库内CI独立运行30项组件测试、类型检查与展台构建。客户端CI用只读部署密钥按gitlink检出本仓；不使用跨项目写权限。

## 目录与边界

```text
design-kit/
  components/   通用组件、tokens、SVG母版与组件契约
  design/       页面样稿、品牌探索及历史PDF
  docs/         产品设计规范、组件系统对照
  preview/      真实组件展台、启动/动效候选（不导出给业务）
  tests/        组件与展台行为回归
  index.html    独立展台入口
  package.json  独立依赖、源码exports和运行命令
```

- [产品规范](docs/DESIGN_SYSTEM.md)与[设计稿索引](design/README.md)：产品方向、页面与历史材料。
- [组件API](components/README.md)、[40组件契约](components/COMMON_COMPONENTS.md)、[字体](components/TYPOGRAPHY.md)：跨项目接入前必读。
- [动效](components/MOTION.md)、[启动动画](components/STARTUP.md)：通用能力与设计候选分开。启动动画未接入正式App；就绪不等待装饰播放完成。

## 独立运行

使用Node24（其他支持版本见engines）。在本目录执行，不需要启动父项目：

```sh
npm ci
npm run dev
# http://127.0.0.1:18309/#startup
# http://127.0.0.1:18309/#motion
# http://127.0.0.1:18309/design/refactor/review.html
npm run check
```

`check`运行组件/展台测试、类型检查与展台生产构建，并检查主题CSS和SVG未被打包优化删除；`dist/`是可部署的展台，不是预编译组件包。静态页面设计稿在开发服务中单独查看。可复制整个目录到别处，再执行相同命令；保留package-lock.json。不要复制node_modules、dist或父项目秘密文件。

现有客户端入口`http://127.0.0.1:18308/design/components/#startup`继续运行同一份展台；旧`/design/refactor/review.html`转向本目录样稿。父项目的`design/`与根设计Markdown只作兼容入口，不再维护第二份正文。

## 其他项目使用组件

优先整体复制本目录到目标React/Vite项目的`vendor/tod-design-kit/`，然后在目标项目安装本套件package.json声明的5个Radix运行依赖（版本照抄依赖清单），React/React DOM复用目标项目的React19。源码消费示例：

```tsx
import { Button, Surface, Text } from './vendor/tod-design-kit/components';

export function Example() {
  return <div className="tod-theme">
    <Surface>
      <Text as="h2" variant="section">连接工作空间</Text>
      <Button onClick={() => { /* 接入目标项目的动作 */ }}>继续</Button>
    </Surface>
  </div>;
}
```

也可在目标项目通过本地路径安装本套件：`npm install ./vendor/tod-design-kit`，然后从`@tod-ai/design-kit`导入。exports指向TS/TSX源码，目标构建器必须支持源码转换、CSS导入及Vite的SVG `?no-inline`引用；不宣称可直接用于Node、原生移动端或任意SSR框架。使用本地链接时保证只有一份React，Vite可配置`resolve.dedupe: ['react', 'react-dom']`。

组件入口自动加载CSS；tokens使用`--tod-`前缀，`.tod-theme`提供字体、焦点与减少动态。项目主题可在自己的`.tod-theme`根覆盖tokens。浮层Portal挂最近主题根，根节点不要设置transform、裁剪或contain。业务逻辑、后端搜索/分页、认证与真实状态仍由宿主负责。

只导入`components/`；不要把`preview/`中的合成等待、示例身份或启动演示当成业务实现。品牌Logo是ToD-AI资产，其他产品替换品牌时单独评审，不修改通用组件来嵌入产品逻辑。源码复用范围以团队已有授权为准，本目录未新增开源许可或对外发布承诺。

## 后续维护

先复用 → 先改本目录中的设计稿/展台并验证 → 再按授权迁移App。变更组件时同时更新契约与相关行为测试；变更动效须在浏览器验证中间帧、快速重播、减少动态、窄窗和200%缩放。使用独立package-lock锁定工具链；升级依赖时同步核对父项目兼容性。

套件的测试和构建不代替Tauri原生、真实登录/同步、实体输入法或屏幕阅读器验收。

## 本次验证 · 2026-10-22

- 整个套件复制到仓库外，独立`npm ci`、30项测试、类型与构建通过。
- 另建最小React/Vite消费项目，通过本地安装`@tod-ai/design-kit`导入Button/Surface/Logo，构建保留主题CSS及SVG。
- 父项目49项前端测试、8项脚本测试及正式构建通过；迁移前后正式产物文件名/内容hash保持一致。
- Chrome验证旧入口、独立开发入口和独立构建产物：主题、启动播放与连续衔接、登录本地反馈、400/520/880宽度；旧页面样稿重定向和独立样稿可加载。启动时序、200%缩放与减少动态的既有验证见[启动规范](components/STARTUP.md)。

构建约束：package.json的`sideEffects`必须保留`components/index.ts`和CSS。只把CSS标为副作用会使某些打包路径跳过入口的CSS导入，组件仍能渲染但主题丢失；`scripts/check-build.mjs`检查这一回归。
