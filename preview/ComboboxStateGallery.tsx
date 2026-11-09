import { useState } from 'react';
import { Button, Checkbox, Combobox, RemoteMultiSelect, Select, Stack, Surface, Text, type Choice } from '../components';

const options = [{ value: 'new', label: '12.10.0' }, { value: 'release', label: '12.4.0' },
  { value: 'locked', label: '12.4.0-rc.1（不可用）', disabled: true }, { value: 'alpha', label: '12.4.0-alpha.11' }];
// Public components with explicit synthetic host state; no service or validation engine.
export function ComboboxStateGallery() {
  const [state, setState] = useState('ready'), [access, setAccess] = useState('editable'), [invalid, setInvalid] = useState(false);
  const [query, setQuery] = useState(''), [value, setValue] = useState<string | null>(null), [selected, setSelected] = useState<Choice[]>([]);
  const shared = {
    query, onQueryChange: setQuery, options: state === 'empty' ? [] : options,
    loading: state === 'loading' || state === 'error-loading',
    error: state.startsWith('error') ? '候选读取失败，请重试；仍可手填。合成长反馈：本次请求未返回可选记录，已输入的版本继续保留，可以重新读取候选，也可以直接输入尚未出现的新版本。' : undefined,
    validationError: invalid ? '字段版本格式不正确，可从候选中修正。合成长反馈：保留当前输入供核对，打开候选后选择正确版本或继续编辑；该校验不会把可纠正候选设为不可选。' : undefined,
    hint: '合成状态示例', disabled: access === 'disabled', readOnly: access === 'readonly',
    hasMore: state === 'page', onLoadMore: () => setState('ready'),
    loadMoreError: state === 'page-error' ? '下一页读取失败。' : undefined, onRetry: () => setState('ready'),
  };
  return <Surface><Stack gap={3}>
    <Text as="h3" variant="heading">候选状态与字段校验</Text>
    <Select label="候选状态演示" value={state} onChange={e => setState(e.target.value)}>
      <option value="ready">正常</option><option value="loading">加载</option><option value="empty">空候选</option>
      <option value="error">读取失败</option><option value="error-loading">失败与加载同存</option>
      <option value="page">更多候选</option><option value="page-error">分页失败</option>
    </Select>
    <Select label="字段可用性" value={access} onChange={e => setAccess(e.target.value)}>
      <option value="editable">可编辑</option><option value="disabled">禁用</option><option value="readonly">只读</option>
    </Select>
    <Checkbox label="字段校验失败" checked={invalid} onChange={e => setInvalid(e.target.checked)} />
    <Combobox {...shared} label="默认状态呈现" value={value} onValueChange={option => { setValue(option.value); setQuery(option.label); setInvalid(false); }} />
    <Combobox {...shared} label="紧凑状态呈现" statusDisplay="compact" value={value} onValueChange={option => { setValue(option.value); setQuery(option.label); setInvalid(false); }} />
    <RemoteMultiSelect {...shared} label="紧凑多选" statusDisplay="compact" value={selected} onValueChange={setSelected} />
    <Button variant="secondary" onClick={() => { setQuery(''); setValue(null); setSelected([]); }}>清空演示</Button>
  </Stack></Surface>;
}
