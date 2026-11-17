# Rhine Design Web Agent 入口

当前仓库维护 Web 组件库。先核对目标检出、分支和未提交改动，再按任务选择入口。

如果本仓属于 Rhine Design 本地管理工作区，先读取管理仓根 `AGENTS.md`。可用 `git worktree list` 定位此仓的主检出，再核对上一级目录的 `repos.json` 是否把主检出列为 `web/`。独立克隆直接使用下表。

| 任务 | 入口 |
| --- | --- |
| 开发、验证、贡献 | [贡献指南](CONTRIBUTING.md)，Node 版本与命令核对 [package.json](package.json) |
| 设计规范、组件选型与契约 | [Web 设计体系导航](docs/README.md)、[组件目录](components/CATALOG.md) |
| 维护随包 Skill | [Skill 源文件](skills/rhine-design/SKILL.md)、[文档与 Skill 验证](CONTRIBUTING.md#文档与-ai-skill) |
| 消费方接入 | [安装与示例](README.md)、[进阶接入说明](docs/AGENT_ONBOARDING.md) |

当前源码能力以本检出的组件契约与公开导出为准。核对消费方能力时使用实际安装版本的契约与随包 Skill。
