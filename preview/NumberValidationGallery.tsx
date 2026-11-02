import { useRef, useState } from 'react';
import { Button, Checkbox, ErrorSummary, Inline, Notice, NumberField, Select, Stack, Text, TextField, type FieldError } from '../components';
import { ThemeProvider, type ThemeName } from '../components/theme';

export function NumberValidationGallery() {
  const [amount,setAmount]=useState<number|null>(1.5), [title,setTitle]=useState('合成配额');
  const [batch,setBatch]=useState<number|null>(2), [linked,setLinked]=useState(false);
  const [mode,setMode]=useState('native'), [state,setState]=useState('editable');
  const [businessError,setBusinessError]=useState(false), [errors,setErrors]=useState<FieldError[]>([]);
  const [attempt,setAttempt]=useState(0), [saved,setSaved]=useState('尚未保存');
  const form=useRef<HTMLFormElement>(null);
  const collectErrors = () => {
    const fields=[...form.current!.elements].filter((el):el is HTMLInputElement=>el instanceof HTMLInputElement && el.willValidate && !el.validity.valid);
    setErrors(fields.map(el=>({fieldId:el.id,message:`${el.labels?.[0]?.textContent || el.name}：${el.validationMessage}`})));
    setAttempt(n=>n+1);
  };
  return <Stack><Text as="h3" variant="heading">数字草稿与保存</Text>
    <Inline><Select label="校验方式" value={mode} onChange={event=>setMode(event.target.value)}><option value="native">原生校验</option><option value="manual">宿主校验</option></Select><Select label="字段状态" value={state} onChange={event=>setState(event.target.value)}><option value="editable">可编辑</option><option value="readonly">只读</option><option value="disabled">禁用</option></Select><Checkbox label="数量限制批次" checked={linked} onChange={event=>setLinked(event.target.checked)}/><Checkbox label="模拟业务错误" checked={businessError} onChange={event=>setBusinessError(event.target.checked)}/></Inline>
    <form ref={form} aria-label="合成配额设置" noValidate={mode==='manual'} onInvalidCapture={event=>{event.preventDefault();collectErrors();}} onSubmit={event=>{
      event.preventDefault();
      if (!event.currentTarget.checkValidity()) return;
      setErrors([]);setSaved(`已保存：${title}，数量 ${amount ?? '空'}，批次 ${batch ?? '空'}`);
    }}><Stack><Inline><Button type="submit">保存配额</Button><Button variant="secondary" onMouseDown={event=>event.preventDefault()} onClick={()=>form.current?.requestSubmit()}>脚本保存</Button></Inline><ErrorSummary errors={errors} focusKey={attempt}/>
      <TextField id="number-validation-title" name="title" label="配置名称" value={title} onChange={event=>setTitle(event.target.value)} required/>
      <NumberField id="number-validation-amount" name="amount" label="数量" value={amount} onValueChange={setAmount} min={-10} max={100} precision={1} required disabled={state==='disabled'} readOnly={state==='readonly'} error={businessError?'当前配额超过合成业务预算，请先调整预算。':undefined} hint="允许 -10 至 100；保留一位小数。"/>

      <NumberField id="number-validation-batch" name="batch" label="批次数" value={batch} onValueChange={setBatch} min={0} max={linked ? amount ?? undefined : 100} controls={false}/>
      <Text role="status">已接受值：{amount ?? '空'}</Text><Notice title={saved}/>
    </Stack></form>
  </Stack>;
}
export function NumberValidationFixture() {
  const params=new URLSearchParams(location.search);
  return <ThemeProvider defaultTheme={(params.get('theme')||'rhine') as ThemeName} data-rhine-motion={params.get('motion')==='manual'?'reduced':'system'}><main style={{padding:16}}><NumberValidationGallery/></main></ThemeProvider>;
}
