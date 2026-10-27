import { defineReview } from '@linhey/rhine-design/review';
export default defineReview({
  title: '项目工作台 · HTTP 示例',
  scenes: [{
    id: 'projects', title: '项目与编辑流程', group: '工作台', themeRoot: 'host',
    source: 'examples/review/http/App.tsx', issue: 'https://github.com/linhay/rhine-design/issues/40',
    description: '真实表单、弹窗与路由；HTTP 适配使用内存数据。主题与宽度切换保留草稿，状态或角色切换重新初始化。',
    dimensions: [
      { id: 'status', label: '列表状态', options: ['normal', 'loading', 'empty', 'error', 'dense'].map(id => ({ id, label: ({ normal: '正常', loading: '加载', empty: '空', error: '错误', dense: '密集长文' })[id]! })) },
      { id: 'role', label: '角色', options: [{ id: 'editor', label: '编辑者' }, { id: 'reader', label: '只读成员' }] },
    ],
    async setup(context) {
      const items = context.dimensions.status === 'empty' ? [] : Array.from({ length: context.dimensions.status === 'dense' ? 25 : 3 }, (_, index) => ({ id: index + 1, name: context.dimensions.status === 'dense' ? `合成项目 ${index + 1} · 跨团队设计评审与持续验证的长标题示例` : `合成项目 ${index + 1}` }));
      context.mockHttp(async request => {
        const url = new URL(request.url);
        if (url.pathname !== '/api/projects') return;
        if (request.method === 'GET') {
          if (context.dimensions.status === 'loading') return new Promise<Response>((_resolve, reject) => request.signal.addEventListener('abort', () => reject(request.signal.reason), { once: true }));
          if (context.dimensions.status === 'error') return Response.json({ message: '合成服务暂不可用' }, { status: 503 });
          return Response.json(items.filter(item => item.name.includes(url.searchParams.get('q') ?? '')));
        }
        if (request.method === 'POST') {
          if (context.dimensions.role !== 'editor') return Response.json({ message: '只读角色' }, { status: 403 });
          const body = await request.json() as { name: string };
          items.push({ id: items.length + 1, name: body.name });
          context.report('模拟项目已保存');
          return Response.json(items);
        }
      });
      // The adapter is installed before any product module is evaluated.
      const { App } = await import('./App');
      context.signal.throwIfAborted();
      const oldUrl = location.href;
      history.replaceState(null, '', `${import.meta.env.BASE_URL}projects`);
      window.dispatchEvent(new PopStateEvent('popstate'));
      context.onDispose(() => { history.replaceState(null, '', oldUrl); });
      return {
        render: environment => <App environment={environment} signal={context.signal} role={context.dimensions.role} report={context.report} />,
        reset: () => context.report('模拟数据已恢复初始值'),
        dispose() { items.length = 0; },
      };
    },
  }],
});
