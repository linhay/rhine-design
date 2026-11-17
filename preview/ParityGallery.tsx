import { useState } from 'react';
import { ManagementIconsGallery } from './ManagementIconsGallery';
import { ControlledTreeGallery } from './ControlledTreeGallery';
import { BoundaryExamples } from './BoundaryExamples';
import { ImageResourceGallery } from './MediaGuideGallery';
import { AutoComplete, Card, Column, Columns, ConfigProvider, CountBadge, Descriptions, Dropdown, EventTimeline, Flex, Form, Image, List, Message, Notification, Popconfirm } from '../components';
import { Button, Text, TextField, Select, Surface, Dialog, Cascader, Mentions, NavigationMenu, TreeSelect, Util } from '../components';

export const parityGalleryIds = ['icon', 'flex', 'grid', 'dropdown', 'auto-complete', 'form', 'badge', 'card', 'collapse', 'descriptions', 'image', 'list', 'timeline', 'tree', 'message', 'notification', 'popconfirm', 'config-provider', 'menu', 'tree-select', 'util'] as const;

export function ParityGallery({ id }: { id: string }) {
  const [picked, setPicked] = useState('未选择');
  const [nav, setNav] = useState('overview');
  const [treeValue, setTreeValue] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string[]>(['root']);
  const [density, setDensity] = useState<'regular' | 'compact'>('compact');
  const [number, setNumber] = useState('120');
  const [text, setText] = useState('');
  const [saved, setSaved] = useState('未提交');
  const [confirmed, setConfirmed] = useState('未确认');
  const [note, setNote] = useState(true);
  const [notice, setNotice] = useState(true);
  if (id === 'icon') return <ManagementIconsGallery/>;
  if (id === 'flex') return <Flex wrap gap={3}><Button>第一项</Button><Button variant="secondary">第二项</Button><Button variant="quiet">窄容器可换行</Button></Flex>;
  if (id === 'grid') return <Columns><Column span={16}><Text>16 / 24</Text></Column><Column span={8}><Text>8 / 24</Text></Column></Columns>;
  if (id === 'dropdown') return <><Dropdown label="更多操作" items={[{ id: 'copy', label: '复制' }, { id: 'disabled', label: '不可用', disabled: true }]} onSelect={setPicked} /><Text>{picked}</Text><NestedOverlayExample /></>;
  if (id === 'auto-complete') return <AutoComplete label="工作区" value={text} onChange={setText} options={['研究工作区', '协作工作区']} />;
  if (id === 'form') return <Form label="示例表单" onSubmit={() => setSaved('已提交本地草稿')}><Text>{saved}</Text><Button type="submit">提交</Button></Form>;
  if (id === 'badge') return <CountBadge count={8} label="条未读"><Button variant="secondary">收件</Button></CountBadge>;
  if (id === 'card') return <Card title="研究计划" extra={<Button variant="quiet">详情</Button>}><Text>卡片只组织标题和内容，不请求数据。</Text></Card>;
  if (id === 'collapse') return <BoundaryExamples id={id} />;
  if (id === 'descriptions') return <Descriptions title="概要" items={[{ label: '状态', value: '可调度' }, { label: '数量', value: '12' }]} />;
  if (id === 'image') return <ImageResourceGallery />;
  if (id === 'list') return <List label="资源" items={[{ id: '1', title: '研究资源 A', description: '只读列表' }, { id: '2', title: '协作资源 B' }]} />;
  if (id === 'timeline') return <EventTimeline label="事件" items={[{ id: '1', time: '09:30', title: '创建' }, { id: '2', time: '10:15', title: '更新说明' }]} />;
  if (id === 'tree') return <ControlledTreeGallery/>;
  if (id === 'message') return note ? <Message title="已保存演示" onClose={() => setNote(false)}>这不是全局队列。</Message> : <Text>提示已关闭。</Text>;
  if (id === 'notification') return notice ? <Notification title="有一条待查看事项" description="通知留在页面上，直到明确关闭。" onClose={() => setNotice(false)} /> : <Text>通知已关闭。</Text>;
  if (id === 'popconfirm') return <><Popconfirm label="移除示例" title="确认移除这项演示？" onConfirm={() => setConfirmed('已确认移除')} /><Text>{confirmed}</Text></>;
  if (id === 'config-provider') return <><Select label="局部密度" value={density} onChange={event => setDensity(event.target.value as 'regular' | 'compact')}><option value="regular">常规</option><option value="compact">紧凑</option></Select><ConfigProvider density={density}><Surface><TextField label="区域名称" defaultValue="草稿不随密度切换丢失" /><Button>区域动作</Button><Dropdown label="区域菜单" items={[{ id:'details', label:'查看详情' }]} onSelect={setPicked} /><Card title="区域卡片"><Text>密度影响内边距和字段间距；命中高度仍至少44px。</Text></Card><ConfigProvider density="regular"><Surface><TextField label="嵌套常规名称" defaultValue="内层独立恢复" /><Button>内层动作</Button></Surface></ConfigProvider></Surface></ConfigProvider></>;
  if (id === 'menu') return <><NavigationMenu label="横向页面导航" currentId={nav} items={[{ id:'overview', label:'概览', href:'#menu' }, { id:'files', label:'资料', href:'#menu' }, { id:'locked', label:'不可用', href:'#menu', disabled:true }]} onNavigate={(item, event) => { event.preventDefault(); setNav(item.id); }} /><NavigationMenu label="纵向页面导航" orientation="vertical" currentId={nav} items={[{ id:'overview', label:'概览', href:'#menu' }, { id:'files', label:'资料', href:'#menu', children:[{ id:'notes', label:'工作笔记', href:'#menu' }] }]} onNavigate={(item, event) => { event.preventDefault(); setNav(item.id); }} /><Text>当前：{nav}</Text></>;
  if (id === 'tree-select') return <><TreeSelect presentation="dropdown" label="下拉资料选择" nodes={[{ id:'root', label:'研究', selectable:false, children:[{ id:'a', label:'资料 A' }, { id:'b', label:'资料 B' }, { id:'locked', label:'不可选', disabled:true }] }]} value={treeValue} onValueChange={setTreeValue} expandedKeys={expanded} onExpandedChange={setExpanded} /><Text>当前选择：{treeValue.join('、') || '无'}</Text></>;
  if (id === 'util') return <><TextField label="待钳制数值" value={number} onChange={event => setNumber(event.target.value)} /><Text>Util.clamp(Number(value), 0, 100)：{Util.clamp(Number(number), 0, 100)}</Text><code>{Util.classNames('rhine-demo', true && 'is-active', false)}</code><Text>只提供 classNames / clamp 纯函数，不访问 DOM 或请求数据。</Text></>;
  return null;
}

function NestedOverlayExample() {
  const [path, setPath] = useState<string[]>([]), [text, setText] = useState(''), [mention, setMention] = useState('请 @');
  return <Dialog title="嵌套浮层检查" trigger={<Button variant="secondary">在对话框中检查浮层</Button>}>
    <Dropdown label="对话框操作" items={[{ id:'view', label:'查看示例' }, { id:'locked', label:'不可用', disabled:true }]} onSelect={() => undefined} />
    <AutoComplete label="对话框补全" value={text} onChange={setText} options={['研究工作区', '协作工作区']} />
    <Cascader label="对话框级联" value={path} onChange={setPath} options={[{ value:'east', label:'东区', children:[{ value:'docs', label:'资料库' }] }]} />
    <Mentions label="对话框备注" value={mention} onChange={setMention} options={['林可', '周宁']} />
    <Popconfirm label="确认示例" title="是否执行本地演示？" onConfirm={() => undefined} />
    <Image alt="嵌套预览" />
    <Button variant="secondary">末尾动作</Button>
  </Dialog>;
}
