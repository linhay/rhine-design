const $ = id => document.getElementById(id);
const labels = { success: '成功', update: '更新', error: '失败', info: '状态' };
const PAGE_SIZE = 30, MAX_LOGS = 500;
let enabled = false, signedIn = true, permitted = true, timer;
let loginPending = false;
let records = [], snapshot = [], page = 0, filter = 'all', pending = 0;
const appWindow = document.querySelector('.window');
const iconChoice = new URLSearchParams(location.search).get('icon');
if (/^[a-i]$/.test(iconChoice || '')) {
  const path = 'assets/option-' + iconChoice + '.svg?v=arcane-seal-1';
  document.querySelector('.login-icon').src = path;
  document.querySelector('.tray-icon img').src = /^[g-i]$/.test(iconChoice) ? 'assets/tray-' + iconChoice + '.svg?v=arcane-seal-1' : path;
  document.querySelector('link[rel="icon"]').href = path;
}
function menu(open) { $('tray-menu').hidden = !open; $('tray-icon').setAttribute('aria-expanded', String(open)); }
function residentText() {
  const windows = document.body.classList.contains('windows');
  $('resident-title').textContent = windows ? '已收起到系统托盘' : '已收起到状态栏';
  $('resident-description').textContent = (enabled ? '自动更新继续运行' : '应用仍在后台，自动更新未开启') + '，点击图标可重新打开。';
}
function state(on, text, error = false) {
  enabled = on && signedIn && permitted;
  $('toggle').setAttribute('aria-checked', String(enabled));
  $('toggle').disabled = !signedIn || !permitted;
  $('account').disabled = enabled || !permitted;
  $('status').textContent = text || (enabled ? '自动更新中' : '已暂停');
  $('status').className = 'badge' + (error ? ' error' : enabled ? ' running' : '');
  $('tray-status').textContent = 'ToD-AI · ' + (signedIn ? $('status').textContent : '未登录');
  $('help').textContent = enabled ? '暂停后可切换账号' : '仅显示你有订阅权限的账号';
  residentText();
}
function loginView(active) {
  signedIn = active;
  $('login-view').hidden = active; $('workspace').hidden = !active;
  $('profile').open = false; $('add-demo-log').disabled = !active || !permitted;
  if (!active) { clearTimeout(timer); state(false); }
}
function element(tag, className, text) {
  const node = document.createElement(tag); node.className = className; node.textContent = text; return node;
}
function formatted(date) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false }).format(date);
}
function matching() { return snapshot.filter(item => filter === 'all' || item.kind === filter); }
function renderLogs() {
  const list = matching(), pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  page = Math.min(page, pages - 1);
  const slice = list.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  $('logs').replaceChildren(); let day = '';
  for (const item of slice) {
    const date = formatted(item.at);
    if (date.slice(0, 10) !== day) { day = date.slice(0, 10); $('logs').append(element('div', 'log-day', day)); }
    const row = element('div', 'entry', '');
    const time = element('time', '', date.slice(11)); time.dateTime = item.at.toISOString();
    const message = element(item.detail ? 'details' : 'div', 'message', item.detail ? '' : item.message);
    if (item.detail) message.append(element('summary', '', item.message), element('span', 'detail', item.detail));
    row.append(time, element('span', 'kind ' + item.kind, labels[item.kind]), message); $('logs').append(row);
  }
  if (!slice.length) $('logs').append(element('p', 'empty-logs', filter === 'all' ? '开启自动更新后，运行记录会显示在这里。' : '没有此类日志'));
  $('error-count').textContent = snapshot.filter(item => item.kind === 'error').length;
  $('update-count').textContent = snapshot.filter(item => item.kind === 'update').length;
  $('log-count').textContent = list.length ? `${page * PAGE_SIZE + 1}–${page * PAGE_SIZE + slice.length} / ${list.length} 条` : '0 条记录';
  $('log-count').title = '仅保留本次会话最近 500 条日志';
  $('page-number').textContent = `${page + 1} / ${pages}`;
  $('prev-page').disabled = page === 0; $('next-page').disabled = page === pages - 1;
}
function freshLogs() {
  snapshot = records.slice(); pending = 0; $('new-logs').hidden = true; renderLogs();
}
function log(kind, message, detail = '', at = new Date()) {
  records.unshift({ kind, message, detail, at }); records = records.slice(0, MAX_LOGS);
  // Freeze the visible snapshot while reading history or expanded details.
  if (page > 0 || $('logs').scrollTop > 8 || $('logs').querySelector('details[open]') || $('logs').contains(document.activeElement) || pending) {
    pending++; $('new-logs').hidden = false; $('new-logs').textContent = `${pending} 条新日志 · 查看最新`;
  } else freshLogs();
  $('log-announcement').textContent = pending ? `${pending} 条新日志，当前阅读位置保持不变` : labels[kind] + '，' + message;
}
function resetLogs() {
  records = []; snapshot = []; pending = 0; page = 0; filter = 'all';
  document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === 'all')));
  $('logs').scrollTop = 0; $('last-update').textContent = '最近更新：—'; freshLogs();
}
$('new-logs').addEventListener('click', () => { page = 0; freshLogs(); $('logs').scrollTop = 0; $('logs').focus(); });
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter; page = 0;
  document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  freshLogs(); $('logs').scrollTop = 0;
}));
for (const [id, direction] of [['prev-page', -1], ['next-page', 1]]) $(id).addEventListener('click', () => {
  page += direction; renderLogs(); $('logs').scrollTop = 0;
});
$('toggle').addEventListener('click', () => {
  clearTimeout(timer);
  if (!signedIn || !permitted) return;
  if (enabled) { state(false); log('info', '自动更新已暂停', '本地文件保持不变。'); return; }
  state(true, '正在检查…'); log('info', '开始检查凭证');
  timer = setTimeout(() => {
    if (!enabled || !signedIn || !permitted) return;
    log('update', '本地凭证已更新', '文件校验通过，已替换 auth.json。');
    $('last-update').textContent = '最近更新：' + formatted(new Date()).slice(5); state(true);
  }, 800);
});
$('account').addEventListener('change', () => { clearTimeout(timer); resetLogs(); state(false); log('info', '同步账号已切换', '开启自动更新后使用所选账号；当前文件保持不变。'); });
function pendingLogin(on, note = '设计预览 · 不打开真实登录页') {
  loginPending = on; $('login-waiting').hidden = !on; $('login-submit').hidden = on;
  $('login-complete').disabled = !on; $('login-expire').disabled = !on; $('login-note').textContent = note;
}
$('login-submit').addEventListener('click', () => pendingLogin(true, '设计预览 · 可在下方工具中模拟授权回调'));
$('login-reopen').addEventListener('click', () => { $('login-note').textContent = '已模拟重新打开同一次授权，请在浏览器完成登录。'; });
$('login-cancel').addEventListener('click', () => { pendingLogin(false, '已取消授权，可重新发起登录。'); $('login-submit').focus(); });
$('login-expire').addEventListener('click', () => pendingLogin(false, '授权已超时，请重新在浏览器中登录。'));
$('login-complete').addEventListener('click', () => {
  if (!loginPending) return;
  pendingLogin(false); permitted = true; loginView(true); $('no-access').hidden = true;
  $('account').hidden = false; resetLogs(); state(false); $('account').focus();
});
$('logout').addEventListener('click', () => {
  clearTimeout(timer); resetLogs(); pendingLogin(false); loginView(false); $('login-submit').focus();
});
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => {
  appWindow.hidden = true; $('resident').hidden = false; residentText();
}));
$('tray-icon').addEventListener('click', () => menu($('tray-menu').hidden));
$('show-window').addEventListener('click', () => { appWindow.hidden = false; $('resident').hidden = true; menu(false); });
$('quit').addEventListener('click', () => {
  clearTimeout(timer); pendingLogin(false); state(false, '已退出'); menu(false); appWindow.hidden = true; $('resident').hidden = false; $('tray-icon').hidden = true;
  $('resident-title').textContent = '网关客户端已退出'; $('resident-description').textContent = '后台检查已停止，本地文件保持不变。';
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { menu(false); $('profile').open = false; } });
document.addEventListener('click', e => { if (!e.target.closest('.systembar')) menu(false); if (!e.target.closest('.profile')) $('profile').open = false; });
document.querySelectorAll('[data-platform]').forEach(button => button.addEventListener('click', () => {
  const windows = button.dataset.platform === 'windows'; document.body.classList.toggle('windows', windows);
  $('bar-label').textContent = windows ? 'Windows 系统托盘 · 驻留示意' : 'macOS 状态栏 · 驻留示意';
  $('tray-icon').setAttribute('aria-label', windows ? '网关客户端系统托盘菜单' : '网关客户端状态栏菜单');
  $('file-path').textContent = windows ? '%USERPROFILE%\\.codex\\auth.json' : '~/.codex/auth.json';
  if (!$('tray-icon').hidden) residentText(); menu(false);
  document.querySelectorAll('[data-platform]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
}));
function scene(name) {
  clearTimeout(timer); appWindow.hidden = false; $('resident').hidden = true; $('tray-icon').hidden = false; menu(false);
  resetLogs(); permitted = name !== 'no-access'; loginView(name !== 'login');
  $('account').value = 'dev'; $('account').hidden = !permitted; $('no-access').hidden = permitted;
  pendingLogin(false);
  state(signedIn && permitted, permitted ? undefined : '无可用账号');
  if (!signedIn || !permitted) return;
  const end = new Date('2026-10-16T09:35:00+08:00');
  const count = name === 'many' ? 240 : 4;
  for (let i = count - 1; i >= 0; i--) {
    const kind = i % 29 === 7 ? 'error' : i % 13 === 2 ? 'update' : 'success';
    records.unshift({ kind, message: kind === 'error' ? '连接超时，更新未完成' : kind === 'update' ? '本地凭证已更新' : '检查完成，凭证无变化', detail: kind === 'error' ? '网关连接超时。已保留原文件，将在下个周期重试。' : kind === 'update' ? '文件校验通过，已替换 auth.json。' : '', at: new Date(end.getTime() - i * 300000) });
  }
  freshLogs(); $('last-update').textContent = '最近更新：10-16 09:25';
  if (name === 'error') { log('error', '连接超时，更新未完成', '已保留原文件，将在下个周期重试。', end); state(true, '等待重试', true); }
}
document.querySelectorAll('[data-scene]').forEach(button => button.addEventListener('click', () => scene(button.dataset.scene)));
$('add-demo-log').addEventListener('click', () => { if (signedIn && permitted) log('success', '检查完成，凭证无变化'); });
scene(new URLSearchParams(location.search).get('scene') === 'login' ? 'login' : 'many');
