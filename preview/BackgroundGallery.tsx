import { useState } from 'react';
import { Background, Button, Dialog, Select, Stack, Text, TextField, type BackgroundDecoration, type BackgroundRole } from '../components';
import './backgrounds.css';

const scenes: { role: BackgroundRole; label: string; description: string }[] = [
  { role: 'canvas', label: '页面与工作台', description: '主题纹理留在画布上，让工作区有自己的风格。' },
  { role: 'content', label: '正文与阅读', description: '默认纯色，长段文字与密集信息保持清晰。' },
  { role: 'sidebar', label: '导航与侧栏', description: '独立的底色层次，帮助辨认当前位置。' },
  { role: 'surface', label: '卡片与表单', description: '不透明的阅读表面，承载内容和输入。' },
  { role: 'overlay', label: '弹窗与浮层', description: '表面与遮罩分开配置，突出当前任务。' },
  { role: 'media', label: '图片与视频', description: '中性深色画布与浅色文字，让媒体成为焦点。' },
];

function SceneSamples({ decoration = 'auto' }: { decoration?: BackgroundDecoration }) {
  return <div className="ds-background-scenes">{scenes.map(scene => <div key={scene.role} className="ds-background-example">
    <div className="ds-background-label"><strong>{scene.label}</strong><code>{scene.role}</code></div>
    <div className={scene.role === 'overlay' ? 'ds-background-backdrop' : undefined}>
      <Background roleTone={scene.role} decoration={decoration} className="ds-background-sample">
        <Text variant="heading">{scene.role === 'media' ? '光影之间 / 16:9' : '专注于眼前的工作'}</Text>
        <Text>{scene.description}</Text>
      </Background>
    </div>
  </div>)}</div>;
}

export function BackgroundGallery() {
  const [decoration, setDecoration] = useState<BackgroundDecoration>('auto');
  return <section id="backgrounds">
    <div className="ds-section-title"><span>BACKGROUND</span><h2>背景有层次，阅读有留白</h2></div>
    <p className="ds-caption">主题决定配色，场景决定背景。默认仅画布使用主题纹理；正文、侧栏、卡片、浮层与媒体保持纯色。右上角可切换当前主题。</p>
    <div className="ds-background-controls">
      <Select label="纹理策略" value={decoration} onChange={event => setDecoration(event.target.value as BackgroundDecoration)}>
        <option value="auto">按场景默认</option><option value="theme">全部使用主题纹理</option><option value="none">全部关闭纹理</option>
      </Select>
      <Dialog title="独立的浮层表面" description="弹窗使用主题浮层底色，背后叠加独立遮罩。" trigger={<Button variant="secondary">查看实际弹窗</Button>}>
        <TextField label="浮层草稿" placeholder="试试输入，再按 Escape 返回" />
      </Dialog>
    </div>
    <SceneSamples decoration={decoration} />
    <div className="ds-background-local">
      <Background roleTone="content" appearance={{ color: '#e5ece3', textColor: '#242b28' }} className="ds-background-sample">
        <Stack gap={4}><Text variant="heading">局部覆盖 · 安静的阅读区</Text><Text>仅覆盖这一区域的底色与文字颜色，其他场景继续跟随主题。</Text><TextField label="正文草稿" placeholder="切换主题或纹理，内容仍然保留" /></Stack>
      </Background>
    </div>
  </section>;
}
