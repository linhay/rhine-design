import { useState } from 'react';
import { Badge, Button, Inline, Logo, OrbitBackdrop, Stack, Switch, Text } from '../components';

export function OrbitGallery() {
  const [replay, setReplay] = useState(0);
  const [reduced, setReduced] = useState(false);
  return <section id="orbit">
    <div className="ds-section-title"><span>ORBIT</span><h2>轨道星空 · 品牌艺术背景</h2></div>
    <p className="ds-caption">420 个环节点、185 条空间曲线与发射箭头组成同一幅画面。用于入口和品牌叙事，内容可立即阅读，不表示加载或业务进度。</p>
    <Inline gap={3}>
      <Badge>未发布候选</Badge>
      <Button variant="secondary" onClick={() => setReplay(value => value + 1)}>重播轨道</Button>
      <Switch label="减少轨道动态" checked={reduced} onCheckedChange={setReduced} />
    </Inline>
    <OrbitBackdrop key={replay} className="ds-gap-top" reducedMotion={reduced} style={{ minHeight: 560 }}>
      <Logo variant="lockup" theme="dark" size={40} />
      <Stack gap={3}>
        <Text as="h3" variant="title">连接彼此，探索更多。</Text>
        <Text tone="muted">在有序的轨迹中，留下新的可能。<br />艺术背景不阻挡内容与操作。</Text>
      </Stack>
      <Text variant="caption" tone="muted">空间、连接与持续探索。</Text>
    </OrbitBackdrop>
    <p className="ds-caption">暂停后在原画面继续；系统、顶部或本节减少动态均保留静态画面。视口不超过 760px、页面隐藏或画面离屏时停帧。重播只重建这幅艺术，不执行任何业务操作。</p>
  </section>;
}
