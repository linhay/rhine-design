import { useEffect, useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Badge, Button, Dialog, Disclosure, Inline, Notice, Select, Stack, Surface, Text, TextField } from '../components';
import { ThemeProvider, type ThemeName } from '../components/theme';
import './parameter-config.css';

// A deliberately small synthetic host model, not a public generator or migration API.
type Parameters = { version: string; desktopBuild: string; mobileBuild: string; software: string };
const initial: Parameters = { version: '12.4.0', desktopBuild: '2401', mobileBuild: '8102', software: '3.2.1' };
const fields: { key: keyof Parameters; label: string }[] = [
  { key: 'version', label: '统一版本' }, { key: 'desktopBuild', label: '桌面应用构建号' },
  { key: 'mobileBuild', label: '移动应用构建号' }, { key: 'software', label: '独立软件版本' },
];
const templates = [
  ['桌面 · Linux x64', 'Linux; x86_64', 'desktopBuild'], ['桌面 · Linux arm64', 'Linux; aarch64', 'desktopBuild'],
  ['桌面 · macOS arm64', 'macOS; arm64', 'desktopBuild'], ['桌面 · macOS x64', 'macOS; x86_64', 'desktopBuild'],
  ['桌面 · Windows x64', 'Windows; x86_64', 'desktopBuild'], ['移动 · Android 手机', 'Android; Phone; arm64', 'mobileBuild'],
  ['移动 · Android 平板', 'Android; Tablet; arm64', 'mobileBuild'], ['移动 · iOS 手机', 'iOS; Phone; arm64', 'mobileBuild'],
  ['移动 · iOS 平板', 'iOS; Tablet; arm64', 'mobileBuild'], ['移动 · 通用终端', 'Generic; Mobile; arm64', 'mobileBuild'],
] as const;
const versionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?(?:\+[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/;
function errorsFor(p: Parameters) {
  return Object.fromEntries(fields.map(({ key }) => [key, !p[key] ? '请输入此参数' :
    key === 'desktopBuild' || key === 'mobileBuild' ? (/^\d{1,12}$/.test(p[key]) ? '' : '使用 1–12 位数字') :
      versionPattern.test(p[key]) ? '' : '使用完整版本，例如 12.4.0-rc.1+sample'] )) as Record<keyof Parameters, string>;
}
function resultsFor(p: Parameters) {
  return [...templates.map(([label, system, build]) => ({ label, value: `RhineClient/${p.version} (${system}) Build/${p[build]} Protocol/${p.version}` })),
    { label: '独立软件', value: `RhineUtility/${p.software} (Synthetic; standalone)` }];
}
type Plan = { before: Parameters; after: Parameters };

export function ParameterConfigGallery() {
  const id = useId(), opener = useRef<HTMLButtonElement>(null);
  const statusHeading = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState(initial), [baseline, setBaseline] = useState(initial);
  const [plan, setPlan] = useState<Plan | null>(null), [open, setOpen] = useState(false);
  const [validated, setValidated] = useState(false), [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [outcome, setOutcome] = useState('success'), [attempts, setAttempts] = useState(0);
  const pending = useRef(false), timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { clearTimeout(timer.current); pending.current = false; }, []);
  const errors = errorsFor(draft), valid = !Object.values(errors).some(Boolean);
  const dirty = fields.some(({ key }) => draft[key] !== baseline[key]);
  const results = valid ? resultsFor(draft) : [];
  const before = plan ? resultsFor(plan.before) : [], after = plan ? resultsFor(plan.after) : [];
  const affected = after.filter((r, i) => r.value !== before[i].value);
  const changes = plan ? fields.filter(({ key }) => plan.before[key] !== plan.after[key]) : [];
  const close = () => {
    // Closing cancels this synthetic request. A real host must abort/ignore its response.
    clearTimeout(timer.current); pending.current = false; setBusy(false); setOpen(false);
  };
  const review = () => {
    if (pending.current) return;
    if (!valid) {
      flushSync(() => setValidated(true));
      const key = fields.find(({ key }) => errors[key])!.key;
      document.getElementById(`${id}-${key}`)?.focus();
      return;
    }
    if (!dirty) return;
    setPlan({ before: { ...baseline }, after: { ...draft } }); setError(''); setOpen(true);
  };
  const submit = () => {
    if (!plan || conflict || pending.current) return;
    pending.current = true; setBusy(true); setError(''); setMessage(''); setAttempts(n => n + 1);
    const snapshot = plan;
    timer.current = setTimeout(() => {
      pending.current = false; setBusy(false);
      if (outcome === 'error') { setOutcome('success'); setError('提交失败，草稿已保留。可重试或返回编辑。'); return; }
      if (outcome === 'conflict') { setOutcome('success'); setConflict(true); return; }
      setBaseline(snapshot.after); setMessage('已保存合成配置'); setOpen(false);
    }, 600);
  };
  const field = ({ key, label }: typeof fields[number]) => <TextField key={key} id={`${id}-${key}`} label={label}
    value={draft[key]} disabled={busy} error={validated ? errors[key] || undefined : undefined}
    onChange={e => { setDraft(current => ({ ...current, [key]: e.target.value })); setMessage(''); }} />;
  return <Stack gap={4}>
    <Text as="h2" variant="section">参数与生成预览</Text>
    <Surface className="rhine-parameter-config">
      <Stack gap={4}>
        <Inline className="rhine-parameter-config__heading" gap={3}>
          <div ref={statusHeading} tabIndex={-1}><Text as="h3" variant="heading">客户端标识</Text><Text role="status">{dirty ? '有未提交变化' : '无未提交变化'}</Text></div>
          <Button disabled={!dirty || busy} onClick={event => { opener.current = event.currentTarget; review(); }}>核对并提交</Button>
        </Inline>
        {conflict && <Notice tone="warning" title="基线已变化，需读取后重新核对">草稿已保留，关闭或重开确认不能跳过冲突。</Notice>}
        {message && <Text role="status">{message}</Text>}
        <div className="rhine-parameter-config__layout">
          <div className="rhine-parameter-config__inputs">
            <Text as="h4" variant="heading">源参数</Text>
            <div role="region" aria-label="配置参数" tabIndex={0} className="rhine-parameter-config__scroll">
              <Stack gap={3}>{fields.map(field)}</Stack>
            </div>
          </div>
          <div className="rhine-parameter-config__preview">
            <Text as="h4" variant="heading">生成结果{valid ? '（11）' : ' · 待校验'}</Text>
            <div role="region" aria-label="完整生成结果" tabIndex={0} className="rhine-parameter-config__scroll rhine-parameter-config__results">
              {valid ? <ol>{results.map(r => <li key={r.label}><Inline><Badge>{r.label}</Badge></Inline><pre>{r.value}</pre></li>)}</ol> :
                <Notice tone="warning" title="待校验：参数不完整或格式非法">修正源参数后才生成有效结果。</Notice>}
            </div>
          </div>
        </div>
      </Stack>
    </Surface>
    <Disclosure title="合成服务控制">
      <Select label="提交结果" value={outcome} disabled={busy} onChange={e => setOutcome(e.target.value)}>
        <option value="success">成功</option><option value="error">失败一次</option><option value="conflict">冲突一次</option>
      </Select>
      <Text>提交尝试：<span data-testid="parameter-attempts">{attempts}</span></Text>
      <Text>已保存统一版本：<span data-testid="parameter-saved-version">{baseline.version}</span></Text>
    </Disclosure>
    <Dialog title="核对配置变化" open={open} onOpenChange={next => { if (!next) close(); }}
      trigger={<button hidden tabIndex={-1} aria-hidden="true" />}
      onCloseAutoFocus={event => { event.preventDefault(); (opener.current?.disabled ? statusHeading.current : opener.current)?.focus(); }}
      footer={<><Button variant="secondary" onClick={close}>返回编辑</Button>
        {conflict ? <Button onClick={() => {
          // Synthetic latest baseline differs, but never replace the local draft.
          setBaseline({ ...baseline, version: '12.5.0', desktopBuild: '2402' });
          setConflict(false); setError(''); setMessage('已读取新基线，草稿保留，请重新核对'); close();
        }}>读取新基线</Button> : <Button busy={busy} disabled={busy} onClick={submit}>{error ? '重试提交' : '确认提交'}</Button>}</>}>
      <Stack gap={4}>
        {conflict && <Notice tone="warning" title="基线冲突">读取新基线后须重新核对；当前草稿不丢弃。</Notice>}
        {error && <Notice tone="error" title="提交未完成">{error}</Notice>}
        <Text>影响 {affected.length} / 11 条结果</Text>
        <dl className="rhine-parameter-config__changes" aria-label="实际参数变化">{changes.map(({ key, label }) => <div key={key}>
          <dt>{label}</dt><dd><del>{plan!.before[key]}</del><span aria-label="变更为"> → </span><ins>{plan!.after[key]}</ins></dd>
        </div>)}</dl>
        <Disclosure title="完整结果差异">
          <ol className="rhine-parameter-config__diff">{after.map((r, i) => r.value !== before[i].value && <li key={r.label}>
            <Text as="h4" variant="label">{r.label}</Text><pre>之前：{before[i].value}</pre><pre>之后：{r.value}</pre>
            <pre>请求头：User-Agent: {r.value}</pre>
          </li>)}</ol>
        </Disclosure>
      </Stack>
    </Dialog>
  </Stack>;
}

export function ParameterConfigFixture() {
  const params = new URLSearchParams(location.search), zoom = Number(params.get('zoom')) || 1;
  useEffect(() => { document.documentElement.style.zoom = String(zoom); return () => { document.documentElement.style.zoom = ''; }; }, [zoom]);
  return <ThemeProvider theme={(params.get('theme') || 'rhine') as ThemeName} data-rhine-motion={params.get('motion') || 'system'}>
    <div style={{ padding: 16 }}><ParameterConfigGallery /></div>
  </ThemeProvider>;
}
