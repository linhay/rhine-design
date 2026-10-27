import { useEffect, useRef, useState } from 'react';
import { Button, Checkbox, Divider, IconButton, Inline, Metric, Notice, Popover, Progress, Select, Skeleton, Stack, Text } from '../components';
import { ThemeProvider, type ThemeName } from '../components/theme';
import './tray-usage.css';

type Scenario = 'normal' | 'loading' | 'low' | 'unknown' | 'stale' | 'connecting' | 'unmatched' | 'signed-out' | 'shared';
type Feedback = 'idle' | 'busy' | 'error' | 'success';
const accounts = [{ id: 'a', name: '研究账号 A', remaining: 78 }, { id: 'b', name: '协作账号 B', remaining: 42 }];

// A synthetic host, not a product account service or a public tray component.
export function TrayUsageGallery() {
  const [open, setOpen] = useState(true), [scenario, setScenario] = useState<Scenario>('normal');
  const [long, setLong] = useState(false), [failOnce, setFailOnce] = useState(false);
  const [current, setCurrent] = useState('a'), [feedback, setFeedback] = useState<Feedback>('idle');
  const [target, setTarget] = useState(''), [requests, setRequests] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pending = useRef(false), attempts = useRef(0), epoch = useRef(0);
  useEffect(() => () => { clearTimeout(timer.current); epoch.current++; }, []);
  const cancel = () => { clearTimeout(timer.current); epoch.current++; pending.current = false; setFeedback('idle'); setTarget(''); };
  const reset = () => { cancel(); attempts.current = 0; setCurrent('a'); setRequests(0); setScenario('normal'); setLong(false); setFailOnce(false); setOpen(true); };
  const unavailable = ['loading','stale','connecting','unmatched','signed-out'].includes(scenario);
  const switchAccount = (next: string) => {
    if (pending.current || unavailable || next === current || !accounts.some(a => a.id === next)) return;
    pending.current = true; setTarget(next); setFeedback('busy'); setRequests(n => n + 1);
    const request = ++epoch.current, shouldFail = failOnce && attempts.current++ === 0;
    timer.current = setTimeout(() => {
      if (request !== epoch.current) return;
      pending.current = false;
      if (shouldFail) setFeedback('error');
      else { setCurrent(next); setFeedback('success'); }
    }, 1200);
  };
  const account = accounts.find(a => a.id === current)!;
  const name = (value: string) => long ? `${value} · 跨地区协作研究工作空间与长期项目的完整账号名称` : value;
  const remaining = scenario === 'unknown' ? null : scenario === 'low' ? 4 : account.remaining;
  return <Stack>
    <Text as="h2" variant="section">托盘用量组合</Text><Text>浏览器浮层 · 合成数据。默认展开；宿主拥有账号、请求和数据时效。</Text>
    <Select label="用量场景" value={scenario} onChange={e => { cancel(); setScenario(e.target.value as Scenario); setOpen(true); }}>
      <option value="normal">正常</option><option value="loading">加载</option><option value="low">低额度</option><option value="unknown">未知额度</option><option value="stale">目录过期 / 刷新失败</option><option value="connecting">连接处理中</option><option value="unmatched">连接未匹配</option><option value="signed-out">未登录</option><option value="shared">共享多账号</option>
    </Select>
    <Inline><Checkbox label="长账号名" checked={long} onChange={e => { setLong(e.target.checked); setOpen(true); }} /><Checkbox label="首次切换失败" checked={failOnce} onChange={e => { cancel(); attempts.current = 0; setFailOnce(e.target.checked); setOpen(true); }} /><Button variant="secondary" onClick={reset}>重置托盘示例</Button></Inline>
    <Text variant="caption" data-testid="request-count">合成切换请求：{requests}</Text>
    <div className="preview-tray-anchor"><Popover title="账号与用量概览" showHeader={false} open={open} onOpenChange={setOpen} side="bottom" trigger={<IconButton icon="chart" label="切换用量面板" />}>
      <Stack gap={3} data-testid="tray-panel">
        {scenario === 'signed-out' ? <Notice title="尚未登录">登录后显示当前账号和用量。</Notice> : <>
          <section aria-label="当前 Agent 账号" aria-busy={feedback === 'busy'}>
            <Stack gap={2}>
              <Select label="Agent A 当前账号" value={scenario === 'unmatched' ? '' : current} disabled={unavailable || feedback === 'busy'} onChange={e => switchAccount(e.target.value)}>{scenario === 'unmatched' && <option value="">未匹配账号</option>}{accounts.map(a => <option key={a.id} value={a.id}>{name(a.name)}</option>)}</Select>
              {scenario === 'loading' ? <Skeleton label="正在读取当前账号额度" lines={2} /> : scenario === 'unmatched' ? <Notice title="连接未匹配">当前连接尚未关联账号，额度不可用。</Notice> : <>
                <Text data-testid="current-account">{name(account.name)}</Text>
                <Metric label="本周期剩余额度" value={remaining === null ? '未知' : `${remaining}%`} description="2026-10-01 至 2026-10-31 · UTC+8" />
                {remaining !== null && <Progress label="周期剩余" value={remaining} />}
              </>}
              <div className="preview-tray-feedback" data-testid="switch-feedback">
                {(['idle','busy','error','success'] as const).map(status => <div key={status} style={{ visibility: feedback === status ? 'visible' : 'hidden' }} aria-hidden={feedback !== status}>
                  <Text role={feedback === status ? (status === 'error' ? 'alert' : 'status') : undefined}>{status === 'busy' ? '正在切换目标账号，确认前保留原账号及额度。' : status === 'error' ? '切换失败，原账号及额度保持不变。' : status === 'success' ? '切换已确认。其他 Agent 和统计保持不变。' : '选择账号即可切换，确认后更新额度。'}</Text>
                  {status === 'error' && <Button variant="secondary" disabled={feedback !== 'error' || unavailable} onClick={() => switchAccount(target)}>重试切换</Button>}
                </div>)}
              </div>
            </Stack>
          </section>
          {scenario === 'low' && <Notice tone="warning" title="当前周期剩余额度较低" />}
          {scenario === 'unknown' && <Notice title="额度暂不可用">未返回额度；未知不等于零。</Notice>}
          {scenario === 'stale' && <Notice tone="warning" title="上次数据 · 目录已过期">刷新失败，暂时无法切换。以下为上次可信缓存。</Notice>}
          {scenario === 'connecting' && <Notice title="连接正在处理">完成后才能切换账号。</Notice>}
          {scenario !== 'loading' && <section aria-label="其他 Agent" data-testid="other-agent"><Text>Agent B · 独立演示账号</Text><Text>本周期剩余 61% · 2026-10</Text></section>}
          {scenario === 'shared' && <section aria-label="共享成员额度"><Stack gap={2}><Text as="h3" variant="heading">共享成员</Text><Text tone="muted">同一上游的多个连接共用额度，不累加百分比。</Text>{Array.from({length:12},(_,i)=><div key={i}><Text>{name(`成员账号 ${i+1}`)}</Text><Text>2026-10 周期剩余 {i === 11 ? '未知' : `${78-i*4}%`}</Text></div>)}</Stack></section>}
          <Divider />
          <section aria-label="今日用量" data-testid="usage-summary"><Stack gap={2}>
            <Metric label="今日预估消费" value="1.28" unit="USD" loading={scenario === 'loading'} />
            {scenario === 'loading' ? <Skeleton label="正在读取今日统计" lines={2} /> : <><Text>请求数 128 · 待计价 3</Text><Text variant="caption" tone="muted">{scenario === 'stale' ? '上次更新' : '更新时间'}：2026-10-27 20:30 UTC+8</Text></>}
          </Stack></section>
        </>}
      </Stack>
    </Popover></div>
  </Stack>;
}
export function TrayUsageFixture() {
  const params = new URLSearchParams(location.search), zoom = Number(params.get('zoom')) || 1;
  useEffect(() => { document.documentElement.style.zoom = String(zoom); return () => { document.documentElement.style.zoom = ''; }; }, [zoom]);
  return <ThemeProvider theme={(params.get('theme') || 'rhine') as ThemeName} data-rhine-motion={params.get('motion') || 'system'}><div style={{ padding: 16 }}><TrayUsageGallery /></div></ThemeProvider>;
}
