import { useState } from 'react';
import { Badge, Button, Disclosure, Inline, OrbitBackdrop, SegmentedControl, Stack, Surface, Switch, Text, TextField } from '../components';

export function OrbitGallery() {
  const [replay, setReplay] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [appearance, setAppearance] = useState<'theme' | 'original'>('theme');
  const [artworkName, setArtworkName] = useState('Orbit workspace');
  const [workspaceName, setWorkspaceName] = useState('Rhine Studio');
  return <section id="orbit">
    <div className="ds-section-title"><span>ORBIT</span><h2>轨道星空 · 品牌艺术背景</h2></div>
    <p className="ds-caption">莱茵的玻璃培养舱、战术的悬浮源石晶簇、橙趣的草莓甜甜圈。每个主题都有自己的物件，也可以切换到原始深色星空。</p>
    <Inline gap={3}>
      <Badge>0.7.0</Badge>
      <SegmentedControl label="画面风格" value={appearance} onValueChange={value => setAppearance(value as 'theme' | 'original')} items={[{ value: 'theme', label: '跟随主题' }, { value: 'original', label: '原始深色' }]} />
      <Button variant="secondary" onClick={() => setReplay(value => value + 1)}>重播轨道</Button>
      <Switch label="减少轨道动态" checked={reduced} onCheckedChange={setReduced} />
    </Inline>
    <OrbitBackdrop key={`art-${replay}`} className="ds-gap-top ds-orbit-artwork" appearance={appearance} reducedMotion={reduced} role="region" aria-label="轨道背景预览" />
    <p className="ds-caption">旋转的物件伴随气泡、碎晶与糖粒。切换主题保留播放位置，窄屏也能播放；暂停或开启减少动态后保持静止。</p>
    <Disclosure title="查看组合控件示例">
      <Text tone="muted">输入框与按钮的叠加效果单独展示，不遮挡上方轨道。</Text>
      <OrbitBackdrop key={`controls-${replay}`} className="ds-gap-top" appearance={appearance} reducedMotion={reduced} role="region" aria-label="轨道上的控件组合">
        <div className="ds-orbit-example-content"><Stack gap={6}>
          <Stack gap={3}>
            <Text as="h3" variant="heading">直接叠加</Text>
            <TextField label="直接叠加的输入框" value={artworkName} onChange={event => setArtworkName(event.target.value)} hint="提示文字随当前内容前景保持可读。" />
            <Inline gap={2}>
              <Button>开始探索</Button>
              <Button variant="secondary">查看轨道</Button>
              <Button variant="quiet">了解更多</Button>
              <Button variant="quiet" busy busyLabel="示例处理中">示例处理中</Button>
              <Button variant="quiet" disabled>暂不可用</Button>
            </Inline>
          </Stack>
          <Surface><Stack gap={3}>
            <Text as="h3" variant="heading">带底色的内容</Text>
            <Text tone="muted">Surface 与控件保留当前主题的完整配色。</Text>
            <TextField label="工作空间名称" value={workspaceName} onChange={event => setWorkspaceName(event.target.value)} hint="这是可编辑的本地展台示例。" />
            <Inline gap={2}>
              <Button>继续探索</Button>
              <Button variant="secondary">查看介绍</Button>
              <Button variant="quiet">更多介绍</Button>
            </Inline>
          </Stack></Surface>
        </Stack></div>
      </OrbitBackdrop>
    </Disclosure>
  </section>;
}
