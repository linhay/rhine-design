import { useRef, useState } from 'react';
import { Dialog, Select, SideNav, Stack, Text, Toolbar } from '../components';
export function NavActionsGallery() {
  const [width, setWidth] = useState('520');
  const [long, setLong] = useState(false);
  const [current, setCurrent] = useState('a');
  const [open, setOpen] = useState(false);
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const label = long ? '跨区域联合研究项目与长期设计验证的合成工作区' : '合成工作区';
  return <section id="nav-actions"><Stack gap={6}>
    <Toolbar title="导航行操作" description="导航链接与更多操作互为兄弟，空动作不占位。">
      <Select label="导航容器宽度" value={width} onChange={e => setWidth(e.target.value)}>{['400', '520', '880'].map(value => <option key={value}>{value}</option>)}</Select>
      <Select label="导航标题" value={long ? 'long' : 'normal'} onChange={e => setLong(e.target.value === 'long')}><option value="normal">普通</option><option value="long">长标题</option></Select>
    </Toolbar>
    <div style={{ width: `${width}px`, maxWidth: '100%' }}><SideNav aria-label="行操作示例" currentId={current} onNavigate={(item, event) => { event.preventDefault(); setCurrent(item.id); }} groups={[{ label: '合成项目', items: [
      { id: 'a', label, href: '#nav-actions', icon: 'chart', actions: [{ id: 'details', label: '查看详情', onSelect: trigger => { returnFocus.current = trigger; setOpen(true); } }, { id: 'disabled', label: '暂不可用动作', disabled: true, onSelect: () => {} }] },
      { id: 'b', label: '没有动作的工作区', href: '#nav-actions', actions: [] },
    ] }]} /></div>
    <Text role="status">当前导航：{current === 'a' ? label : '没有动作的工作区'}</Text>
    <Dialog trigger={<button hidden type="button">受控详情入口</button>} title="工作区详情" description="由菜单打开的受控 Dialog。关闭后回到原行更多按钮。" open={open} onOpenChange={setOpen} onCloseAutoFocus={event => { event.preventDefault(); returnFocus.current?.focus(); }}>
      <Text>纯合成内容；动作由调用方提供，不含权限判断。</Text>
    </Dialog>
  </Stack></section>;
}
