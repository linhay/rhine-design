import { useState } from 'react';
import { Badge, Button, Inline, Logo, OrbitBackdrop, Stack, Surface, Switch, Text, TextField } from '../components';

export function OrbitGallery() {
  const [replay, setReplay] = useState(0);
  const [reduced, setReduced] = useState(false);
  return <section id="orbit">
    <div className="ds-section-title"><span>ORBIT</span><h2>轨道星空 · 品牌艺术背景</h2></div>
    <p className="ds-caption">420 个环节点、185 条空间曲线与发射箭头组成同一幅画面。用于入口和品牌叙事，内容可立即阅读，不表示加载或业务进度。</p>
    <Inline gap={3}>
      <Badge>0.6.0</Badge>
      <Button variant="secondary" onClick={() => setReplay(value => value + 1)}>重播轨道</Button>
      <Switch label="减少轨道动态" checked={reduced} onCheckedChange={setReduced} />
    </Inline>
    <OrbitBackdrop key={replay} className="ds-gap-top" reducedMotion={reduced} style={{ minHeight: 560 }}>
      <Logo variant="lockup" size={40} />
      <Stack gap={3}>
        <Text as="h3" variant="title">连接彼此，探索更多。</Text>
        <Text tone="muted">在有序的轨迹中，留下新的可能。<br />艺术背景不阻挡内容与操作。</Text>
      </Stack>
      <Surface>
        <Stack gap={3}>
          <Text as="h3" variant="heading">带底色的内容保持宿主主题</Text>
          <Text tone="muted">表单和操作组合到 Surface，保留完整的前景、背景与状态配色。</Text>
          <TextField label="工作空间名称" defaultValue="Rhine Studio" hint="这是可编辑的本地展台示例。" />
          <Inline gap={2}>
            <Button>继续探索</Button>
            <Button variant="secondary">查看介绍</Button>
          </Inline>
        </Stack>
      </Surface>
      <Text variant="caption" tone="muted">空间、连接与持续探索。</Text>
    </OrbitBackdrop>
    <p className="ds-caption">暂停后在原画面继续；系统、顶部或本节减少动态均保留静态画面。视口不超过 760px、页面隐藏或画面离屏时停帧。重播只重建这幅艺术，不执行任何业务操作。</p>
  </section>;
}
