import { useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Button, Select, Steps, Surface, Switch, TextField } from '../components';

const items = [{id:'scope',label:'选择范围',description:'确认任务边界'},{id:'setup',label:'完成配置',description:'校验必填信息'},{id:'review',label:'核对结果',description:'完成后才显示成功'}];

export function StepsGallery() {
  const [step, setStep] = useState(0), [hostStep, setHostStep] = useState(2);
  const [mode, setMode] = useState('accept'), [draft, setDraft] = useState('合成任务草稿');
  const [long, setLong] = useState(false), [error, setError] = useState(false);
  const title = useRef<HTMLHeadingElement>(null), moveAfterCommit = useRef(false);
  useLayoutEffect(() => {
    if (moveAfterCommit.current) {
      moveAfterCommit.current = false;
      title.current?.focus();
      // The host keeps its chosen destination visible after long content changes layout.
      title.current?.scrollIntoView?.({ block: 'nearest' });
    }
  });
  const shownItems = long ? items.map(item => ({...item, label:`${item.label}：核对跨阶段的合成任务范围与保留已有工作记录`,description:`${item.description}；较长说明完整换行，返回后继续编辑，不丢失已有输入。`})) : items;
  return <>
    <Surface className="ds-gap-top" data-steps-demo="standalone"><h3>Steps · 验证后推进</h3>
      <Steps current={step} onStepChange={setStep} items={items}/>
      <div className="ds-row ds-gap-top"><Button onClick={()=>setStep(value=>Math.min(3,value+1))} disabled={step===3}>模拟本步完成</Button><Button variant="secondary" onClick={()=>setStep(0)}>重置步骤</Button></div>
      <p role="status" className="ds-caption">{step===3?'全部完成 · 合成演示':'未完成的步骤不能点击跳过；已完成步骤可返回。'}</p>
    </Surface>
    <Surface className="ds-gap-top" data-steps-demo="host"><h3>返回后继续编辑</h3>
      <p className="ds-caption">合成场景：返回保留草稿。可将焦点交给编辑标题，或暂不接受回退。</p>
      <Select label="回退处理" value={mode} onChange={event=>setMode(event.target.value)}>
        <option value="accept">接受回退</option><option value="reject">暂不接受回退</option><option value="focus">接受并定位编辑标题</option><option value="layout">内容更新后定位标题</option><option value="flush">立即更新步骤</option><option value="flush-focus">立即更新并定位标题</option>
      </Select>
      <div className="ds-row ds-gap-top"><Switch label="长步骤说明" checked={long} onCheckedChange={setLong}/><Switch label="保留校验错误" checked={error} onCheckedChange={setError}/></div>
      <Steps label="编辑任务步骤" items={shownItems} current={hostStep} error={error?'请核对范围，已有草稿仍保留。':undefined} onStepChange={index=>{
        if(mode==='reject') return;
        if(mode==='layout' || mode==='focus') moveAfterCommit.current=true;
        if(mode.startsWith('flush')) flushSync(()=>setHostStep(index)); else setHostStep(index);
        if(mode==='focus' || mode==='flush-focus') title.current?.focus();
      }}/>
      <h4 ref={title} tabIndex={-1}>编辑内容</h4>
      <TextField label="任务备注" value={draft} onChange={event=>setDraft(event.target.value)}/>
      <div className="ds-row ds-gap-top"><Button onClick={()=>setHostStep(value=>(value+1)%4)}>外部切换步骤</Button><Button variant="secondary" onClick={()=>setHostStep(2)}>恢复到核对结果</Button></div>
    </Surface>
  </>;
}
