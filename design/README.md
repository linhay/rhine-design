# 莱茵设计 · 设计模式索引

本库维护跨产品视觉规范、组件状态和动效组合，具体产品页面稿由消费项目维护。

消费项目的规范、偏好、细节、成功实践与验证发现，按[消费反馈与设计共建](../CONTRIBUTING.md#消费反馈与设计共建)查重、记录依据与范围，再回链规范、参数/配方、展台、回归和版本。个人偏好不直接成为通用默认，现有能力足够时优先补组合；发行与消费验证分别确认。

| 模式 | 规范与真实演示 |
| --- | --- |
| 视觉与文字 | [通用规范](../docs/DESIGN_SYSTEM.md)、[文字规范](../components/TYPOGRAPHY.md)，/#foundation、/#typography |
| 选择与表单 | [组件契约](../components/COMMON_COMPONENTS.md)，/#selection、/#forms |
| 数据与分页 | 同一组件契约，/#data |
| 反馈与浮层 | 同一组件契约，/#feedback、/#overlays |
| 动效过渡 | [动效规范](../components/MOTION.md)，/#motion |
| 三角构架与启动衔接 | [启动编排](../components/STARTUP.md)、[SVG母版](../components/assets/logo.svg)，/#brand、/#startup |

在仓库根运行npm run dev，上述路径相对服务根（默认18309）。播放、重播、慢放与减少动态由真实展台提供，不执行授权或业务写入。新模式先组合已有组件，缺少通用能力时再扩展组件和契约。
