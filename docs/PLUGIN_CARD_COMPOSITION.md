# 插件管理卡片组合配方

这份配方适用于桌面插件管理页：多个插件摘要卡在两列网格中保持相同节奏，而某个插件的分组配置、开关、删除动作和警告等密集内容放在对话框中按需展开。它描述宿主如何组合现有组件，不新增卡片组件、`ThemeName` 或业务数据 API。

## 适用边界

- 摘要卡与同级卡片共用相同的宽度、标题/说明/状态层级和操作区位置。
- 摘要卡保持网格中的单个单元；打开配置不会把它扩展成整行，也不会改变其他卡片的对齐。
- 密集配置属于对象编辑任务，使用 `Dialog` 承载；开关、删除和不可逆影响在对话框内就地说明。
- 业务层拥有插件数据、草稿、保存状态、权限和请求取消；组件只负责布局、原生交互和焦点边界。

## 推荐结构

`Surface` 提供卡片边界，`Stack` 组织标题和正文，`Badge` 表示只读状态，`Inline` 放置操作。操作区可以由宿主传入多个按钮，但每个动作都必须有明确名称；配置触发器与删除动作保持为兄弟控件，避免把整个卡片变成一个含嵌套按钮的链接。

```tsx
import { useState } from 'react';

import {
  Badge,
  Button,
  Dialog,
  Inline,
  Stack,
  Surface,
  Switch,
  Text,
} from '@linhey/rhine-design';

export function PluginCard({ plugin, onDelete, onSave }: Props) {
  const [groupEnabled, setGroupEnabled] = useState(plugin.groupEnabled);

  return (
    <Surface aria-labelledby={`plugin-${plugin.id}-title`}>
      <Stack gap={4}>
        <Stack gap={2}>
          <Text as="h3" variant="heading" id={`plugin-${plugin.id}-title`}>
            {plugin.name}
          </Text>
          <Text>{plugin.description}</Text>
          <Inline gap={2}>
            <Badge tone={plugin.status === 'ready' ? 'success' : 'warning'}>
              {plugin.statusLabel}
            </Badge>
            <Text variant="caption" tone="muted">{plugin.versionLabel}</Text>
          </Inline>
        </Stack>

        <Inline gap={2}>
          <Dialog
            title={`配置 ${plugin.name}`}
            description="修改分组设置后保存；删除操作会影响该插件的配置。"
            trigger={<Button variant="secondary">配置分组</Button>}
          >
            <Stack gap={4}>
              <Switch
                label="启用分组"
                checked={groupEnabled}
                onCheckedChange={setGroupEnabled}
              />
              {plugin.warning && <Text tone="warning">{plugin.warning}</Text>}
              <Inline gap={2}>
                <Button onClick={() => onSave(plugin.id, { groupEnabled })}>
                  保存配置
                </Button>
                <Button variant="danger" onClick={() => onDelete(plugin.id)}>
                  删除插件
                </Button>
              </Inline>
            </Stack>
          </Dialog>
        </Inline>
      </Stack>
    </Surface>
  );
}
```

示例中的 `Props`、保存结果和权限判断属于宿主。对话框关闭后，宿主决定是否保留草稿、显示错误或重新读取摘要；组件不把本地开关变化当成保存成功。

## 状态与内容规则

摘要卡至少保留插件身份、短说明、当前状态和主要操作。状态文字不能只依赖颜色；加载、失败、无权限和部分数据都应在卡片或对话框中说明下一步。长名称、版本号和警告自然换行，不能用缩小业务字号、裁剪文本或固定卡片高度来维持网格。

分组配置中的删除、权限和不可逆影响与相关动作同处可见。若配置尚未保存，关闭或切换时由宿主决定是否提示；不要让卡片网格承担草稿确认。删除失败要保留输入和错误上下文，不能先移除摘要卡再等待结果。

## 响应式与验收

宿主用 CSS Grid 或等价布局控制列数，卡片内容使用现有 tokens 和组件样式，不复制 `rhine-surface` 的私有 CSS。至少检查：

- 400、520、880 CSS px 容器中的两列、单列和自然换行；配置打开时不改变同级卡片的网格占位。
- 100% 与 200% CSS zoom 下的长名称、长警告、版本字符串和按钮命中区；主要操作保持至少 44px 目标。
- 从卡片操作进入对话框、Tab/Shift+Tab、Escape 关闭并归还到触发器；嵌套浮层先关闭内层。
- 加载、保存失败、无权限、空分组和删除失败；失败时保留原摘要与草稿。
- 系统或手动减少动态下，打开/关闭与错误反馈仍直接可用。

原生浏览器缩放、屏幕阅读器语音和真实后端请求需要消费项目另行验证。该配方只约束公开组件的组合方式，不代表任何具体产品已经完成这些环境的验收。
