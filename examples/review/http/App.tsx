import { useEffect, useState } from 'react';
import { Button, Dialog, Notice, Stack, Surface, Text, TextField } from '@linhey/rhine-design';
import { ThemeProvider } from '@linhey/rhine-design/theme';
import type { ReviewEnvironment } from '@linhey/rhine-design/review';
import '../product.css';
type Project = { id: number; name: string };
export function App({ environment, signal, role, report }: { environment: ReviewEnvironment; signal: AbortSignal; role: string; report(message: string, kind?: 'info' | 'error'): void }) {
  const [items, setItems] = useState<Project[]>([]);
  const [status, setStatus] = useState('loading');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState('');
  useEffect(() => {
    const abort = new AbortController();
    setStatus('loading');
    fetch(`/api/projects?q=${encodeURIComponent(query)}`, { signal: AbortSignal.any([signal, abort.signal]) }).then(async response => {
      if (!response.ok) throw new Error('合成服务暂不可用');
      const next = await response.json() as Project[];
      if (!abort.signal.aborted && !signal.aborted) { setItems(next); setStatus('ready'); }
    }).catch(error => { if (error.name !== 'AbortError') setStatus('error'); });
    return () => abort.abort();
  }, [query, signal]);
  return <ThemeProvider theme={environment.theme} data-rhine-motion={environment.reducedMotion ? 'reduced' : environment.paused ? 'paused' : 'full'}>
    <div className="review-product"><Stack gap={4}><Text as="h1" variant="title">项目工作台</Text><Text tone="muted">合成数据 · {role === 'editor' ? '可编辑' : '只读'} · 独立产品路由</Text>
      <TextField label="搜索项目" value={query} onChange={event => setQuery(event.target.value)} />
      <TextField label="未保存草稿" value={draft} onChange={event => setDraft(event.target.value)} />
      <Button variant="secondary" onClick={async () => {
        try { const { message } = await import('./details'); setDetails(message); }
        catch (error) { report(String(error), 'error'); }
      }}>加载延迟模块</Button>{details && <p>{details}</p>}
      {status === 'loading' ? <p role="status">正在加载合成项目…</p> : status === 'error' ? <Notice title="合成服务暂不可用">请切换状态重试。</Notice> : items.length ? items.map(item => <Surface key={item.id}><Text>{item.name}</Text></Surface>) : <p>暂无项目</p>}
      <Button variant="secondary" onClick={() => { void fetch('/api/unimplemented').catch(error => report(error.message, 'error')); }}>触发未实现操作</Button>
    <Dialog trigger={<Button disabled={role !== 'editor'}>新建项目</Button>} open={open} onOpenChange={setOpen} title="新建合成项目" description="仅保存到当前合成场景的内存数据。"><form onSubmit={async event => {
      event.preventDefault(); setSaving(true);
      try {
        const response = await fetch(new Request(`${location.origin}/api/projects`, { method: 'POST', body: JSON.stringify({ name: draft || '新合成项目' }), signal }));
        if (!response.ok) throw new Error('模拟保存失败');
        setItems(await response.json() as Project[]); setOpen(false);
      } catch (error) { report(String(error), 'error'); }
      finally { setSaving(false); }
    }}><Stack gap={3}><TextField label="项目名称" value={draft} onChange={event => setDraft(event.target.value)} /><Button type="submit" disabled={saving}>保存项目</Button></Stack></form></Dialog>
    </Stack></div>
  </ThemeProvider>;
}
