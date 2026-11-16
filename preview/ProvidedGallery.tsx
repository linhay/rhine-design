import { useState } from 'react';
import { Affix, Anchor, App, BorderBeam, Calendar, Cascader, FloatButton, Masonry, QRCode, Result, Slider, Spin, Splitter, Tag, TimePicker, Watermark, type CascadeOption } from '../components';
import { Surface, Text, TextField } from '../components';
import { BoundaryExamples } from './BoundaryExamples';
import { TargetTourGallery } from './MediaGuideGallery';

const options: CascadeOption[] = [{ value: 'east', label: '东区', children: [{ value: 'a', label: '工作区 A', children: [{ value: 'docs', label: '资料库' }, { value: 'notes', label: '笔记' }] }, { value: 'b', label: '工作区 B' }] }, { value: 'west', label: '西区' }];

export const providedGalleryIds = ['float-button', 'masonry', 'splitter', 'anchor', 'rate', 'slider', 'time-picker', 'cascader', 'color-picker', 'mentions', 'transfer', 'upload', 'avatar', 'calendar', 'carousel', 'listy', 'qr-code', 'tag', 'tour', 'result', 'spin', 'watermark', 'affix', 'app', 'border-beam'] as const;

export function ProvidedGallery({ id }: { id: string }) {
  const [split, setSplit] = useState(40);
  const [amount, setAmount] = useState(40);
  const [time, setTime] = useState('09:30');
  const [path, setPath] = useState<string[]>([]);
  const [day, setDay] = useState('2026-10-23');
  const [tags, setTags] = useState(['可移除', '长标签用于换行检查']);
  const [qrText, setQrText] = useState('RHINE');
  const [anchorDraft, setAnchorDraft] = useState('文内定位不卸载这一份草稿');
  if (['rate','color-picker','mentions','transfer','upload','avatar','carousel','listy'].includes(id)) return <BoundaryExamples id={id} />;
  if (id === 'float-button') return <div style={{ position: 'relative', minHeight: 160 }}><Text>悬浮按钮固定在这块演示区域的角上。</Text><FloatButton contained label="回到顶部" onClick={() => window.scrollTo({ top: 0 })}>顶部</FloatButton></div>;
  if (id === 'masonry') return <Masonry label="瀑布流示例" columns={2}><Surface>短卡片</Surface><Surface>这是一张更高的卡片，用来确认列布局不会把相邻卡片拉伸到同一高度。</Surface><Surface>第三张</Surface></Masonry>;
  if (id === 'splitter') return <><p>拖动分隔线或用左右方向键调整；Home / End 到边界。比例由本页持有。</p><Splitter label="左右比例" value={split} onChange={setSplit} start={<Text>左侧 {split}</Text>} end={<Text>右侧 {100 - split}</Text>} /></>;
  if (id === 'anchor') return <><TextField label="锚点章节草稿" value={anchorDraft} onChange={event => setAnchorDraft(event.target.value)} /><Anchor label="页内位置" getHref={target => `#anchor::${encodeURIComponent(target)}`} items={[{ id: 'anchor-a', label: '第一节' }, { id: 'anchor-b', label: '第二节' }]} /><section id="anchor-a" tabIndex={-1} style={{minHeight:'40vh'}}><h2>第一节</h2><p>锚点只滚动到标题，不改变数据。</p></section><section id="anchor-b" tabIndex={-1} style={{minHeight:'40vh'}}><h2>第二节</h2><p>当前可见标题会标出来。</p></section></>;
  if (id === 'slider') return <Slider label="示例数值" value={amount} onChange={setAmount} />;
  if (id === 'time-picker') return <TimePicker label="开始时间" value={time} onChange={setTime} />;
  if (id === 'cascader') return <Cascader label="区域" options={options} value={path} onChange={setPath} />;
  if (id === 'calendar') return <><Calendar label="日期" value={day} onChange={setDay} /><Text>已选择：{day}</Text></>;
  if (id === 'qr-code') return <><TextField label="二维码文本" value={qrText} onChange={event => setQrText(event.target.value)} /><p>{new TextEncoder().encode(qrText).length} / 78 字节；UTF-8、M 级纠错。不会自动访问码内地址。</p><QRCode label="示例码" value={qrText} /></>;
  if (id === 'tag') return <div>{tags.map(tag => <Tag key={tag} onClose={() => setTags(current => current.filter(item => item !== tag))}>{tag}</Tag>)}</div>;
  if (id === 'tour') return <TargetTourGallery />;
  if (id === 'result') return <Result status="success" title="演示已完成" description="这是本地结果，没有写入任何业务数据。" />;
  if (id === 'spin') return <Spin label="正在读取示例" />;
  if (id === 'watermark') return <Watermark text="演示"><Surface><Text>水印不阻挡阅读和点击。</Text></Surface></Watermark>;
  if (id === 'affix') return <div style={{ height: 240, overflow: 'auto' }}><Affix><Text>滚动时这段保持在容器顶部。</Text></Affix><div style={{ height: 480 }} /></div>;
  if (id === 'app') return <App label="示例应用边界"><Text>这里只划定一块区域，不创建全局提示队列。</Text></App>;
  if (id === 'border-beam') return <BorderBeam label="边框装饰"><Surface><Text>边框流动不表示加载进度。</Text></Surface></BorderBeam>;
  return null;
}
