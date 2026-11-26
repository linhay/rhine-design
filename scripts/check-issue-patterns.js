// Run against the production gallery with playwright-cli.
async page => {
  page.setDefaultTimeout(4000);
  const origin = await page.evaluate(() => location.origin);
  const results = [], errors = [];
  const failedRequests = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('requestfailed', request => failedRequests.push(request.url()));
  await page.addInitScript(() => {
    window.copiedTemplates = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      async writeText(text) { window.copiedTemplates.push(text); },
    } });
  });
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const focused = locator => locator.evaluate(node => document.activeElement === node);
  const choose = value => page.getByRole('combobox', { name: '我正在设计什么场景' }).selectOption(value);
  async function copy(button, template) {
    const expected = await template.textContent();
    await button.click();
    await page.waitForFunction(() => window.copiedTemplates.length > 0);
    const submitted = await page.evaluate(() => window.copiedTemplates.shift());
    assert(submitted === expected, 'copy differs from displayed template');
  }
  for (const [width, zoom, theme] of [[1230, 1, 'rhine'], [610, 1, 'arknights'], [400, 2, 'neo-brutalism']]) {
    const scenario = { width, zoom, theme };
    for (const issue of [236, 255, 256, 262]) {
      try {
        await page.setViewportSize({ width, height: 760 });
        await page.emulateMedia({ reducedMotion: zoom === 2 ? 'reduce' : 'no-preference' });
        await page.goto(`${origin}/?theme=${theme}&probe=${issue}#${issue === 236 ? 'upload' : 'patterns'}`);
        if (zoom === 2) await page.evaluate(() => document.documentElement.style.zoom = '2');
        if (issue === 236) {
          const form = page.getByRole('form', { name: '附件提交示例' });
          const input = form.getByLabel('选择本地文件', { exact: true });
          const hint = '附件随表单保存。本示例只预览表单内容。';
          const submit = form.getByRole('button', { name: '预览表单附件' });
          await form.getByText(hint, { exact: true }).waitFor();
          const probe = 'check-issue-patterns.js';
          await input.setInputFiles(`scripts/${probe}`);
          await submit.click();
          await form.getByText(`表单收到 2 个文件：example.txt、${probe}`, { exact: true }).waitFor();
          await page.getByRole('checkbox', { name: '显示附件说明' }).uncheck();
          assert(await form.getByText(hint, { exact: true }).count() === 0, 'hint is not omitted');
          const actual = await form.evaluate(async element => Promise.all(new FormData(element).getAll('attachments').map(async file => [file.name, await file.text()])));
          assert(actual.length === 2 && actual[0][0] === 'example.txt' && actual[0][1] === 'synthetic' &&
            actual[1][0] === probe && actual[1][1].startsWith('// Run against the production gallery'), 'native formdata contents differ');
          const sample = form.getByRole('button', { name: `移除 ${probe}` });
          await sample.press('Enter');
          assert(await focused(input), 'remove did not return focus to picker');
          await submit.click();
          await form.getByText('表单收到 1 个文件：example.txt', { exact: true }).waitFor();
          await page.getByRole('checkbox', { name: '禁用本地文件操作' }).check();
          await submit.click();
          await form.getByText('表单收到 0 个文件', { exact: true }).waitFor();
        }
        if (issue === 255) {
          await choose('credential-instructions');
          const trigger = page.getByRole('button', { name: '打开凭据示例' });
          await trigger.press('Enter');
          const dialog = page.getByRole('dialog', { name: '客户端接入配置' });
          const terminal = dialog.getByLabel('命令行配置模板');
          const desktop = dialog.getByLabel('桌面配置模板');
          assert(await terminal.count() === 0 && await desktop.count() === 0, 'templates mounted before expansion');
          await dialog.getByLabel('命令行客户端', { exact: true }).press('Enter');
          await terminal.waitFor();
          assert(await desktop.count() === 0, 'client disclosures are coupled');
          await copy(dialog.getByRole('button', { name: '复制命令行模板' }), terminal);
          await dialog.getByLabel('桌面客户端', { exact: true }).click();
          await desktop.waitFor();
          await copy(dialog.getByRole('button', { name: '复制桌面模板' }), desktop);
          await dialog.getByRole('button', { name: '生成示例凭据' }).click();
          await dialog.getByText('签发结果（仅本次打开显示）：demo-result-only').waitFor();
          assert(!(await terminal.textContent()).includes('demo-result-only') && !(await desktop.textContent()).includes('demo-result-only'), 'issuance leaked into template');
          await copy(dialog.getByRole('button', { name: '复制桌面模板' }), desktop);
          await page.keyboard.press('Escape');
          await dialog.waitFor({ state: 'detached' });
          await page.waitForFunction(() => document.activeElement?.textContent === '打开凭据示例');
          await trigger.press('Enter');
          await dialog.waitFor();
          assert(await dialog.getByText(/demo-result-only/).count() === 0, 'issuance persists across reopen');
        }
        if (issue === 256) {
          await choose('mixed-settings-cards');
          const region = page.getByRole('region', { name: '混合卡片示例' });
          const layout = await region.evaluate(parent => {
            const [account, list, grid] = parent.children;
            const [a, b] = grid.children;
            const rect = node => node.getBoundingClientRect();
            const full = node => Math.abs(rect(node).width - rect(parent).width) < 2;
            return { full: full(account) && full(list), order: rect(account).bottom < rect(list).top && rect(list).bottom < rect(grid).top,
              columns: Math.abs(rect(a).top - rect(b).top) < 1 ? 2 : 1 };
          });
          assert(layout.full && layout.order && layout.columns === (width === 400 ? 1 : 2), 'mixed card placement differs from expected');
          await region.getByRole('button', { name: '登录示例账号' }).press('Enter');
          await region.getByText('示例账号 · 已登录').waitFor();
          const toggle = region.getByRole('switch', { name: '同步通知' });
          await toggle.press('Space');
          assert(await toggle.getAttribute('aria-checked') === 'true' && await focused(toggle), 'switch cannot complete from keyboard');
        }
        if (issue === 262) {
          await choose('external-handoff');
          const attempt = page.getByRole('button', { name: '尝试打开桌面客户端' });
          const manual = page.getByLabel('手工配置模板');
          assert(await manual.count() === 0, 'fallback mounted before explicit action');
          await attempt.press('Enter');
          await page.getByText('已尝试打开桌面客户端。请在客户端继续配置。').waitFor();
          assert(await manual.count() === 0 && await focused(attempt), 'handoff opens fallback or takes focus');
          await attempt.press('Enter');
          assert(await manual.count() === 0 && await focused(attempt), 'repeated handoff opens fallback or takes focus');
          await page.getByLabel('查看手工配置', { exact: true }).press('Enter');
          await manual.waitFor();
          await copy(page.getByRole('button', { name: '复制手工配置' }), manual);
        }
        results.push({ ...scenario, issue, pass: true });
      } catch (error) {
        results.push({ ...scenario, issue, pass: false, error: String(error) });
      }
    }
  }
  return { pass: results.every(item => item.pass) && !errors.length && !failedRequests.length, results, errors, failedRequests };
}
