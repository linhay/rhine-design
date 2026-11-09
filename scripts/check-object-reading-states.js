// Run in the production fixture after check-object-reading-browser.js.
async page => {
  const base = new URL(page.url());
  const theme = base.searchParams.get('theme') || 'rhine';
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const results = [];
  const scenarios = [
    ['loading', '正在加载正文', '正文'], ['error', '正文加载失败', '正文'],
    ['restricted', '正文受限', '正文'], ['unsupported', '格式不可预览', '正文'],
    ['source-unavailable', '来源不可用', '来源'], ['no-related', '暂无关联', '关联'],
    ['related-unavailable', '关联不可用', '关联'],
  ];
  for (const width of [400, 520, 880]) for (const zoom of [1, 2]) {
    await page.setViewportSize({ width, height: 900 });
    base.searchParams.set('zoom', String(zoom));
    await page.goto(base.href);
    await page.getByRole('combobox', { name: '目录', exact: true }).selectOption('empty');
    await page.getByText('目录为空', { exact: true }).waitFor();
    await page.getByRole('button', { name: '返回资料目录' }).click();
    await page.getByRole('searchbox').fill('不存在');
    await page.getByText('没有匹配结果', { exact: true }).waitFor();
    await page.getByRole('button', { name: '清除筛选' }).click();
    for (const [scenario, text, tab] of scenarios) {
      await page.getByRole('combobox', { name: '阅读场景' }).selectOption(scenario);
      await page.getByRole('button', { name: /^阅读：共享文件/ }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('tab', { name: tab, exact: true }).click();
      await dialog.getByText(text, { exact: true }).waitFor();
      assert(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1), `${scenario} overflow`);
      const panel = dialog.getByRole('tabpanel');
      assert(await panel.getByRole('link').count() === 0, `${scenario} no bypass link`);
      if (['no-related', 'related-unavailable', 'source-unavailable'].includes(scenario)) assert(await panel.getByRole('button').count() === 0, 'no fabricated action');
      if (scenario === 'restricted') {
        assert(await dialog.getByTestId('reading-end').count() === 0, 'restricted body excluded');
        for (const name of ['来源', '关联']) {
          await dialog.getByRole('tab', { name, exact: true }).click();
          assert(await dialog.getByRole('tabpanel').getByRole('button').count() === 0, 'restricted related action excluded');
        }
      }
      if (scenario === 'error') { await dialog.getByRole('button', { name: '重试正文' }).click(); await dialog.getByTestId('reading-end').waitFor(); }
      await dialog.getByRole('button', { name: '关闭对话框' }).click();
      await dialog.waitFor({ state: 'detached' });
    }
    assert((await page.getByTestId('reading-invariants').innerText()).includes('未读'), 'read state retained');
    results.push({ theme, width, cssZoom: zoom, states: 9, status: 'PASS' });
  }
  await page.getByRole('combobox', { name: '阅读场景' }).selectOption('loading');
  for (const mode of ['system', 'manual']) {
    await page.emulateMedia({ reducedMotion: mode === 'system' ? 'reduce' : 'no-preference' });
    await page.getByRole('combobox', { name: '动态偏好' }).selectOption(mode === 'system' ? 'system' : 'reduced');
    await page.getByRole('button', { name: /^阅读：河谷观察笔记/ }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('tab', { name: '正文', exact: true }).click();
    const motion = await dialog.evaluate(el => ({
      system: matchMedia('(prefers-reduced-motion: reduce)').matches,
      dialog: getComputedStyle(el).animationDuration,
      skeleton: getComputedStyle(el.querySelector('.rhine-skeleton')).animationDuration,
    }));
    assert(motion.system === (mode === 'system'), 'independent reduced motion setup');
    assert(parseFloat(motion.dialog) <= .001 && parseFloat(motion.skeleton) <= .001, `${mode} animations reduced ${JSON.stringify(motion)}`);
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached' });
    results.push({ theme, mode, ...motion, status: 'PASS' });
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  return results;
}
