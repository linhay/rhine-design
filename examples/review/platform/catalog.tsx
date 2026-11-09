import { defineReview, type ReviewScene } from '@linhey/rhine-design/review';
const workspace: ReviewScene = {
  id: 'workspace', title: '桌面工作区', group: '平台接口',
  motionControls: ['full', 'paused'],
  source: 'examples/review/platform/Workspace.tsx',
  description: '仅注入内存平台 client，不调用原生配置、下载或业务剪贴板。Canvas 通过显式环境属性暂停、减少动态和恢复。',
  dimensions: [
    { id: 'connection', label: '连接阶段', options: [{ id: 'ready', label: '已连接' }, { id: 'waiting', label: '等待连接' }, { id: 'error', label: '连接失败' }] },
    { id: 'quota', label: '用量状态', options: [{ id: 'normal', label: '正常用量' }, { id: 'empty', label: '暂无用量' }] },
  ],
  async setup(context) {
    const { Workspace } = await import('./Workspace');
    context.signal.throwIfAborted();
    let current = '合成工作区';
    const client = {
      read: () => current,
      save: async (value: string) => { context.signal.throwIfAborted(); current = value; context.report('已更新内存工作区名称'); },
    };
    return {
      render: environment => <Workspace client={client} environment={environment} dimensions={context.dimensions} />,
      dispose() { current = ''; },
    };
  },
};
export default defineReview({
  title: '桌面工作区 · 平台示例', scenes: [workspace, {
    id: 'slow', title: '慢速初始化', group: '生命周期', description: '等待期间可以切回工作区；定时器与迟到结果必须清理。',
    async setup(context) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, 4000);
        context.onDispose(() => { clearTimeout(timer); reject(new DOMException('Disposed', 'AbortError')); });
      });
      context.signal.throwIfAborted();
      return { render: () => <p>慢速初始化完成</p>, dispose() {} };
    },
  }, {
    id: 'stuck-cleanup', title: '清理挂起恢复', group: '故障恢复', description: '离开此场景会遇到永不结束的合成清理；10 秒后可在外层重新载入画布恢复。',
    setup: () => ({ render: () => <p>此场景模拟清理挂起，请切换到桌面工作区验证恢复。</p>, dispose: () => new Promise<void>(() => {}) }),
  }, {
    id: 'cleanup-error', title: '清理错误留存', group: '故障恢复',
    setup: () => ({ render: () => <p>离开此场景后，合成清理错误应保留到显式确认。</p>, dispose() { throw new Error('合成清理失败'); } }),
  }, {
    id: 'long-feedback', title: '长反馈与辅助工具', group: '故障恢复',
    description: '头部评审工具承载完整反馈与尺寸。关闭侧栏后继续评审画布；记录只在确认清除后移除。',
    setup(context) {
      context.report(`合成长反馈：${'请核对场景条件与资源状态；详细记录应在侧栏换行并完整可读。'.repeat(30)} trace=${'synthetic'.repeat(40)}`);
      return { render: () => <p>从头部打开评审工具，检查长反馈、确认清除和逐层 Escape 归焦。</p>, dispose() {} };
    },
  }, {
    id: 'failure', title: '渲染错误边界', group: '生命周期',
    setup: () => ({ render() { throw new Error('合成渲染失败'); }, dispose() {} }),
  }],
});
