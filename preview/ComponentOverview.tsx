import { antdCategoryOrder, antdComponents, type AntdComponentEntry, type Coverage } from './antd-overview';

const coverageLabel: Record<Coverage, string> = { present: '已有', partial: '部分覆盖', absent: '未提供' };

export function ComponentOverview() {
  return <div className="ds-taxonomy">
    <p className="ds-caption">侧栏顺序和名称对标 Ant Design 组件总览。已有和部分覆盖打开现有展台；未提供只打开说明，没有可导入的空组件。</p>
    {antdCategoryOrder.map(category => {
      const items = antdComponents.filter(item => item.category === category);
      return <section key={category} aria-labelledby={`antd-${category}`}>
        <h2 id={`antd-${category}`}>{category}<span>{items.length}</span></h2>
        <ul>
          {items.map(item => <li key={item.id}><a href={`#${item.id}`}><strong>{item.en} {item.zh}</strong><small>{coverageLabel[item.coverage]}。{item.note}</small></a></li>)}
        </ul>
      </section>;
    })}
    <p className="ds-caption">原有章节列在对应分类后面。「其他」只留主题配置，因为官方的全局化配置也在这里。</p>
  </div>;
}

export function GapPanel({ entry }: { entry: AntdComponentEntry }) {
  return <section aria-labelledby={`gap-${entry.id}`}>
    <div className="ds-section-title"><span>{entry.category}</span><h2 id={`gap-${entry.id}`}>{entry.en} {entry.zh}</h2></div>
    <p>未提供。{entry.note}</p>
    <p className="ds-caption">这一项只说明缺口。它不是公共导出，也不能当作已经实现的组件。</p>
  </section>;
}
