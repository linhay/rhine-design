import { useEffect, useRef, useState } from 'react';
import { Button, Notice, Stack, Text, TextField } from '@linhey/rhine-design';
import type { ReviewEnvironment } from '@linhey/rhine-design/review';
import '../product.css';
interface Client { read(): string; save(value: string): Promise<void> }
export function Workspace({ client, environment, dimensions }: { client: Client; environment: ReviewEnvironment; dimensions: Readonly<Record<string, string>> }) {
  const [draft, setDraft] = useState(client.read);
  const [saved, setSaved] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const count = useRef(0);
  useEffect(() => {
    const target = canvas.current!;
    const context = target.getContext('2d')!;
    let frame = 0;
    const draw = () => {
      count.current++;
      target.dataset.frames = String(count.current);
      context.clearRect(0, 0, 320, 100);
      context.fillStyle = environment.theme === 'arknights' ? '#d0ef82' : environment.theme === 'neo-brutalism' ? '#e95725' : '#507058';
      context.beginPath(); context.arc(160 + Math.sin(count.current / 25) * 110, 50, 14, 0, Math.PI * 2); context.fill();
      if (!environment.paused && !environment.reducedMotion) frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [environment.paused, environment.reducedMotion, environment.theme]);
  return <div className="review-product"><Stack gap={4}><Text as="h1" variant="title">桌面工作区</Text>
    {dimensions.connection === 'error' ? <Notice title="合成连接失败" /> : dimensions.connection === 'waiting' ? <p role="status">等待模拟连接…</p> : <p>平台模拟已连接 · {dimensions.quota === 'empty' ? '暂无用量' : '合成用量 42'}</p>}
    <TextField label="工作区名称" value={draft} onChange={event => { setDraft(event.target.value); setSaved(false); }} />
    <Button disabled={dimensions.connection !== 'ready'} onClick={async () => { await client.save(draft); setSaved(true); }}>保存工作区</Button>
    {saved && <p role="status">内存工作区已保存</p>}
    <canvas ref={canvas} width={320} height={100} aria-label="合成动态画布" />
    <p>{environment.reducedMotion ? '减少动态' : environment.paused ? '已暂停' : '动态播放'}</p>
  </Stack></div>;
}
