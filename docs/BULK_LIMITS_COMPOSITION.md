# 消费限额草稿、批量预览与发布状态配方

对应 GitHub issue [#191](https://github.com/linhay/rhine-design/issues/191)。这是宿主业务的状态组合规范，复用现有 `NumberField`、`Checkbox`、`Dialog`、`Notice` 和 `Button`；不新增限额组件、版本冲突 API 或发布框架。

## 两层状态

每个字段至少区分已保存基线和当前草稿。输入先更新草稿，页面显示受影响人数；“撤销”恢复整批已保存基线。`NumberField` 继续负责非负校验，金额 `0` 明确表示“不限制”，不能被转换为空或未知。

批量 Dialog 在提交前展示选择人数、目标 scope、三组模型范围（总消费、OpenAI、Grok）和每个金额。批量动作只写入草稿，不直接触发网络保存；选择变更、草稿变更和已保存基线必须可区分。

## 保存和发布状态

统一保存是显式整批提交：

- 保存成功：显示“配置已保存”，更新整批基线。
- 版本冲突：整批失败，保留所有草稿，并提供重新读取或人工合并入口；不能显示部分成功。
- 发布成功：单独显示“已发布”，不把保存成功冒充发布成功。
- 等待同步：显示“Router 等待下一次快照同步”，保留保存/发布时间和当前草稿边界；不能声称运行时已立即生效。
- 读取延迟或失败：保留最后确认值及采集时间，使用 `Notice` 说明数据仍可能陈旧。

总消费阻断所有模型；OpenAI 或 Grok 限额只阻断对应模型。各模型消费同时计入总消费。权限不足时字段和批量动作只读，但仍显示当前值、保存时间和最后采集时间。

```ts
type LimitDraft = {
  total: number | null;  // 0 = 不限制
  openai: number | null;
  grok: number | null;
};

type SaveState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; savedAt: string }
  | { kind: 'conflict'; revision: string }
  | { kind: 'published'; publishedAt: string }
  | { kind: 'sync-pending'; snapshotAt: string | null }
  | { kind: 'error'; message: string };
```

## 关闭、焦点和权限

Dialog 关闭前若存在未保存草稿，使用现有确认组合；取消关闭返回批量入口，确认丢弃才回到已保存基线。保存、冲突和发布状态文字位于 Dialog 内部，焦点不跳到页面顶部。只读状态不能通过键盘、批量预览或脚本入口绕过。

真实后端写入、版本号来源、Router 同步和权限判断归宿主；本配方只规定可见状态与提交边界，不证明生产发布已完成。
