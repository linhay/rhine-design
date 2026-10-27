// Build the review examples and serve dist at loopback port 18342 first.
// playwright-cli run-code --filename scripts/check-review-scroll.js
async page => {
  const failures = [];
  const check = (condition, message) => { if (!condition) failures.push(message); };
  const base = 'http://127.0.0.1:18342/review-platform/';
  const addLongDirectory = async () => {
    await page.locator('.rhine-review-directory nav').evaluate(nav => {
      const section = document.createElement('section');
      const heading = document.createElement('h2');
      heading.textContent = '长目录';
      section.append(heading);
      for (let index = 0; index < 36; index++) {
        const link = document.createElement('a');
        link.href = '#synthetic-directory-entry';
        link.textContent = `合成场景 ${index + 1} · 长目录滚动验证`;
        section.append(link);
      }
      nav.append(section);
    });
    await page.waitForFunction(() => {
      const directory = document.querySelector('.rhine-review-directory');
      return directory instanceof HTMLElement && directory.scrollHeight > directory.clientHeight;
    });
  };
  const regions = () => page.evaluate(() => {
    const shell = document.querySelector('.rhine-review-shell');
    const header = document.querySelector('.rhine-review-header');
    const body = document.querySelector('.rhine-review-body');
    const directory = document.querySelector('.rhine-review-directory');
    const main = document.querySelector('.rhine-review-main');
    const search = directory?.querySelector('.rhine-field');
    if (!(shell instanceof HTMLElement) || !(header instanceof HTMLElement) || !(body instanceof HTMLElement) || !(directory instanceof HTMLElement) || !(main instanceof HTMLElement) || !(search instanceof HTMLElement)) return null;
    const searchRect = search.getBoundingClientRect();
    const directoryRect = directory.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    return {
      shellHeight: shell.clientHeight,
      shellScrollHeight: shell.scrollHeight,
      headerTop: headerRect.top,
      headerBottom: headerRect.bottom,
      bodyTop: body.getBoundingClientRect().top,
      bodyBottom: body.getBoundingClientRect().bottom,
      directoryClientHeight: directory.clientHeight,
      directoryScrollHeight: directory.scrollHeight,
      directoryOverflow: getComputedStyle(directory).overflowY,
      mainClientHeight: main.clientHeight,
      mainScrollHeight: main.scrollHeight,
      mainOverflow: getComputedStyle(main).overflowY,
      searchOffset: searchRect.top - directoryRect.top,
    };
  });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(base);
  await page.frameLocator('iframe').getByRole('heading', { name: '桌面工作区' }).waitFor();
  await addLongDirectory();
  const desktop = await regions();
  check(desktop?.shellHeight === 900 && desktop.shellScrollHeight === desktop.shellHeight, 'desktop shell stays within the viewport');
  check(desktop?.headerTop >= 0 && desktop.headerBottom <= desktop.shellHeight, 'desktop header remains visible');
  check(desktop?.bodyTop >= desktop.headerBottom - 1 && desktop.bodyBottom <= desktop.shellHeight + 1, 'desktop body uses remaining viewport');
  check(desktop?.directoryOverflow === 'auto' && desktop.directoryScrollHeight > desktop.directoryClientHeight, 'desktop directory has bounded independent scrolling');
  check(desktop?.mainOverflow === 'auto' && desktop.mainScrollHeight > desktop.mainClientHeight, 'desktop main has its own scrolling');
  check((desktop?.searchOffset ?? 999) <= 24, 'desktop directory search remains pinned');
  const independent = await page.evaluate(() => {
    const directory = document.querySelector('.rhine-review-directory');
    const main = document.querySelector('.rhine-review-main');
    if (!(directory instanceof HTMLElement) || !(main instanceof HTMLElement)) return null;
    directory.scrollTop = 180;
    const mainBefore = main.scrollTop;
    main.scrollTop = 120;
    return { directory: directory.scrollTop, main: main.scrollTop, mainBefore };
  });
  check(independent?.directory === 180 && independent.main === 120 && independent.mainBefore === 0, 'directory and main scroll positions stay independent');
  const currentVisible = await page.locator('.rhine-review-directory a[aria-current]').evaluate(link => {
    const directory = link.closest('.rhine-review-directory');
    if (!(directory instanceof HTMLElement)) return false;
    link.scrollIntoView({ block: 'nearest' });
    const linkRect = link.getBoundingClientRect();
    const directoryRect = directory.getBoundingClientRect();
    return linkRect.top >= directoryRect.top - 1 && linkRect.bottom <= directoryRect.bottom + 1;
  });
  check(currentVisible, 'current scene can be located after directory scrolling');

  for (const width of [520, 400]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base);
    await page.frameLocator('iframe').getByRole('heading', { name: '桌面工作区' }).waitFor();
    await page.getByRole('button', { name: '场景目录' }).click();
    await addLongDirectory();
    const mobile = await regions();
    check(mobile?.directoryOverflow === 'auto' && mobile.directoryScrollHeight > mobile.directoryClientHeight, `${width}px drawer has its own scrolling`);
    const mobileIndependent = await page.evaluate(() => {
      const directory = document.querySelector('.rhine-review-directory');
      const main = document.querySelector('.rhine-review-main');
      if (!(directory instanceof HTMLElement) || !(main instanceof HTMLElement)) return null;
      directory.scrollTop = 120;
      const mainBefore = main.scrollTop;
      main.scrollTop = 80;
      return { directory: directory.scrollTop, main: main.scrollTop, mainBefore };
    });
    check(mobileIndependent?.directory === 120 && mobileIndependent.main === 80 && mobileIndependent.mainBefore === 0, `${width}px drawer and main scroll independently`);
    await page.getByRole('textbox', { name: '搜索场景' }).focus();
    await page.keyboard.press('Escape');
    check(await page.getByRole('button', { name: '场景目录' }).getAttribute('aria-expanded') === 'false', `${width}px drawer closes on Escape`);
    check(await page.getByRole('button', { name: '场景目录' }).evaluate(element => element === document.activeElement), `${width}px Escape restores focus`);
  }
  return { failures, browser: await page.evaluate(() => navigator.userAgent) };
}
