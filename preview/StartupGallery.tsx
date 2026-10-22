import { useEffect, useState, type CSSProperties } from 'react';
import { Badge, Button, Checkbox, Logo, Notice, Select, Text } from '../components/index';
import './startup.css';
import './brand-assembly.css';

type Scenario = 'ready' | 'waiting' | 'error';
type State = 'cover' | 'playing' | 'ready' | 'error';

export function StartupGallery({ reduced }: { reduced: boolean }) {
  const [scenario, setScenario] = useState<Scenario>('ready');
  const [state, setState] = useState<State>('cover');
  const [generation, setGeneration] = useState(0);
  const [slow, setSlow] = useState(false);
  const [localReduced, setLocalReduced] = useState(false);
  const [loginPreview, setLoginPreview] = useState(false);
  const [systemReduced, setSystemReduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const reduce = reduced || localReduced || systemReduced;

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const update = () => setSystemReduced(media?.matches ?? false);
    media?.addEventListener('change', update);
    return () => media?.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (state !== 'playing' || scenario === 'waiting') return;
    // This timer represents synthetic readiness, never a production startup gate.
    if (reduce) { setState(scenario); return; }
    const timer = setTimeout(() => setState(scenario), 1600 * (slow ? 4 : 1));
    return () => clearTimeout(timer);
  }, [state, scenario, generation, slow, reduce]);

  const play = () => { setLoginPreview(false); setGeneration(value => value + 1); setState('playing'); };
  const reset = () => { setLoginPreview(false); setGeneration(value => value + 1); setState('cover'); };

  return <section id="startup" className="ds-startup" aria-labelledby="startup-title" data-rhine-motion={reduce ? 'reduced' : 'system'} style={{ '--startup-speed': slow ? 4 : 1, '--ds-brand-speed': slow ? 4 : 1, '--ds-brand-offset': '180ms' } as CSSProperties}>
    <div className="ds-section-title"><span>START / 01</span><h2 id="startup-title">构架归位，品牌留下。</h2></div>
    <p className="ds-caption">启动动画设计候选 · 品牌分镜 1.6 秒，560ms 连续收拢到登录页。就绪即刻可操作，减少动态时直接呈现。</p>
    <div className="ds-startup-layout">
      <div className="ds-startup-window">
        <div className="ds-startup-chrome"><span>Rhine Design</span><span>启动设计预览</span></div>
        <div key={generation} className="ds-startup-stage" data-state={state}>
            <div className="ds-startup-emblem" aria-hidden="true">
              <svg className="ds-startup-construction" viewBox="0 0 240 240" fill="none"><path className="ds-startup-guide" pathLength="1" d="M120 20 225 202H15Z" /><path className="ds-startup-ticks" d="M120 8v8M120 218v14M0 120h12M228 120h12" /><circle className="ds-startup-signal" cx="120" cy="20" r="3" /></svg>
              <div className="ds-startup-logo-anchor"><Logo size={176} decorative animate={state === 'playing' || state === 'ready'} className="ds-brand-assembly" /></div>
              <div className="ds-startup-wordmark">Rhine Design</div>
            </div>
            {state === 'ready' ? <div className="ds-startup-destination">
              <Text as="h3" variant="section">连接你的工作空间</Text>
              <Text tone="muted">登录后继续你的工作。</Text>
              <Button onClick={() => setLoginPreview(true)}>在浏览器中登录</Button>
              <Text variant="caption" tone="muted" role="status">{loginPreview ? '仅演示登录入口，不会打开授权页面。' : '设计预览，不发起授权。'}</Text>
            </div> : <div className="ds-startup-status" role="status">{state === 'cover' ? '准备播放' : state === 'error' ? '初始化未完成' : '正在准备工作空间'}</div>}
            {state === 'error' && <Notice tone="error" title="暂时无法恢复会话">这是失败场景演示。可使用下方重播再次查看。</Notice>}
            <div className="ds-startup-footnote" aria-hidden="true"><span>STRUCTURE / CONNECTION</span><span>Rhine Design</span></div>
        </div>
      </div>
      <aside className="ds-startup-score" aria-label="启动分镜">
        <Badge>品牌动效 / 设计候选</Badge><h3>以几何建立秩序。</h3><p>三块构架，汇合成一个标志。让用户记住形状与节奏。</p>
        <ol><li><span>01 / 0–320ms</span><strong>定位</strong><p>细线先行，确定三角边界。</p></li><li><span>02 / 180–1060ms</span><strong>旋转 · 展开 · 归位</strong><p>三块先旋转压缩，再错开 80ms 展开闭合。</p></li><li><span>03 / 1060–1600ms</span><strong>识别</strong><p>橙点收束，辅助线退去，字标显现。</p></li></ol>
        <p className="ds-caption">就绪后，同一个标志用 560ms 收拢，字标沿中轴上移，登录内容轻轻显现。操作立即可用；慢启动保持静态标志。</p>
      </aside>
    </div>
    <div className="ds-startup-controls">
      <Select label="启动场景" value={scenario} onChange={event => { setScenario(event.target.value as Scenario); reset(); }}><option value="ready">正常启动</option><option value="waiting">慢启动 · 等待就绪</option><option value="error">初始化失败</option></Select>
      <Select label="分镜速度" value={slow ? 'slow' : 'normal'} onChange={event => { setSlow(event.target.value === 'slow'); reset(); }}><option value="normal">原速 · 1.6 秒</option><option value="slow">4 倍慢放 · 6.4 秒</option></Select>
      <Checkbox label="此例减少动态" checked={localReduced} onChange={event => setLocalReduced(event.target.checked)} />
    </div>
    <div className="ds-row"><Button onClick={play}>{state === 'cover' ? '播放启动动画' : '重播启动动画'}</Button><Button variant="secondary" onClick={reset}>复位启动动画</Button><Button variant="quiet" disabled={state !== 'playing'} onClick={() => setState('ready')}>模拟就绪 · 立即进入</Button></div>
    <p className="ds-caption" role="status">{state === 'ready' ? '已进入登录示例，未执行真实登录。' : state === 'error' ? '失败场景已呈现；重播仅重置本地演示。' : reduce ? '减少动态：静态呈现；慢启动仍等待就绪。' : '主动播放，不自动循环。模拟就绪可随时中断编排；所有状态均为合成。'}</p>
  </section>;
}
