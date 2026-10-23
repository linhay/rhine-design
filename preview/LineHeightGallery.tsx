import { useState } from 'react';
import { Checkbox, Grid, Stack, Surface, Text, type TextVariant } from '../components';
import type { CSSProperties } from 'react';
import './line-height.css';

const samples: {variant: TextVariant; label: string; size: string; leading: string; copy: string}[] = [
  {variant:'heading',label:'卡片标题',size:'16 / 24px',leading:'heading',copy:'让每一行标题保持清晰，让多行内容自然延续。'},
  {variant:'body',label:'正文',size:'14 / 22px',leading:'body',copy:'使用统一的文字节奏组织内容。说明自然换行，保留中英文 API 和数字 128 的阅读空间，不通过压缩行高限制卡片高度。'},
  {variant:'caption',label:'辅助说明',size:'12 / 18px',leading:'caption',copy:'最近检查 14:32 · 示例数据。长说明允许换行，时间与来源仍保持可读，重要信息不使用省略号隐藏。'},
  {variant:'code',label:'代码与路径',size:'12 / 20px',leading:'code',copy:'workspace/example-project/configuration/very-long-resource-identifier-for-line-wrapping.json'},
];

export function LineHeightGallery() {
  const [guides,setGuides]=useState(true);
  return <div className="ds-gap-top"><Stack gap={6}>
    <Stack gap={2}><Text as="h3" variant="section">多行行高与段落</Text><Text tone="muted">行高控制每一行的高度，gap控制内容组之间的距离。辅助线标出行框，不是字体基线。</Text></Stack>
    <Checkbox label="显示行框辅助线" checked={guides} onChange={event=>setGuides(event.target.checked)}/>
    <Grid gap={6} minWidth={240}>{samples.map(sample=><Surface key={sample.variant}><Stack gap={4}>
      <Stack gap={2}><Text as="h4" variant="heading">{sample.label}</Text><Text variant="code" tone="muted">{sample.size} · --rhine-leading-{sample.leading}</Text></Stack>
      <Text variant={sample.variant} className="ds-leading-sample" data-guides={guides} style={{'--ds-leading':`var(--rhine-leading-${sample.leading})`} as CSSProperties}>{sample.copy}</Text>
    </Stack></Surface>)}</Grid>
    <Surface><Stack gap={4}><Text as="h4" variant="heading">段内22px，段间12px</Text><Stack gap={3} className="ds-leading-paragraphs">
      <Text className="ds-leading-sample" data-guides={guides} style={{'--ds-leading':'var(--rhine-leading-body)'} as CSSProperties}>第一段：文本自然换行，每行高度为22px。文字越长，段落越高，不添加额外的行间gap。</Text>
      <Text className="ds-leading-sample" data-guides={guides} style={{'--ds-leading':'var(--rhine-leading-body)'} as CSSProperties}>第二段：这是独立的信息段，由Stack gap=3提供12px段落间距，不使用空行或br撑开。</Text>
    </Stack></Stack></Surface>
  </Stack></div>;
}
