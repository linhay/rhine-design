import { useState } from 'react';
import { Button, Dialog, Grid, IconButton, Inline, ListFilterBar, Notice, Pagination, SegmentedControl, Select, Stack, Switch, Text, TextField } from '../components';

/** Synthetic composition; the host keeps independent drafts and query state. */
export function EmbeddedWorkspaceGallery() {
  const [section, setSection] = useState('alpha');
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('all');
  const [enabled, setEnabled] = useState({ alpha: true, beta: false });
  const [saved, setSaved] = useState(enabled);
  const [page, setPage] = useState(1), [pageSize, setPageSize] = useState(10);
  const [mode, setMode] = useState('normal');
  const [view, setView] = useState('brief');
  const [open, setOpen] = useState(false);
  const dirty = enabled.alpha !== saved.alpha || enabled.beta !== saved.beta;
  const active = platform !== 'all';
  return <Stack gap={4}>
    <Text as="h3" variant="heading">内嵌标题栏与等宽列表</Text>
    <Select label="内嵌示例状态" value={mode} onChange={event => setMode(event.target.value)}>
      <option value="normal">正常</option><option value="loading">加载</option><option value="error">失败</option><option value="empty">空</option>
    </Select>
    <Inline><SegmentedControl label="内嵌显示方式" size="control" value={view} onValueChange={setView} items={[{value:'brief',label:'缩略'},{value:'detail',label:'详细'}]} /><Button variant="secondary">批量设置示例</Button></Inline>
    <Dialog title="合成插件设置" titleVisibility="hidden" width={960} height={640} open={open}
      onOpenChange={next => { setOpen(next); if (next) setEnabled(saved); }}
      trigger={<Button>打开内嵌设置</Button>}
      headerContent={<ListFilterBar label="标题栏筛选" variant="inline" filterOverlay="dialog" activeVariant="secondary"
        search={{label:'搜索观测记录',labelVisibility:'hidden',placeholder:'搜索记录',value:query,onChange:event => {setQuery(event.target.value);setPage(1);}}}
        primary={[{id:'platform',label:'平台',activeLabel:active ? '示例平台' : undefined,onClear:()=>setPlatform('all'),control:<Select label="平台" labelVisibility="hidden" value={platform} onChange={event=>setPlatform(event.target.value)}><option value="all">全部平台</option><option value="example">示例平台</option></Select>}]}
        moreContent={<Stack gap={3}><TextField label="低频搜索" placeholder="仅在更多中展示" /><Text>统计说明使用合成数据。</Text><Button variant="secondary">导出示例</Button></Stack>}
        onReset={()=>{setQuery('');setPlatform('all');setPage(1);}}
        result={mode === 'loading' ? '上次结果 28 条' : undefined} pending={mode === 'loading'} error={mode === 'error' ? '合成读取失败，草稿保留。' : undefined} />}
      headerActions={<Dialog title="只读配置详情" trigger={<IconButton label="查看配置详情" icon="info" />}><Text>仅用于嵌套关闭和归焦检查；不更改草稿。</Text></Dialog>}
      navigation={<Stack className="rhine-embedded-navigation" gap={2} role="group" aria-label="插件栏目">{(['alpha','beta'] as const).map(id=><Inline key={id} gap={2} style={{flexWrap:'nowrap'}}><Button variant={section===id?'primary':'secondary'} aria-pressed={section===id} onClick={()=>setSection(id)}>{id==='alpha'?'第一类':'第二类'}</Button><Switch label={`启用${id==='alpha'?'第一类':'第二类'}`} labelVisibility="hidden" checked={enabled[id]} onCheckedChange={value=>setEnabled(current=>({...current,[id]:value}))}/></Inline>)}</Stack>}
      footer={<div className="rhine-embedded-footer"><Pagination layout="inline" label="观测分页" page={page} pageSize={pageSize} total={mode==='empty'?0:28} loading={mode==='loading'} pageSizeLabelVisibility="hidden" onPageChange={setPage} onPageSizeChange={value=>{setPageSize(value);setPage(1);}} />{dirty&&<Text role="status">未保存</Text>}<Button variant="secondary" onClick={()=>{setEnabled(saved);setOpen(false);}}>取消</Button><Button disabled={!dirty} onClick={()=>setSaved(enabled)}>保存草稿</Button></div>}>
      <Stack gap={3}><Text>{section==='alpha'?'第一类':'第二类'}观测结果 · {view==='brief'?'缩略':'详细'}</Text>
        {mode==='empty'?<Text>当前条件无记录</Text>:mode==='error'?<Notice tone="error" title="保留上次结果">合成读取失败。</Notice>:<Text>合成结果 {page} / {Math.max(1,Math.ceil(28/pageSize))} 页；查询、权限及结果属于宿主。</Text>}
        <Grid minWidth={240}><Stack role="region" aria-label="候选列表" style={{maxHeight:320,overflow:'auto'}}>{Array.from({length:20},(_,i)=><Text key={i}>候选 {i+1} · 完整合成长标识符与可换行内容</Text>)}</Stack><Stack role="region" aria-label="已选列表" style={{maxHeight:320,overflow:'auto'}}>{Array.from({length:15},(_,i)=><Text key={i}>已选 {i+1} · 独立草稿</Text>)}</Stack></Grid>
      </Stack>
    </Dialog>
  </Stack>;
}
