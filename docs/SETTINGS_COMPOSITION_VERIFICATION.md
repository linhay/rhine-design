# 设置页组合验收（#53，未发布）

2026-10-27，Node 24 / macOS / Chrome，合成更新数据；生产源码见本记录所属PR的最终head。生产入口 `?fixture=settings-composition`，脚本 `scripts/check-settings-composition.js` 从当前页面取origin。

- PASS：`npm run check`，42文件/319测试、类型、生产构建、评审示例及包清单。
- PASS：三主题 × 400/520/880 × 100%/200% CSS zoom，共18组；长文、四种更新状态、状态/按钮右边缘、隐藏包装折叠、有动作重新显示、侧栏键盘收起/恢复与焦点、窄窗Drawer/Escape及重置。
- PASS：隔离Chrome profile的网页缩放设置200%，CSS zoom保持1；400/520/880物理视口分别读回200/260/440 CSS px，三主题9组同样断言通过。脚本当前URL加`native=1`运行该矩阵；须先在浏览器设置原生200%，该参数本身不改变缩放。
- PASS：系统与手动减少动态下检查中spinner计算动画时长均0s；仍显示检查状态。页面异常0。
- FAIL（保留）：首次脚本使用CLI沙箱不存在的URL构造器；改用字符串取origin后重跑。服务未启动时一次连接拒绝；非持久浏览器访问设置页关闭，切换独立持久profile后可设置并读回原生缩放。这些不算组件通过，也不据此推断其他环境。
- N/A：真实更新服务、原生桌面导航、npm发布与消费产品升级。

生产主JS SHA-256 `948e14150240d83e06da598224ef2617e4d7c82002e426c3451a0d0c2486205f`；主CSS `355db57d7b8ece745fc6ced6ea2d2fda85afae3bb05e1008abd56c6b7000a4fc`。原始日志和截图保留在本地任务证据，不公开本机路径。
