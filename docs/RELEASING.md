# npm 发布

包名为 `@linhey/rhine-design`，发布到 `https://registry.npmjs.org/`，access 固定 public。GitHub 仓库 `linhay/rhine-design` 已公开；HTTPS 克隆与 npm 安装均不需要专用仓库读取凭据。推送和发布仍需维护者权限。

## 候选准备

1. 确认 main、工作区、版本和 CHANGELOG；版本已存在时递增，不覆盖、不移动已发布 tag。
2. 执行 `npm ci`、`npm run check`。预览构建不等于包消费可用，须额外安装实际 tarball 验证新包入口、主题 CSS、Logo SVG。
3. 从干净的精确提交打包：`npm pack --json --pack-destination <制品目录>`。检查文件清单与体积，只包含声明的组件、通用规范、演示和测试；不得包含凭据、个人配置或产品专属资料。
4. 保存源码 SHA、包名/版本、tarball SHA-256 与 npm integrity；候选制品与发布制品使用同一文件。

## 发布与验证

先执行 `npm whoami --registry=https://registry.npmjs.org/` 确认认证。失效时使用 `npm login --auth-type=web`，密码与验证码只在官方页面输入；不在聊天、脚本参数或仓库中保存 token。

```sh
npm publish <已验证的tgz> --access public --tag latest --registry=https://registry.npmjs.org/
npm view @linhey/rhine-design@<版本> version dist.integrity dist.tarball --registry=https://registry.npmjs.org/
```

发布目录时 prepublishOnly 会运行检查；发布 tarball 时不能假设它重跑源码检查，必须先完成候选验证。npm 如要求浏览器或双因素确认，由有权限的维护者完成，不重复提交状态不明的发布请求。

发布后从 registry 在仓库外安装精确版本，再验证导入、构建及 CSS/SVG；回读 integrity 与候选一致后才能记录成功。源码 main、签名版本 tag、registry 版本和制品摘要分别留证。

失败版本优先发布修复版本。需要撤回推荐时恢复 prior dist-tag 或标记 deprecate，不能假定公开包可随时删除；相关远端修改需明确授权。首次发布没有 prior 版本，发布前验证尤其重要。

当前包导出 TS/TSX/CSS 源码，支持范围是已验证的 React19/Vite 消费；未将 npm 发布外推为任意 SSR、Node-only 或原生平台兼容。项目采用 Apache-2.0，发布包必须包含 LICENSE 与 NOTICE，并保持 package.json 中的许可标识一致。
