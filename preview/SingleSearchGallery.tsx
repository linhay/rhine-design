import { useEffect, useId, useState } from 'react';
import { Select, Stack, Text, TextField, Toolbar } from '../components';

// Synthetic host: debounce, composition, cancellation and results belong here, not in TextField.
export function SingleSearchGallery() {
  const [width, setWidth] = useState('520');
  const [scenario, setScenario] = useState('normal');
  const [query, setQuery] = useState('');
  const [composing, setComposing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [failed, setFailed] = useState(false);
  const feedbackId = useId();
  const disabled = scenario === 'disabled';
  useEffect(() => {
    setFeedback(''); setFailed(false);
    if (!query.trim() || composing || disabled) return;
    let active = true;
    const controller = new AbortController();
    let response: ReturnType<typeof setTimeout>;
    const debounce = setTimeout(() => {
      if (!active) return;
      setFeedback('正在搜索…');
      if (scenario === 'loading') return;
      response = setTimeout(() => {
        if (!active || controller.signal.aborted) return;
        const error = scenario === 'error';
        setFailed(error);
        setFeedback(error ? '搜索失败，请修改查询后重试。' : scenario === 'empty' ? '没有匹配结果。' : `找到与“${query}”相关的 2 条合成结果。`);
      }, 500);
    }, 250);
    return () => { active = false; controller.abort(); clearTimeout(debounce); clearTimeout(response); };
  }, [query, composing, disabled, scenario]);
  return <section id="single-search"><Stack gap={6}>
    <Toolbar title="单输入搜索" description="只有一个搜索条件时，直接使用正文级输入；反馈按需放在结果区。">
      <Select label="搜索容器宽度" value={width} onChange={e => setWidth(e.target.value)}>{['400', '520', '880'].map(value => <option key={value}>{value}</option>)}</Select>
      <Select label="搜索场景" value={scenario} onChange={e => setScenario(e.target.value)}>
        <option value="normal">正常</option><option value="loading">加载</option><option value="empty">无结果</option><option value="error">错误</option><option value="disabled">禁用</option><option value="long">长占位</option>
      </Select>
    </Toolbar>
    <div style={{ width: `${width}px`, maxWidth: '100%' }} data-search-example>
      <TextField label="搜索合成条目" labelVisibility="hidden" type="search" value={query} disabled={disabled}
        placeholder={scenario === 'long' ? '搜索名称、描述或跨区域联合研究项目中的合成关键词' : '搜索名称或关键词'}
        aria-describedby={feedback ? feedbackId : undefined} aria-invalid={failed || undefined}
        onChange={e => setQuery(e.target.value)} onCompositionStart={() => setComposing(true)} onCompositionEnd={e => { setQuery(e.currentTarget.value); setComposing(false); }}
        onKeyDown={e => { if (e.key === 'Escape' && !composing && !e.nativeEvent.isComposing) { e.preventDefault(); setQuery(''); } }} />
      <div id={feedbackId} role="status" aria-live="polite" aria-atomic="true">{feedback && <Text tone={failed ? 'error' : 'muted'}>{feedback}</Text>}</div>
    </div>
    <Text variant="caption" tone="muted">输入后等待 250ms，再模拟 500ms 请求；组合输入期间不查询。Escape 清空并保持焦点，离开章节取消等待。</Text>
  </Stack></section>;
}
