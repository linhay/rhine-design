import { useState } from 'react';
import { Button, Dialog, SettingsNavigation, SideNav, Stack, Surface, Text } from '../components';

const restrictedLabel = '待开放的跨区域联合研究与长期验证工作区';
export function DisabledNavigationGallery() {
  const [disabled, setDisabled] = useState(true);
  const [current, setCurrent] = useState('restricted');
  const [count, setCount] = useState(0);
  const [setting, setSetting] = useState('general');
  const [locked, setLocked] = useState(false);
  const destination = new URLSearchParams(location.search).get('navigationTarget');
  const target = (id: string) => `?navigationTarget=${id}#nav-actions`;
  return <Surface><Stack gap={4}>
    <h3>禁用导航与原生链接</h3>
    {destination && <Text role="status">独立导航目标：{destination === 'available' ? '可用工作区' : restrictedLabel}</Text>}
    <Button variant="secondary" onClick={() => setDisabled(value => !value)}>{disabled ? '启用待开放工作区' : '禁用待开放工作区'}</Button>
    <SideNav aria-label="禁用导航示例" currentId={current} groups={[{ label: '合成工作区', items: [
      { id: 'available', label: '可用工作区', href: target('available') },
      { id: 'restricted', label: restrictedLabel, href: target('restricted'), disabled, actions: [{ id: 'inspect', label: '查看合成摘要', onSelect: () => setCount(value => value + 1) }] },
    ] }]} onNavigate={(item, event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault(); setCurrent(item.id); setCount(value => value + 1);
    }} />
    <Text role="status">导航与动作回调：{count}</Text>
    <Dialog title="禁用设置栏目" trigger={<Button variant="secondary">打开设置禁用示例</Button>} height={560}
      navigation={<SettingsNavigation label="合成设置栏目" currentId={setting} disabled={locked} items={[{ id: 'general', label: '常规设置' }, { id: 'restricted', label: '待开放栏目', disabled }, { id: 'appearance', label: '外观设置' }]} onNavigate={item => setSetting(item.id)} />}
      footer={<Button variant="secondary" onClick={() => setLocked(value => !value)}>{locked ? '解锁栏目切换' : '锁定栏目切换'}</Button>}>
      <Text>当前栏目：{setting}</Text><Text>禁用栏目不接收切换；宽屏侧栏与窄屏选择器共享状态。</Text>
    </Dialog>
  </Stack></Surface>;
}
