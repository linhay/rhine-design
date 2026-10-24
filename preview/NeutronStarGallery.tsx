import { useState } from 'react';
import { Badge, Button, Disclosure, Inline, NeutronStarBackdrop, Select, Stack, Surface, Switch, Text, TextField } from '../components';

export function NeutronStarGallery() {
  const [replay, setReplay] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [appearance, setAppearance] = useState<'theme' | 'original'>('theme');

  return <section id="neutron-star">
    <div className="ds-section-title"><span>NEUTRON STAR</span><h2>中子星 · 磁场与星尘</h2></div>
    <p className="ds-caption">磁场线、流动粒子与极向喷流围绕星核运行。先看完整的艺术画面，再展开控制与内容组合；装饰不表示加载或业务进度。</p>
    <Stack gap={4}>
      <NeutronStarBackdrop key={replay} data-neutron-example="artwork" aria-label="中子星艺术" role="group" appearance={appearance} reducedMotion={reduced} style={{ minHeight: 560 }} />
      <Disclosure title="演示控制">
        <Stack gap={4}>
          <Inline gap={3}>
            <Badge>源码候选</Badge>
            <Button variant="secondary" onClick={() => setReplay(value => value + 1)}>重播中子星</Button>
            <Switch label="减少中子星动态" checked={reduced} onCheckedChange={setReduced} />
          </Inline>
          <Select label="艺术配色" value={appearance} onChange={event => setAppearance(event.target.value as 'theme' | 'original')}>
            <option value="theme">跟随界面主题</option>
            <option value="original">原始深空</option>
          </Select>
          <Text variant="caption" tone="muted">顶部切换界面主题；艺术配色改变时继续当前时间。暂停后原地继续，重播只重新创建上方艺术，不清空下方输入。</Text>
        </Stack>
      </Disclosure>
      <Disclosure title="查看内容组合">
        <NeutronContentExample appearance={appearance} reducedMotion={reduced} />
      </Disclosure>
    </Stack>
    <p className="ds-caption">28 条磁场线、560 个流动粒子、700 颗星尘、极向喷流与星核；星系以 28 秒有效播放时间完成一轮深度公转。系统、顶部或本节减少动态均保留静态画面；页面隐藏、离屏或尺寸为零时停止逐帧绘制。</p>
  </section>;
}

function NeutronContentExample({ appearance, reducedMotion }: { appearance: 'theme' | 'original'; reducedMotion: boolean }) {
  const [name, setName] = useState('Rhine Observatory');
  return <NeutronStarBackdrop data-neutron-example="content" aria-label="中子星内容组合" role="group" appearance={appearance} reducedMotion={reducedMotion} style={{ minHeight: 460 }}>
    <Stack style={{ padding: 'var(--rhine-space-6)' }}>
      <Surface style={{ maxWidth: 400 }}>
        <Stack gap={4}>
          <Stack gap={2}>
            <Text as="h3" variant="heading">保持内容清晰</Text>
            <Text tone="muted">卡片、文字与操作使用当前界面主题，艺术层独立绘制。</Text>
          </Stack>
          <TextField label="观测名称" value={name} onChange={event => setName(event.target.value)} hint="本地演示草稿；切换配色或重播不会清空。" />
          <Inline gap={2}>
            <Button>开始观测</Button>
            <Button variant="secondary">查看介绍</Button>
            <Button disabled>暂不可用</Button>
          </Inline>
        </Stack>
      </Surface>
    </Stack>
  </NeutronStarBackdrop>;
}
