import { useState } from 'react';
import { Button, CopyButton, EmptyState, ErrorSummary, Fieldset, MediaCard, MediaViewer, Stack, Steps, Text, TextField, ThemePicker } from '../components';

const description = '示例辅助说明：这是一段用于检查长文本自然换行的合成内容，来源、时间与读取状态应保持完整可读。';
export function ComponentTypographyGallery() {
  const [open, setOpen] = useState(false);
  const [next, setNext] = useState(false);
  return <Stack gap={4}>
    <Text as="h2" variant="heading">公共组件文字配对</Text>
    <EmptyState title="没有匹配结果：请检查名称、日期与当前范围" description={description} action={<Button onClick={() => setOpen(true)}>打开文字检查</Button>} />
    <MediaViewer open={open} onOpenChange={setOpen} trigger={<Button>打开媒体示例</Button>} title={next ? '下一项合成媒体' : '示例媒体与较长标题：检查字号、行高和字重'} description={description}
      onNext={() => setNext(true)} onPrevious={() => setNext(false)}
      actions={<label>显示方式 <select aria-label="显示方式"><option>适应窗口</option><option>原始尺寸</option></select></label>}>
      <Text>合成画布：不加载真实媒体。</Text>
    </MediaViewer>
    <MediaCard title="读取状态" kind="photo" state="loading" onOpen={() => setOpen(true)} />
    <CopyButton value="synthetic-example" label="模拟复制" copy={async () => {}} />
    <Steps current={0} items={[{ id:'one',label:'检查说明',description }]} />
    <Fieldset legend="分组提示" hint={description}><TextField id="typography-example" label="示例字段" /></Fieldset>
    <ErrorSummary title="请检查以下字段的完整内容" errors={[{fieldId:'typography-example',message:'定位示例字段'}]} />
    <ThemePicker value="rhine" onValueChange={() => {}} options={[{value:'rhine',label:'仅展示文字状态',previewSrc:'data:image/png;base64,invalid'}]} />
  </Stack>;
}
