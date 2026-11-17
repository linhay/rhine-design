// Native Playwright Page contract audit. Synthetic host operations, CSS zoom and touch emulation only.
async (page, { quick = false } = {}) => {
    page.setDefaultTimeout(6000);
    const base = await page.evaluate(() => location.origin + location.pathname), samples = [], failures = [];
    let navigation=0;
    const check = (value, tag, message) => {
        if (!value)
            failures.push({
                tag, message
            });
    };
    const settle = async () => {
        await page.locator('.rhine-theme').waitFor({
            state: 'attached'
        });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForFunction(() => document.querySelector('.rhine-theme')?.getAnimations({
            subtree: true
        }).every(a => a.playState !== 'running' || a.effect.getTiming().iterations === Infinity), undefined, {
            timeout: 5000
        });
    };
    const goto = async (section, theme = 'rhine', width = 880, zoom = 1, motion = 'normal') => {
        await page.setViewportSize({
            width, height: 900
        });
        await page.emulateMedia({
            reducedMotion: motion === 'system' ? 'reduce' : 'no-preference'
        });
        await page.goto(base + '?theme=' + theme + '&run=' + (++navigation) + '#' + section);
        await page.locator('.rhine-theme').waitFor({
            state: 'attached'
        });
        if (await page.evaluate(() => location.origin + location.pathname) !== base)
            throw new Error('Wrong fixture origin/path');
        await page.evaluate(({ zoom, motion }) => {
            document.documentElement.style.zoom = String(zoom);
            document.querySelector('.rhine-theme').dataset.rhineMotion = motion === 'manual' ? 'reduced' : 'system';
        }, {
            zoom, motion
        });
        await settle();
    };
    const matrix = quick ? ['rhine', 'arknights', 'neo-brutalism'].map(theme => ({
        theme, width: 520, zoom: 2
    })) : ['rhine', 'arknights', 'neo-brutalism', 'neutral', 'graphite'].flatMap(theme => [400, 520, 880].flatMap(width => [1, 2].map(zoom => ({
        theme, width, zoom
    }))));
    for (const scope of matrix)
        for (const section of ['tooltip', 'modal', 'slider', 'remote-lifecycle', 'table', 'tree-select']) {
            const tag = [section, scope.theme, scope.width, scope.zoom].join('/');
            try {
                await goto(section, scope.theme, scope.width, scope.zoom);
                if (section === 'tooltip')
                    await page.getByRole('button', {
                        name: '采样构成帮助', exact: true
                    }).focus();
                if (section === 'modal')
                    await page.getByRole('button', {
                        name: '打开受控详情', exact: true
                    }).click();
                if (section === 'remote-lifecycle')
                    await page.locator('#permission-field').click();
                if (section === 'tree-select')
                    await page.locator('#department-field').click();
                if (section === 'table')
                    await page.getByRole('button', {
                        name: '关于命中率', exact: true
                    }).focus();
                if (section === 'tooltip' || section === 'table')
                    await page.locator('.rhine-tooltip').waitFor({
                        state: 'visible'
                    });
                await settle();
                const measured = await page.evaluate(({ zoom, section }) => {
                    const main = document.querySelector('main'), root = document.querySelector('.rhine-theme');
                    const visible = n => n.getClientRects().length && !n.closest('[inert]') && (n.matches('.rhine-tooltip') || !n.closest('[aria-hidden=true]'));
                    const small = [...root.querySelectorAll('main button,main a.rhine-button,.rhine-dialog button,.rhine-popover button,.rhine-combobox__list button')].filter(visible).filter(n => n.getBoundingClientRect().height / zoom < 43.5).map(n => ({
                        text: n.getAttribute('aria-label') || n.textContent, height: n.getBoundingClientRect().height / zoom
                    }));
                    const panels = [...root.querySelectorAll('.rhine-dialog,.rhine-popover,.rhine-combobox__list,.rhine-tooltip')].filter(visible).map(n => ({
                        class: n.className, rect: n.getBoundingClientRect().toJSON(), client: n.clientWidth, scroll: n.scrollWidth
                    }));
                    const descriptions = [...root.querySelectorAll('[aria-describedby]')].filter(visible).map(n => ({
                        name: n.getAttribute('aria-label') || n.id, ids: n.getAttribute('aria-describedby').split(/ +/).filter(id => !document.getElementById(id))
                    })).filter(x => x.ids.length);
                    return {
                        theme: root.dataset.rhineTheme, mainOverflow: main.scrollWidth > main.clientWidth + 2, rootOverflow: document.documentElement.scrollWidth > innerWidth + 2, small, panels, missingDescriptions: descriptions, marks:[...main.querySelectorAll('.rhine-slider__marks')].map(list=>{const r=list.getBoundingClientRect();return{rect:r.toJSON(),items:[...list.children].map(item=>({text:item.textContent,rect:item.getBoundingClientRect().toJSON()}))};}),rangeHeights: [...main.querySelectorAll('.rhine-range-slider input')].map(n => n.getBoundingClientRect().height / zoom), treeStops: root.querySelectorAll('[role=treeitem][tabindex="0"]').length, table: main.querySelectorAll('table').length, selectedMatch: main.querySelector('tr[data-tone=match]')?.getAttribute('data-selected'), tooltipText: root.querySelector('.rhine-tooltip__details')?.textContent, section
                    };
                }, {
                    zoom: scope.zoom, section
                });
                check(!measured.mainOverflow && !measured.rootOverflow, tag, 'no page/main horizontal overflow');
                check(measured.small.length === 0, tag, '44px actions: ' + JSON.stringify(measured.small));
                check(measured.missingDescriptions.length === 0, tag, 'all describedby targets exist: ' + JSON.stringify(measured.missingDescriptions));
                for (const panel of measured.panels) {
                    const r = panel.rect;
                    check(r.left >= 8 && r.top >= 8 && r.right <= scope.width - 8 && r.bottom <= 900 - 8, tag, 'panel within viewport: ' + JSON.stringify(panel));
                    check(panel.scroll <= panel.client + 2, tag, 'panel does not horizontally clip content: ' + JSON.stringify(panel));
                }
                if (section === 'tooltip') {
                    check(measured.tooltipText?.includes('12次 / 40%') && measured.tooltipText?.includes('部分样本缺失'), tag, 'structured facts preserved');
                    if (scope.width === 880 && scope.zoom === 1)
                        check(Math.abs(measured.panels[0]?.rect.width - 420) < 2, tag, 'public 420px width reaches actual renderer');
                }
                if(section==='slider')check(measured.marks.every(mark=>mark.items.every(item=>item.rect.left>=mark.rect.left-1&&item.rect.right<=mark.rect.right+1&&item.rect.bottom<=mark.rect.bottom+1)),tag,'human marks stay aligned and their whole height is reserved');
                if (section === 'slider')
                    check(measured.rangeHeights.length === 2 && measured.rangeHeights.every(h => h >= 43.5), tag, 'paired native 44px targets');
                if (section === 'tree-select')
                    check(measured.treeStops === 1, tag, 'one visible tree Tab stop');
                if (section === 'table')
                    check(measured.table === 1 && measured.selectedMatch !== 'true', tag, 'native table and matched row independent of selection');
                samples.push({
                    tag, measured
                });
            }
            catch (error) {
                failures.push({
                    tag, message: String(error)
                });
            }
        }
    const flow = async (tag, run) => {
        try {
            await run();
            samples.push({
                tag, pass: true
            });
        }
        catch (error) {
            failures.push({
                tag, message: String(error)
            });
        }
    };
    await flow('tooltip-hover-focus-escape-interactive-boundary', async () => {
        await goto('tooltip');
        const trigger = page.getByRole('button', {
            name: '采样构成帮助', exact: true
        });
        await trigger.hover();
        await page.locator('.rhine-tooltip').waitFor({
            state: 'visible'
        });
        check((await page.locator('.rhine-tooltip').textContent()).includes('合成采样构成'), 'tooltip', 'hover shows real rows');
        await page.keyboard.press('Escape');
        await page.locator('.rhine-tooltip').waitFor({
            state: 'hidden'
        });
        await page.getByLabel('提示数据状态').selectOption('unknown');
        await trigger.focus();
        await page.locator('.rhine-tooltip').waitFor({
            state: 'visible'
        });
        check((await page.locator('.rhine-tooltip').textContent()).includes('未知'), 'tooltip', 'focused unknown state remains explicit');
        await page.keyboard.press('Escape');
        await page.getByRole('button', {
            name: '打开明细', exact: true
        }).click();
        await page.getByRole('textbox', {
            name: '明细草稿', exact: true
        }).fill('独立交互仍属于Popover');
        await page.keyboard.press('Escape');
    });
    await flow('tooltip-touch-boundary', async () => {
        const context = await page.context().browser().newContext({
            hasTouch: true, viewport: {
                width: 520, height: 900
            }
        });
        try {
            const touch = await context.newPage();
            await touch.goto(base + '#tooltip');
            await touch.locator('main').waitFor();
            await touch.locator('main').ariaSnapshot();
            await touch.getByRole('button', {
                name: '采样构成帮助', exact: true
            }).tap();
            check(await touch.locator('.rhine-tooltip').count() === 0, 'tooltip-touch', 'tap does not invent hover-only data availability');
            check((await touch.locator('main').textContent()).includes('12次 / 40%'), 'tooltip-touch', 'same essential facts stay visible');
        }
        finally {
            await context.close();
        }
    });
    await flow('dialog-busy-failure-return-and-missing-caller', async () => {
        await goto('modal');
        await page.getByRole('button', {
            name: '打开受控详情', exact: true
        }).click();
        let dialog = page.getByRole('dialog', {
            name: '受控详情', exact: true
        });
        await dialog.getByLabel('详情草稿').fill('保留这份草稿');
        await dialog.getByRole('button', {
            name: '保存草稿', exact: true
        }).click();
        check(await dialog.getByRole('button', {
            name: '关闭对话框', exact: true
        }).isDisabled(), 'dialog', 'close button gated');
        check(await dialog.getByRole('button', {
            name: '返回列表', exact: true
        }).isDisabled(), 'dialog', 'host navigation shares gate');
        await page.keyboard.press('Escape');
        await page.mouse.click(5, 5);
        check(await dialog.isVisible(), 'dialog', 'Escape and pointer outside cannot dismiss busy dialog');
        await dialog.getByText('合成保存失败，保留草稿', {
            exact: true
        }).waitFor();
        check(await dialog.getByLabel('详情草稿').inputValue() === '保留这份草稿', 'dialog', 'failure retains draft');
        await dialog.getByRole('button', {
            name: '关闭对话框', exact: true
        }).click();
        await page.waitForFunction(() => document.activeElement?.id === 'dialog-caller');
        await page.getByRole('button', {
            name: '打开受控详情', exact: true
        }).click();
        await dialog.getByRole('button', {
            name: '移除打开者', exact: true
        }).click();
        await dialog.getByRole('button', {
            name: '关闭对话框', exact: true
        }).click();
        await page.waitForFunction(() => document.activeElement?.id === 'dialog-context');
    });
    await flow('confirm-explicit-unknown-then-success', async () => {
        await goto('modal');
        await page.getByLabel('保存结果').selectOption('unknown');
        await page.getByRole('button', {
            name: '打开显式确认', exact: true
        }).click();
        const dialog = page.getByRole('alertdialog', {
            name: '显式结果确认', exact: true
        });
        await dialog.getByRole('button', {
            name: '确认操作', exact: true
        }).click();
        check(await dialog.getByRole('button', {
            name: '取消', exact: true
        }).isDisabled(), 'confirm', 'in-flight gate');
        await dialog.getByText('结果未知，尚未关闭。', {
            exact: true
        }).waitFor();
        check(await dialog.isVisible(), 'confirm', 'unknown is not success');
        await dialog.getByRole('button', {
            name: '取消', exact: true
        }).click();
        await page.getByLabel('保存结果').selectOption('success');
        await page.getByRole('button', {
            name: '打开显式确认', exact: true
        }).click();
        await dialog.getByRole('button', {
            name: '确认操作', exact: true
        }).click();
        await dialog.waitFor({
            state: 'hidden'
        });
    });
    await flow('range-real-pointer-keyboard-reject-invalid-and-dynamic', async () => {
        await goto('slider');
        const track = page.locator('.rhine-range-slider__track');
        await track.scrollIntoViewIfNeeded();
        const box = await track.boundingBox();
        const x = v => box.x + 22 + (box.width - 44) * v / 100, y = box.y + 22;
        await page.mouse.move(x(20), y);
        await page.mouse.down();
        await page.mouse.move(x(35), y, {
            steps: 8
        });
        await page.mouse.up();
        check(await page.getByRole('spinbutton', {
            name: '触发数值', exact: true
        }).inputValue() === '35', 'range', 'real low thumb drag');
        await page.mouse.move(x(80), y);
        await page.mouse.down();
        await page.mouse.move(x(70), y, {
            steps: 8
        });
        await page.mouse.up();
        check(await page.getByRole('spinbutton', {
            name: '恢复数值', exact: true
        }).inputValue() === '70', 'range', 'real high thumb drag');
        const low = page.getByRole('slider', {
            name: '触发阈值', exact: true
        });
        await low.focus();
        await page.keyboard.press('End');
        check(await low.inputValue() === '69', 'range', 'collision clamps user proposal without moving other end');
        await page.getByRole('button', {
            name: '恢复有效阈值', exact: true
        }).click();
        await page.getByLabel('滑块状态').selectOption('reject');
        await low.focus();
        await page.keyboard.press('ArrowRight');
        check(await low.inputValue() === '20', 'range', 'controlled rejection stays at accepted value');
        await page.getByLabel('滑块状态').selectOption('readonly');
        await low.focus();
        await page.keyboard.press('End');
        check(await low.inputValue() === '20', 'range', 'readOnly blocks keyboard');
        await page.getByRole('button',{name:'恢复有效阈值',exact:true}).click();
        await page.getByLabel('滑块状态').selectOption('fieldset');
        check(await low.isDisabled(), 'range', 'native parent fieldset disables the thumb');
        await track.scrollIntoViewIfNeeded();
        const disabledBox = await track.boundingBox();
        await page.mouse.click(disabledBox.x + disabledBox.width / 2, disabledBox.y + disabledBox.height / 2);
        check(await low.inputValue() === '20' && await page.getByRole('slider', {name:'恢复阈值',exact:true}).inputValue() === '80', 'range', 'disabled inherited track cannot propose a change');
        await page.getByLabel('滑块状态').selectOption('normal');
        await page.getByRole('button', {
            name: '注入非法阈值', exact: true
        }).click();
        check(await low.isDisabled(), 'range', 'invalid external pair is explicit and unavailable');
        await page.getByLabel('扫描动态上限').selectOption('240');
        check(await page.getByRole('slider', {
            name: '扫描周期', exact: true
        }).isDisabled(), 'range', 'smaller external bound does not normalize current600');
        await page.getByLabel('扫描动态上限').selectOption('720');
        check(await page.getByRole('slider', {
            name: '扫描周期', exact: true
        }).inputValue() === '600', 'range', 'valid larger current value restored without 240 cap');
    });
    await flow('remote-multiple-edits-failure-success-cancel-and-refusal', async () => {
        await goto('remote-lifecycle');
        const input = page.locator('#permission-field');
        await input.click();
        await page.getByRole('option', {
            name: '合成成员 2', exact: true
        }).click();
        await page.getByRole('option', {
            name: '合成成员 3', exact: true
        }).click();
        check((await page.locator('main').textContent()).includes('提交次数：0'), 'remote', 'draft edits do not publish');
        await page.getByRole('button', {
            name: '完成选择', exact: true
        }).click();
        await page.getByRole('status').filter({
            hasText: '保存失败，已回退确认值'
        }).waitFor();
        check((await page.locator('main').textContent()).includes('提交次数：1'), 'remote', 'accepted close publishes once');
        check(await page.getByRole('listbox').count() === 0, 'remote', 'completion stays closed');
        await page.getByLabel('提交结果').selectOption('success');
        await input.click();
        await page.getByRole('option', {
            name: '合成成员 2', exact: true
        }).click();
        await page.getByRole('option', {
            name: '合成成员 3', exact: true
        }).click();
        check(await page.getByRole('option', {
            name: '合成成员 4', exact: true
        }).getAttribute('aria-disabled') === 'true', 'remote', 'cap still permits selected deselection');
        await page.getByRole('button', {
            name: '完成选择', exact: true
        }).click();
        await page.getByRole('status').filter({
            hasText: '合成保存已确认'
        }).waitFor();
        await input.click();
        await page.getByRole('option', {
            name: '合成成员 0', exact: true
        }).click();
        await page.keyboard.press('Escape');
        check((await page.locator('main').textContent()).includes('提交次数：2'), 'remote', 'Escape cancels without publish');
        check(await page.getByRole('listbox').count() === 0, 'remote', 'Escape does not reopen through stale focus');
        await page.getByLabel('选择状态').selectOption('reject');
        await input.click();
        await page.getByRole('button', {
            name: '完成选择', exact: true
        }).click();
        check(await page.getByRole('listbox').isVisible(), 'remote', 'controlled refusal stays open');
        check((await page.locator('main').textContent()).includes('提交次数：2'), 'remote', 'rejected close never publishes');
        await page.getByLabel('选择状态').selectOption('normal');
        await page.getByRole('button', {
            name: '取消选择', exact: true
        }).click();
    });
    await flow('remote-tab-outside-and-obsolete-save', async () => {
        await goto('remote-lifecycle');
        const input = page.locator('#permission-field');
        await page.locator('#external-field-label').click();
        await page.getByRole('option',{name:'合成成员 2',exact:true}).click();
        await page.keyboard.press('Tab');
        check(await page.evaluate(()=>document.activeElement?.id==='permission-field-complete'),'remote-tab','first Tab reaches completion');
        await page.keyboard.press('Tab');
        await page.getByRole('status').filter({
            hasText: '保存失败，已回退确认值'
        }).waitFor();
        check((await page.locator('main').textContent()).includes('提交次数：1'), 'remote-tab', 'one Tab close');
        await page.getByLabel('提交结果').selectOption('success');
        await input.click();
        await page.getByRole('option', {
            name: '合成成员 2', exact: true
        }).click();
        await page.mouse.click(5,5);
        check((await page.locator('main').textContent()).includes('等待宿主保存（outside）'), 'remote-outside', 'pointer outside distinguished');
        await page.getByRole('button', {
            name: '重开并使旧结果失效', exact: true
        }).click();
        await page.getByRole('button', {name:'同步外部值',exact:true}).focus();
        await page.keyboard.press('Enter');
        await page.getByRole('status').filter({
            hasText: '已同步外部确认值'
        }).waitFor();
        await page.getByRole('status').filter({hasText:/已忽略：[1-9]/}).waitFor();
        check((await page.locator('main').textContent()).includes('确认值：person-3'), 'remote', 'external sync survives the actual obsolete result arrival');
    });
    await flow('tree-path-unknown-search-and-one-close', async () => {
        await goto('tree-select');
        check(await page.evaluate(()=>document.getElementById('external-field-label')?.control?.id==='department-field'),'tree','external label links actual persistent button');
        await page.getByRole('button', {
            name: '展开已选项', exact: true
        }).click();
        check(await page.getByText('未提供的节点 [missing]', {
            exact: true
        }).isVisible(), 'tree', 'missing selected node remains explicit');
        await page.locator('#department-field').click();
        await page.getByRole('textbox', {
            name: '部门范围搜索', exact: true
        }).fill('西区 / 研发');
        check(await page.getByRole('treeitem', {
            name: '合成组织', exact: true
        }).isVisible(), 'tree', 'matching ancestor retained');
        check(await page.getByRole('treeitem', {
            name: '东区', exact: true
        }).count() === 0, 'tree', 'unmatched branch hidden without changing selected ids');
        const leaf = page.getByRole('treeitem', {
            name: '研发', exact: true
        });
        await leaf.focus();
        await page.keyboard.press('Space');
        check((await page.locator('main').textContent()).includes('提交次数：0'), 'tree', 'hierarchical edit remains draft');
        await page.getByRole('button', {
            name: '完成选择', exact: true
        }).click();
        await page.getByRole('status').filter({
            hasText: '保存失败，草稿保留'
        }).waitFor();
        check((await page.locator('main').textContent()).includes('提交次数：1'), 'tree', 'hierarchical close publishes once');
        check(await page.getByRole('dialog', {
            name: '部门范围', exact: true
        }).count() === 0, 'tree', 'completion stays closed');
        await page.getByLabel('选择状态').selectOption('readonly');
        await page.locator('#department-field').click();
        await leaf.focus();
        await page.keyboard.press('Space');
        check((await page.locator('main').textContent()).includes('提交次数：1'), 'tree', 'readOnly browsing does not alter host publication');
        await page.keyboard.press('Escape');
    });
    for (const section of ['remote-lifecycle','tree-select']) await flow(section+'-refusal-then-programmatic', async () => {
        await goto(section);
        await page.getByLabel('选择状态').selectOption('reject');
        const entry = page.locator(section==='tree-select'?'#department-field':'#permission-field');
        await entry.click();
        await page.getByRole('button',{name:'完成选择',exact:true}).click();
        check(await page.getByRole(section==='tree-select'?'dialog':'listbox').isVisible(), section, 'refused completion remains visibly open');
        await page.getByRole('button',{name:'同步外部值',exact:true}).focus();
        await page.keyboard.press('Enter');
        check((await page.locator('main').textContent()).includes('已同步外部确认值') && (await page.locator('main').textContent()).includes('提交次数：0'),section,'independent programmatic close does not consume the rejected completion');
    });
    await flow('table-actions-structure-refresh-and-return', async () => {
        await goto('table');
        const table = page.getByRole('table', {
            name: '合成请求记录', exact: true
        });
        await table.getByRole('button', {
            name: '复制合成失败请求', exact: true
        }).click();
        check(await page.getByRole('dialog', {
            name: '行错误证据', exact: true
        }).count() === 0, 'table', 'cell action does not activate row');
        await table.getByRole('checkbox', {
            name: '选择合成失败请求', exact: true
        }).check();
        check(await page.getByRole('dialog', {
            name: '行错误证据', exact: true
        }).count() === 0, 'table', 'selection independent');
        await table.getByRole('button', {
            name: '展开合成失败请求', exact: true
        }).click();
        await page.getByRole('button', {
            name: '刷新行版本', exact: true
        }).click();
        const action = table.getByRole('button', {
            name: '查看合成失败请求', exact: true
        });
        await action.focus();
        await page.keyboard.press('Enter');
        const dialog = page.getByRole('dialog', {
            name: '行错误证据', exact: true
        });
        check((await dialog.textContent()).includes('激活revision：2'), 'table', 'latest row object activated by stable id');
        await dialog.getByRole('button', {
            name: '关闭对话框', exact: true
        }).click();
        await page.waitForFunction(() => document.activeElement?.id === 'request-action-failed');
        await action.click();
        await dialog.getByRole('button', {
            name: '移除原行', exact: true
        }).click();
        await dialog.getByRole('button', {
            name: '关闭对话框', exact: true
        }).click();
        await page.waitForFunction(() => document.activeElement?.id === 'table-context');
        check(await table.getByRole('button', {
            name: '查看不可激活记录', exact: true
        }).isDisabled(), 'table', 'per-row disabled action');
    });
    for (const motion of ['system', 'manual'])
        await flow('reduced-' + motion, async () => {
            await goto('modal', 'rhine', 520, 2, motion);
            await page.getByRole('button', {
                name: '打开受控详情', exact: true
            }).click();
            await page.keyboard.press('Escape');
            await goto('tree-select', 'rhine', 520, 2, motion);
            await page.locator('#department-field').click();
            await page.keyboard.press('Escape');
            await goto('slider', 'rhine', 520, 2, motion);
            await page.getByRole('slider', {
                name: '触发阈值', exact: true
            }).focus();
            await page.keyboard.press('ArrowRight');
        });
    return {
        pass: failures.length === 0, base, samples, failures, userAgent: await page.evaluate(() => navigator.userAgent), limits: ['synthetic host operations only', 'CSS zoom, no browser-native zoom claim', 'touch emulation, no physical-device claim', 'WebKit is not complete native Safari; spoken AT/IME not proven by browser automation']
    };
};
