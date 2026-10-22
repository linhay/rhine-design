// Deterministic synthetic records keep the table, pagination and aggregates consistent.
const demoModels=['gpt-6.1-sol','gpt-6-sol','gpt-6-luna'];
const demoRecords=Array.from({length:128},(_,i)=>({
  model:demoModels[i<86?0:i<117?1:2],
  failed:[2,65,100].includes(i),
  tokens:[2,65,100].includes(i)?0:9600+i*20,
  seconds:2.4,
  time:`${String(14-Math.floor(i/60)).padStart(2,'0')}:${String(59-i%60).padStart(2,'0')}:18`,
}));
function usage(){
 const none=state.scenario==='empty', records=none?[]:demoRecords;
 if(state.scenario==='loading')return empty('正在读取今日统计…','统计准备完成后显示。');
 const tokens=records.reduce((s,r)=>s+r.tokens,0), cost=tokens/250000;
 const compact=n=>new Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(n);
 const sums=demoModels.map(model=>({model,tokens:records.filter(r=>r.model===model).reduce((s,r)=>s+r.tokens,0),requests:records.filter(r=>r.model===model).length})).sort((a,b)=>b[state.metric]-a[state.metric]);
 const pageCount=Math.max(1,Math.ceil(records.length/10));state.page=Math.min(state.page,pageCount);
 const rows=records.slice((state.page-1)*10,state.page*10);
 return `<div class="section-bar"><span class="label">2026.10.22 / 上海</span><span class="label">个人用量</span></div>
 ${state.scenario==='partial'?notice('采集数据可能不完整','以下仅展示已采集用量；3 次失败请求未计价。'):''}
 ${state.scenario==='error'?notice('暂时无法刷新今日用量','以下保留上次读取的数据，请稍后重试。'):''}
 <dl class="metrics"><div><dt>请求次数</dt><dd>${records.length}</dd><small>失败 ${none?0:3} 次</small></div><div><dt>总 Token</dt><dd>${compact(tokens)}</dd><small>输入 ${compact(Math.round(tokens*.8))}<br>输出 ${compact(Math.round(tokens*.2))}</small></div><div><dt>预估费用</dt><dd>${none?'—':`$${cost.toFixed(2)}`}</dd><small>${none?'暂无已计价请求':'3 次未计价'}</small></div><div><dt>平均耗时</dt><dd>${none?'—':'2.4s'}</dd><small>每次请求</small></div></dl>
 <div class="section-bar"><h2>模型分布</h2><div class="mode" role="group" aria-label="图表指标"><button data-metric="tokens" aria-pressed="${state.metric==='tokens'}">Token</button><button data-metric="requests" aria-pressed="${state.metric==='requests'}">请求数</button></div></div>
 ${none?empty('今日暂无已采集用量','产生请求后可在此查看统计。'):`<div class="chart">${sums.map(r=>`<div class="chart-row"><div class="row"><span>${r.model}</span><strong>${compact(r[state.metric])}${state.metric==='requests'?' 次':''}</strong></div><div class="track"><i style="width:${100*r[state.metric]/sums[0][state.metric]}%"></i></div></div>`).join('')}</div><p class="hint">按${state.metric==='tokens'?'Token':'请求数'}排序 · 最多展示 6 个模型</p>`}
 <div class="section-bar"><h2>请求明细</h2><span class="label">共 ${records.length} 条</span></div>
 ${none?'<p class="hint">暂无请求明细</p>':`<table class="records"><thead><tr><th>时间 · 上海</th><th>模型</th><th>Token</th><th>费用</th><th>状态</th></tr></thead><tbody>${rows.map(r=>`<tr><td data-label="时间 · 上海">${r.time}</td><td data-label="模型">${r.model}</td><td data-label="Token">${compact(r.tokens)}</td><td data-label="费用">${r.failed?'未计价':`$${(r.tokens/250000).toFixed(4)}`}</td><td data-label="状态" class="${r.failed?'bad':'ok'}">${r.failed?'失败':'成功'}</td></tr>`).join('')}</tbody></table><div class="pager"><button class="link" data-page="prev" ${state.page===1?'disabled':''}>上一页</button><span>${state.page} / ${pageCount}</span><button class="link" data-page="next" ${state.page===pageCount?'disabled':''}>下一页</button></div>`}
 <div class="row"><span class="hint">更新于 14:59 · 上海</span><button class="link" data-action="refresh">刷新</button></div>`;
}
