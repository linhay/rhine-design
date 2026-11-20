import { useId, useState } from 'react';
import { AutoComplete, Button, Cascader, Checkbox, ColorPicker, ErrorSummary, Fieldset, Form, Inline, Mentions, Rate, Select, Slider, Stack, Text, TimePicker, Transfer, Upload, type CascadeOption, type FieldError } from '../components';

function ExternalUploadExample() {
  const formId=useId();
  const [generation,setGeneration]=useState(0), [files,setFiles]=useState<File[]>([]), [count,setCount]=useState<number>();
  return <Stack gap={3}>
    <Text as="h2" variant="section">外置表单与受控附件</Text>
    <Text tone="muted">选择文件后可重建同 ID 表单，附件继续交给当前表单；这里只生成本地快照。</Text>
    <Upload label="外置附件" form={formId} name="files" files={files} onChange={setFiles} required />
    <Button variant="secondary" onClick={()=>{setGeneration(value=>value+1);setCount(undefined);}}>重建外置表单</Button>
    <Form key={generation} id={formId} label="外置附件表单" onSubmit={event=>setCount(new FormData(event.currentTarget).getAll('files').filter(value=>value instanceof File).length)}>
      <Button type="submit">读取附件快照</Button>
    </Form>
    {count!==undefined&&<Text role="status">外置表单收到 {count} 个文件</Text>}
  </Stack>;
}

const people=[{id:'a',label:'研究组'},{id:'b',label:'协作组'}];
export function FormIntegrationGallery() {
  const prefix=useId();
  const [workspace,setWorkspace]=useState(''),[rating,setRating]=useState(2),[volume,setVolume]=useState(30),[time,setTime]=useState('09:30:05'),[color,setColor]=useState('#425c4b'),[notes,setNotes]=useState(''),[path,setPath]=useState<string[]>([]),[members,setMembers]=useState<string[]>([]),[files,setFiles]=useState<File[]>([]);
  const [disabled,setDisabled]=useState(false),[readOnly,setReadOnly]=useState(false),[dataState,setDataState]=useState('ready'),[expanded,setExpanded]=useState(false),[errors,setErrors]=useState<FieldError[]>([]),[attempt,setAttempt]=useState(0),[snapshot,setSnapshot]=useState<Record<string,unknown>|null>(null);
  const id=(name:string)=>`${prefix}-${name}`;
  const error=(name:string)=>errors.find(item=>item.fieldId===id(name))?.message;
  const clear=(name:string)=>{setErrors(current=>current.filter(item=>item.fieldId!==id(name)));};
  const options: CascadeOption[] = dataState==='empty'?[]:[{value:'root',label:'工作区',isLeaf:false,children:expanded&&dataState==='ready'?[{value:'docs',label:'资料库'},{value:'notes',label:'笔记'}]:undefined,loading:expanded&&dataState==='loading',loadError:expanded&&dataState==='error'?'下级读取失败（本地模拟）':undefined}];
  return <section className="ds-section"><h1>表单接入与宿主数据反馈</h1><Stack gap={6}>
    <Text>这是本地宿主组合：字段只负责界面与原生属性；校验、读取状态和提交快照由此页持有，不请求或保存业务数据。</Text>
    <Inline gap={3}><Checkbox label="禁用表单控件" checked={disabled} onChange={event=>{setDisabled(event.target.checked);setErrors([]);}}/><Checkbox label="只读表单控件" checked={readOnly} onChange={event=>{setReadOnly(event.target.checked);setErrors([]);}}/></Inline>
    <Select label="候选数据状态" value={dataState} onChange={event=>setDataState(event.target.value)}><option value="ready">读取完成</option><option value="loading">正在读取</option><option value="error">读取失败</option><option value="empty">空数据</option></Select>
    <Form label="接入示例" noValidate onSubmit={event=>{
      const next:FieldError[]=[];
      if(!disabled&&!readOnly){
        if(!workspace.trim())next.push({fieldId:id('workspace'),message:'请输入工作区'});
        const input=document.getElementById(id('time')) as HTMLInputElement|null;
        if(!time||!input?.validity.valid)next.push({fieldId:id('time'),message:'时间需在08:00到18:00之间'});
        if(!/^#[0-9a-fA-F]{6}$/.test(color))next.push({fieldId:id('color'),message:'请检查十六进制色值'});
        if(!path.length)next.push({fieldId:id('path'),message:'请选择一个完整资源路径'});
        if(!members.length)next.push({fieldId:id('members'),message:'至少选择一个成员组'});
      }
      setErrors(next);setAttempt(value=>value+1);setSnapshot(null);
      if(!next.length){
        const result:Record<string,unknown>={};
        new FormData(event.currentTarget).forEach((value,key)=>{const stored=value instanceof File?{name:value.name,size:value.size,type:value.type}:value;const previous=result[key];result[key]=previous===undefined?stored:Array.isArray(previous)?[...previous,stored]:[previous,stored];});
        setSnapshot(result);
      }
    }}>
      <Stack gap={4}>
        <ErrorSummary errors={errors} focusKey={attempt}/>
        <Fieldset legend="受控字段" disabled={disabled} hint="只读值仍可序列化；禁用值不进入FormData。复合选择的必选规则由宿主校验。">
          <Stack gap={4}>
            <AutoComplete id={id('workspace')} name="workspace" label="工作区名称" value={workspace} onChange={value=>{setWorkspace(value);clear('workspace');}} options={['研究工作区','协作工作区']} disabled={disabled} readOnly={readOnly} required hint="允许自定义文本；字段校验错误不阻止改选候选。" error={error('workspace')}/>
            <Rate id={id('rating')} name="rating" label="接入评分" value={rating} onChange={setRating} disabled={disabled} readOnly={readOnly} required/>
            <Slider id={id('volume')} name="volume" label="范围数值" value={volume} onChange={setVolume} disabled={disabled} readOnly={readOnly}/>
            <TimePicker id={id('time')} name="time" label="时间窗口" value={time} onChange={value=>{setTime(value);clear('time');}} min="08:00" max="18:00" step={1} required disabled={disabled} readOnly={readOnly} hint="支持秒级原生约束，不做时区换算。" error={error('time')}/>
            <ColorPicker id={id('color')} name="color" label="局部颜色" value={color} onChange={value=>{setColor(value);clear('color');}} required disabled={disabled} readOnly={readOnly} error={error('color')}/>
            <Mentions id={id('notes')} name="notes" label="提及正文" value={notes} onChange={setNotes} options={['研究组','协作组']} maxLength={200} disabled={disabled} readOnly={readOnly} hint="提交的是完整正文，不是候选标签。"/>
            <Cascader id={id('path')} name="resource" label="资源路径" options={options} value={path} onChange={value=>{setPath(value);clear('path');}} onExpand={()=>{setExpanded(true);if(!expanded)setDataState('loading');}} loading={!expanded&&dataState==='loading'} loadError={!expanded&&dataState==='error'?'候选读取失败（本地模拟）':undefined} onRetry={()=>setDataState('loading')} disabled={disabled} readOnly={readOnly} hint="进入未读取分支只发出展开意图。可用上方状态选择模拟完成、失败与重试。" error={error('path')}/>
            <Transfer id={id('members')} name="members" label="成员组" source={dataState==='empty'?[]:people} target={members} onChange={value=>{setMembers(value);clear('members');}} loading={dataState==='loading'} loadError={dataState==='error'?'成员读取失败（本地模拟）':undefined} onRetry={()=>setDataState('loading')} disabled={disabled} readOnly={readOnly} error={error('members')}/>
            <Upload id={id('files')} name="attachments" label="本地附件" files={files} onChange={setFiles} accept=".txt,.md" disabled={disabled} readOnly={readOnly} hint="只保留本地File对象。现代浏览器formdata事件追加受控文件，不自动上传。"/>
          </Stack>
        </Fieldset>
        <Inline gap={2}><Button type="submit">生成本地提交快照</Button><Button variant="secondary" onClick={()=>{setErrors([]);setSnapshot(null);}}>清除反馈</Button></Inline>
      </Stack>
    </Form>
    {snapshot&&<Stack gap={2}><Text role="status">本地提交快照已生成，未保存业务数据。</Text><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxWidth:'100%'}}>{JSON.stringify(snapshot,null,2)}</pre></Stack>}
    <ExternalUploadExample />
  </Stack></section>;
}
