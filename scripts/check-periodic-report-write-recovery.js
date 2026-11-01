async page => {
  const origin = await page.evaluate(() => location.origin), failures = [], errors = [], cases = [];
  page.on('pageerror', error => errors.push(error.message));
  const check = (pass, detail) => { if (!pass) failures.push(detail); };
  const report = () => page.locator('[data-report]'), generate = () => page.locator('[data-generate]'), read = () => page.locator('[data-read]');
  const enter = async locator => { await locator.focus(); await page.keyboard.press('Enter'); };
  const status = value => page.waitForFunction(value => document.querySelector('[data-report]')?.dataset.reportStatus === value && !document.querySelector('[data-generate]').hasAttribute('aria-busy'), value);
  const refresh = async () => { await enter(read()); await page.waitForFunction(() => !document.querySelector('[data-read]').hasAttribute('aria-busy')); };
  for (const [theme, mode] of [['rhine', 'normal'], ['arknights', 'normal'], ['neo-brutalism', 'normal'], ['neutral', 'normal'], ['rhine', 'system'], ['rhine', 'manual']]) {
    const label = `${theme}/${mode}/400x648/CSS200`;
    await page.emulateMedia({ reducedMotion: mode === 'system' ? 'reduce' : 'no-preference' });
    await page.setViewportSize({ width: 400, height: 648 });
    await page.goto(`${origin}/?fixture=periodic-report&theme=${theme}${mode === 'manual' ? '&motion=manual' : ''}`);
    await page.locator('.rhine-periodic-fixture').evaluate(el => { el.style.width = '200px'; el.style.boxSizing = 'border-box'; el.style.zoom = '2'; });
    await page.getByLabel('报告合成场景').selectOption('idle');
    await enter(generate()); await status('completed');
    for (let i = 0; i < 3; i++) {
      await refresh();
      check(await report().getAttribute('data-report-status') === 'completed' && await report().getAttribute('data-generation-count') === '1' && await page.getByRole('heading', { name: '活动摘要', exact: true }).isVisible(), { label, kind: 'idle-generated-refresh-stays-completed', refresh: i + 1 });
    }
    await page.getByLabel('报告周期').selectOption('month'); await refresh();
    check(await report().getAttribute('data-report-status') === 'idle' && await report().getAttribute('data-generation-count') === '0', { label, kind: 'different-period-no-state-leak' });
    await enter(generate()); await status('completed'); await page.getByLabel('报告对象').selectOption('示例人员 B'); await refresh();
    check(await report().getAttribute('data-report-status') === 'idle', { label, kind: 'different-person-no-state-leak' });
    await page.getByLabel('报告周期').selectOption('week'); await page.getByLabel('报告合成场景').selectOption('response-lost');
    await enter(generate()); await status('unknown');
    check(await generate().evaluate(el => el === document.activeElement) && await generate().getAttribute('aria-disabled') === 'true' && await page.getByRole('button', { name: '停止等待' }).count() === 0, { label, kind: 'rejection-unknown-guard-focus-exits-pending' });
    await enter(generate());
    check(await report().getAttribute('data-generation-count') === '1' && await page.locator('[data-daily]').count() === 7 && await page.getByText('生成结果待核对', { exact: true }).isVisible(), { label, kind: 'rejection-no-duplicate-retains-materials' });
    const feedback = page.locator('[data-report-feedback]'); await feedback.scrollIntoViewIfNeeded();
    const bounds = await feedback.evaluate(el => {
      const box = el.getBoundingClientRect(), range = document.createRange(); range.selectNodeContents(el);
      return { text: el.textContent, width: box.width, inView: box.top >= -1 && box.bottom <= innerHeight + 1, fits: [...range.getClientRects()].every(r => r.left >= box.left - 1 && r.right <= box.right + 1) };
    });
    check(bounds.inView && bounds.fits && bounds.text.includes('不能重复生成'), { label, kind: 'unknown-feedback-visible', bounds });
    await refresh(); await status('completed');
    check(await generate().getAttribute('aria-disabled') !== 'true' && await report().getAttribute('data-generation-count') === '1', { label, kind: 'read-establishes-known-result' });
    await refresh(); check(await report().getAttribute('data-report-status') === 'completed', { label, kind: 'recovery-read-stable' });
    await page.getByLabel('报告合成场景').selectOption('failed');
    await enter(generate()); await status('failed');
    check(await generate().getAttribute('aria-disabled') !== 'true' && await generate().evaluate(el => el === document.activeElement), { label, kind: 'explicit-failed-can-retry' });
    await enter(generate()); await status('failed'); check(await report().getAttribute('data-generation-count') === '2', { label, kind: 'explicit-failed-retry-executed' });
    check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), { label, kind: 'no-page-overflow' });
    cases.push({ label, bounds });
  }
  return { pass: !failures.length && !errors.length, failures, errors, cases, browser: page.context().browser()?.version(), scope: 'production targeted write recovery; synthetic service, CSS zoom' };
}
