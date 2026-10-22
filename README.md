# 莱茵设计 · Rhine Design

linhay 的通用设计规范与 React 组件系统，独立规划、验证和迭代。以暖白、苔绿、三角几何、精密细线和克制动效建立跨产品的界面语言。

- 仓库：[linhay/rhine-design](https://github.com/linhay/rhine-design)，个人私有仓库，主分支 main。
- npm 包名与导入标识：**`@linhay/rhine-design`**，当前版本 **0.2.0**；尚未发布公共 npm 包。
- 当前能力：40 个 React 组件、字体与文字规范、10 组可重播动效、启动编排演示。不依赖消费产品的 API、认证、文件或业务状态。

## 规范与源码

| 内容 | 入口 |
| --- | --- |
| 通用设计规范 | [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) |
| 组件 API 与组合 | [组件说明](components/README.md)、[常用组件契约](components/COMMON_COMPONENTS.md) |
| 字体与文字 | [TYPOGRAPHY.md](components/TYPOGRAPHY.md) |
| 动效与启动 | [MOTION.md](components/MOTION.md)、[STARTUP.md](components/STARTUP.md) |
| 设计模式与演示 | [设计索引](design/README.md)、preview/ |
| 系统对照与缺口 | [DESIGN_SYSTEM_AUDIT.md](docs/DESIGN_SYSTEM_AUDIT.md) |
| 版本与迁移 | [CHANGELOG.md](CHANGELOG.md) |

components/ 是可消费源码，preview/ 使用同一组件演示交互，tests/ 验证组件及演示行为。具体产品的页面、接口、品牌应用与发布资料由消费项目维护。

## 独立开发

使用 Node 24：

```sh
git clone git@github.com:linhay/rhine-design.git
cd rhine-design
npm ci
npm run dev
# http://127.0.0.1:18309/#foundation
# /#typography /#motion /#startup
npm run check
```

check 运行测试、类型检查、展台构建，以及主题 CSS/SVG 保留检查。dist/ 是展台产物；本包导出 TS/TSX 源码。开发与验证无需消费项目 checkout。

## 项目接入

在目标 React/Vite 项目登记并提交固定版本的子模块：

```sh
git submodule add -b main git@github.com:linhay/rhine-design.git vendor/rhine-design
git submodule update --init -- vendor/rhine-design
cd vendor/rhine-design
npm ci
cd ../..
npm install ./vendor/rhine-design
```

```tsx
import { Button, Surface, Text } from '@linhay/rhine-design';

export function Example() {
  return <div className="tod-theme">
    <Surface>
      <Text as="h2" variant="section">开始新的工作</Text>
      <Button onClick={() => { /* 宿主动作 */ }}>继续</Button>
    </Surface>
  </div>;
}
```

要求 React 19；运行依赖见 package.json。目标构建器须支持 TS/TSX、CSS 导入及 Vite SVG `?no-inline` 引用。本地链接配置 `resolve.dedupe: ['react', 'react-dom']`，保证只有一份 React。未验证任意 SSR 或原生移动端。

入口自动加载样式。现有 tod- CSS/变量命名空间暂保留，避免在包身份迁移中附带无必要的样式 API 破坏；它不定义产品归属。使用 .tod-theme 主题根，浮层继承最近主题根；根上不设置 transform、裁剪或 contain。

只消费组件公开入口，不导入演示模拟状态。Logo 默认字标为 Rhine Design，可用 wordmark 和 label 配置文字；宿主负责数据、认证、搜索分页、请求取消及真实操作结果。

私有仓的消费项目 CI 需要独立获得本仓只读权限，默认 GITHUB_TOKEN 不自动获得跨仓读取权限；凭据名称和配置由消费项目维护，不构成库 API。源码使用遵循所有者授权，当前未授予开源许可。

## 独立迭代与验收

1. 先更新通用规范和组件契约，再修改组件与真实展台。
2. 验证默认、禁用、加载、错误、长文本、键盘、焦点、减少动态及中断/重播。
3. 运行 npm run check；视觉变化验证400/520/880宽度与200%缩放，仓库外消费验证导入和CSS/SVG。
4. 在本仓提交并更新版本与CHANGELOG；消费项目自行选择、验收版本，不随main自动升级。破坏性API变化提供迁移说明。

本库由通用能力需求驱动，不由某个产品的开发或发布时间表定义完成条件。组件测试不代替消费产品业务或原生验收。保留 components/index.ts 与 CSS 的 sideEffects，防止打包丢失主题。
