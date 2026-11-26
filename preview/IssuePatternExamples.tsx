import { useState } from 'react';
import { Button, CopyButton, Dialog, Disclosure, Grid, Inline, Stack, Surface, Switch, Text } from '../components';
import './patterns.css';

const terminalTemplate = 'rhine-client connect --credential-env RHINE_DEMO_CREDENTIAL';
const desktopTemplate = '[connection]\ncredential_env = "RHINE_DEMO_CREDENTIAL"';
const manualTemplate = 'workspace = "example-workspace"';

export function CredentialInstructionsExample() {
  return <Surface className="ds-gap-top">
    <Dialog title="客户端接入配置" trigger={<Button>打开凭据示例</Button>}
      description="先查看所用客户端的模板，再生成一次性示例凭据。">
      <CredentialInstructions />
    </Dialog>
  </Surface>;
}

function CredentialInstructions() {
  const [issued, setIssued] = useState(false);
  return <Stack>
    <Disclosure title="命令行客户端" lazyMount>
      <Stack gap={2}>
        <pre className="ds-pattern-template" tabIndex={0} aria-label="命令行配置模板"><code>{terminalTemplate}</code></pre>
        <CopyButton label="复制命令行模板" value={terminalTemplate} />
      </Stack>
    </Disclosure>
    <Disclosure title="桌面客户端" lazyMount>
      <Stack gap={2}>
        <pre className="ds-pattern-template" tabIndex={0} aria-label="桌面配置模板"><code>{desktopTemplate}</code></pre>
        <CopyButton label="复制桌面模板" value={desktopTemplate} />
      </Stack>
    </Disclosure>
    <Inline gap={2}>
      <Button aria-disabled={issued} onClick={() => setIssued(true)}>生成示例凭据</Button>
    </Inline>
    <Text role="status">{issued ? '签发结果（仅本次打开显示）：demo-result-only' : ''}</Text>
  </Stack>;
}

export function MixedSettingsCardsExample() {
  const [signedIn, setSignedIn] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [activity, setActivity] = useState(true);
  return <Stack className="ds-gap-top" role="region" aria-label="混合卡片示例">
    <Surface>
      <Stack gap={2} role="group" aria-label="当前账号">
        <Text as="h3" variant="heading">当前账号</Text>
        <Text role="status">{signedIn ? '示例账号 · 已登录' : '尚未登录'}</Text>
        <Inline><Button onClick={() => setSignedIn(current => !current)}>{signedIn ? '退出示例账号' : '登录示例账号'}</Button></Inline>
      </Stack>
    </Surface>
    <Surface>
      <Stack gap={2} role="group" aria-label="通知与活动">
        <Text as="h3" variant="heading">通知与活动</Text>
        <Switch layout="row" label="同步通知" hint="同步失败时显示通知。" checked={notifications} onCheckedChange={setNotifications} />
        <Switch layout="row" label="活动记录" hint="在本地列表显示最近的操作。" checked={activity} onCheckedChange={setActivity} />
      </Stack>
    </Surface>
    <Grid minWidth={260}>
      <Surface>
        <Disclosure title="导出说明"><Text>导出可用于备份当前偏好。</Text></Disclosure>
      </Surface>
      <Surface>
        <Disclosure title="快捷键说明"><Text>在工作区设置中查看可用快捷键。</Text></Disclosure>
      </Surface>
    </Grid>
  </Stack>;
}

export function ExternalAppHandoffExample() {
  const [attempted, setAttempted] = useState(false);
  return <Surface className="ds-gap-top">
    <Stack gap={3}>
      <Text>本示例模拟桌面客户端交接。</Text>
      <Inline><Button onClick={() => setAttempted(true)}>尝试打开桌面客户端</Button></Inline>
      <Text role="status">{attempted ? '已尝试打开桌面客户端。请在客户端继续配置。' : ''}</Text>
      <Disclosure title="查看手工配置" lazyMount>
        <Stack gap={2}>
          <pre className="ds-pattern-template" tabIndex={0} aria-label="手工配置模板"><code>{manualTemplate}</code></pre>
          <CopyButton label="复制手工配置" value={manualTemplate} />
        </Stack>
      </Disclosure>
    </Stack>
  </Surface>;
}
