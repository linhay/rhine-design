// Open the built gallery first; run via Playwright run-code --filename.
async page => {
  const origin=new URL(page.url()).origin, results=[];
  const assert=(ok,message)=>{if(!ok)throw Error(message);};
  await page.setViewportSize({width:400,height:1000});
  for(const scenario of ['first-error','normal','slow','late']) {
    await page.goto(`${origin}/?fixture=remote-selection&theme=neo-brutalism&zoom=2&motion=system`);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.getByLabel('模拟响应',{exact:true}).selectOption(scenario);
    const input=page.getByRole('combobox',{name:'合成授权对象',exact:true});
    if(scenario==='first-error') {
      await page.getByText('合成请求失败，请重试',{exact:true}).waitFor();
      await input.click(); await page.getByRole('button',{name:'重试',exact:true}).click();
      await page.getByText('5 个候选项',{exact:true}).waitFor();
    } else if(scenario==='normal') {
      await page.getByText('5 个候选项',{exact:true}).waitFor(); await input.click();
      await input.press('Tab'); await page.getByRole('button',{name:'加载更多',exact:true}).press('Enter');
      await page.getByText('10 个候选项',{exact:true}).waitFor();
      await input.press('Tab'); await page.getByRole('button',{name:'加载更多',exact:true}).press('Enter');
      await page.getByText('12 个候选项',{exact:true}).waitFor();
      await page.waitForFunction(id=>document.activeElement?.id===id,await input.getAttribute('id'),{timeout:2000});
      assert(await page.getByRole('button',{name:'加载更多',exact:true}).count()===0,'terminal action');
      await page.getByRole('button',{name:'完成选择',exact:true}).click();
      const tags=await page.locator('.rhine-multi-select__tags').evaluate(el=>({scroll:el.scrollWidth,client:el.clientWidth}));
      assert(tags.scroll<=tags.client+1,'long tags overflow');
    } else {
      await input.fill('12'); await page.getByText('1 个候选项',{exact:true}).waitFor();
      // Wait beyond the deliberately stale transport using its documented fixture interval.
      await page.waitForTimeout(1300);
      assert(await page.getByRole('listbox').getByRole('option').count()===1,'stale result replaced search');
      await input.fill('1'); await input.press('Escape'); await page.waitForTimeout(1300);
      assert(await page.getByRole('listbox').count()===0,'closed request reopened dropdown');
      assert(await page.getByRole('button',{name:/^(加载更多|重试)$/}).count()===0,'closed request actions leaked');
      await input.fill('2'); await page.getByLabel('挂载选择器',{exact:true}).uncheck(); await page.waitForTimeout(1300);
      assert(await input.count()===0,'unmounted request returned');
    }
    results.push({scenario,status:'PASS'});
  }
  return results;
}
