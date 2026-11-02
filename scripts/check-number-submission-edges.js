async page => {
 const origin=await page.evaluate(()=>location.origin), rows=[], errors=[];page.on('pageerror',e=>errors.push(String(e)));page.setDefaultTimeout(6000);
 for(const kind of ['dependency','fieldset','legend']) {
  const row={kind,pass:false};rows.push(row);
  try {
   await page.goto(`${origin}/?fixture=number-validation&edge=${kind}`);
   const input=page.getByRole('spinbutton',{name:'数量',exact:true}), form=page.getByRole('form',{name:'提交边界设置'});
   if(kind==='dependency') {
    // Two pending drafts, then the real browser requestSubmit path with no blur.
    await form.evaluate(el=>{const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;for(const [name,value] of [['amount','7'],['limit','10']]){const input=el.elements.namedItem(name);setter.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));}});
    await form.evaluate(el=>el.requestSubmit());
    row.first={draft:await input.inputValue(),saved:await form.getByRole('status').allTextContents(),text:await form.innerText()};
    if(!row.first.text.includes('提交处理次数：0') || !row.first.text.includes('尚未保存') || row.first.draft!=='7') throw Error('rejected earlier draft reached host save');
    await page.getByRole('spinbutton',{name:'上限',exact:true}).press('Enter');
    await page.getByRole('button',{name:'提交当前草稿',exact:true}).click();
    await page.getByText('已保存：数量 7，上限 10',{exact:true}).waitFor();
   } else {
    row.disabled=await input.evaluate(el=>el.matches(':disabled'));
    if(row.disabled!==(kind==='fieldset'))throw Error('native disabled/legend semantics');
    await page.getByRole('button',{name:'提交当前草稿',exact:true}).click();
    const expected=kind==='fieldset'?'1.25':'1.3';
    row.actual=await input.inputValue();
    if(row.actual!==expected)throw Error(`unexpected accepted draft ${row.actual}`);
    await page.getByText(`已保存：数量 ${expected}，上限 3`,{exact:true}).waitFor();
    if(!(await form.innerText()).includes(`数量接受次数：${kind==='fieldset'?0:1}`))throw Error('unexpected change callback');
   }
   row.pass=true;
  } catch(error) {row.error=String(error);}
 }
 return {pass:rows.every(r=>r.pass)&&errors.length===0,rows,errors,boundary:'Synthetic pending input edits; native requestSubmit and keyboard/pointer correction; synthetic save only'};
}
