import { useState } from 'react';
import { Badge, Button, DataTable, Dialog, Grid, Inline, KeyValue, Menu, Metric, Select, Stack, Surface, Text, TextField } from '../components';
import './subscriptions.css';

const initialPlans = [
  { id: 'gpt100', name: 'GPT100', color: 'green', count: 12, price: 100, description: '日常创作与轻量任务', status: '运行中' },
  { id: 'gpt200', name: 'GPT200', color: 'orange', count: 8, price: 200, description: '复杂推理与高频工作', status: '运行中' },
  { id: 'grok', name: 'Grok', color: 'violet', count: 4, price: 80, description: '探索灵感与多样表达', status: '运行中' },
];
const money = (value: number) => `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
type Plan = typeof initialPlans[number];
function TypeTag({ plan }: { plan: Plan }) {
  return <span className="rhine-type-tag" data-color={plan.color}>{plan.name}</span>;
}

export function SubscriptionGallery() {
  const [plans, setPlans] = useState(initialPlans);
  const [createOpen, setCreateOpen] = useState(false);
  const [planId, setPlanId] = useState('gpt100');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPrices, setShowPrices] = useState(true);
  const total = plans.reduce((sum, plan) => sum + plan.count, 0);
  const cost = plans.reduce((sum, plan) => sum + plan.count * plan.price, 0);
  const displayMoney = (value: number) => showPrices ? money(value) : '••••';
  const selectedPlan = plans.find(plan => plan.id === planId)!;

  return <section id="subscriptions" className="ds-subscriptions">
    <div className="ds-subscription-heading">
      <div><Text variant="overline" tone="muted" lang="en">YOUR SUBSCRIPTIONS, AT A GLANCE</Text><h1>订阅，一目了然<span aria-hidden="true">.</span></h1><Text tone="muted">数量、支出与状态，在这里轻松掌握。</Text></div>
      <Inline gap={3}>
        <Dialog title="新增订阅" description="选择类型与数量，预览更新后的订阅概览。仅使用演示数据，不产生实际扣费。" open={createOpen} onOpenChange={open => { setCreateOpen(open); setError(''); }} trigger={<Button>＋ 新增订阅</Button>}>
          <form onSubmit={event => {
            event.preventDefault();
            const count = Number(quantity);
            if (!Number.isInteger(count) || count < 1 || count > 99) { setError('请输入 1–99 之间的整数。'); return; }
            setPlans(current => current.map(plan => plan.id === planId ? { ...plan, count: plan.count + count } : plan));
            setMessage(`已添加 ${count} 个 ${selectedPlan.name} 演示订阅。`);
            setCreateOpen(false); setQuantity('1');
          }} noValidate>
            <Stack gap={4}>
              <Select label="订阅类型" value={planId} onChange={event => setPlanId(event.target.value)}>{plans.map(plan => <option value={plan.id} key={plan.id}>{plan.name}</option>)}</Select>
              <TextField label="订阅数量" type="number" inputMode="numeric" min={1} max={99} value={quantity} onChange={event => setQuantity(event.target.value)} error={error} hint="每次可添加 1–99 个演示订阅。" />
              <KeyValue items={[{ key: 'price', label: '单价 / 月', value: displayMoney(selectedPlan.price) }]} />
              <Inline gap={3}><Button type="submit">添加到概览</Button><Button variant="secondary" onClick={() => setCreateOpen(false)}>取消</Button></Inline>
            </Stack>
          </form>
        </Dialog>
        <Menu label="订阅管理" trigger={<Button variant="secondary" aria-label="管理订阅">管理 ⋯</Button>} items={[
          { id: 'amounts', label: showPrices ? '隐藏金额' : '显示金额', onSelect: () => setShowPrices(value => !value) },
          { id: 'reset', label: '重置演示数据', onSelect: () => { setPlans(initialPlans); setMessage('演示数据已重置。'); } },
        ]} />
      </Inline>
    </div>
    <div className="ds-subscription-notice"><span>主题场景 / 订阅管理</span><span>示例数量与价格 · 无实际交易</span></div>
    <div role="status" className="ds-subscription-status">{message}</div>
    <Surface className="ds-subscription-summary"><Grid minWidth={180} gap={6}>
      <Metric label="订阅总数" value={total} unit="个" description="所有订阅均在正常运行" />
      <Metric label="每月支出" value={displayMoney(cost)} description="按当前演示订阅计算" />
      <Metric label="订阅类型" value="03" unit="类" description="GPT100 / GPT200 / Grok" />
    </Grid></Surface>
    <div className="ds-subscription-section-head"><Text as="h2" variant="section">我的订阅</Text><Text tone="muted" variant="caption">点击卡片，查看明细 ↗</Text></div>
    <div className="ds-subscription-cards">{plans.map(plan => <Dialog key={plan.id} title={`${plan.name} 订阅明细`} description={plan.description} trigger={
      <button type="button" className="rhine-surface ds-subscription-card" aria-label={`查看 ${plan.name} 订阅明细`}>
        <span className="ds-subscription-card-top"><TypeTag plan={plan} /><span className="ds-subscription-arrow" aria-hidden="true">↗</span></span>
        <span className="ds-subscription-count">{plan.count}<small>个订阅</small></span>
        <span className="ds-subscription-description">{plan.description}</span>
        <span className="ds-subscription-card-bottom"><span className="ds-subscription-running">● {plan.status}</span><strong>{displayMoney(plan.count * plan.price)}<small> / 月</small></strong></span>
      </button>
    }><Stack gap={6}><Inline><TypeTag plan={plan} /><Badge tone="success">{plan.status}</Badge></Inline><Metric label="当前订阅数量" value={plan.count} unit="个" /><KeyValue items={[
      { key: 'price', label: '单价 / 月', value: displayMoney(plan.price) },
      { key: 'total', label: '每月合计', value: displayMoney(plan.count * plan.price) },
      { key: 'cycle', label: '计费周期', value: '按月 · 演示数据' },
    ]} /><Text variant="caption" tone="muted">这是交互示例，价格不代表真实产品报价。</Text></Stack></Dialog>)}</div>
    <Surface className="ds-subscription-table"><DataTable caption="每月费用明细" rows={plans} rowKey={plan => plan.id} columns={[
      { key: 'type', header: '订阅类型', render: plan => <TypeTag plan={plan} /> },
      { key: 'count', header: '数量', align: 'right', render: plan => `${plan.count} 个` },
      { key: 'price', header: '单价 / 月', align: 'right', render: plan => displayMoney(plan.price) },
      { key: 'total', header: '合计 / 月', align: 'right', render: plan => <strong>{displayMoney(plan.count * plan.price)}</strong> },
      { key: 'status', header: '状态', render: plan => <Badge tone="success">{plan.status}</Badge> },
    ]} /><div className="ds-subscription-total"><Text tone="muted">每月合计</Text><Text variant="heading" numeric>{displayMoney(cost)}</Text></div></Surface>
  </section>;
}
