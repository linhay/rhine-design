# 平台标记（0.15.0；#220）

PlatformMark是独立的资源原语，不复用Rhine Logo或一般动作Icon；platform为macos/windows，size为16/20，默认decorative=true。旁边持续显示完整“macOS／Windows”文字；独立读取时设decorative=false，可用非空label覆盖默认的“macOS 平台／Windows 平台”。它不推断操作系统，不下载或安装任何内容。

采用[Bootstrap Icons固定修订](https://github.com/twbs/icons/tree/829d2bc2b87543c7d781c815ca4f0feee8cf9e45)的[Apple几何](https://github.com/twbs/icons/blob/829d2bc2b87543c7d781c815ca4f0feee8cf9e45/icons/apple.svg)与[Windows几何](https://github.com/twbs/icons/blob/829d2bc2b87543c7d781c815ca4f0feee8cf9e45/icons/windows.svg)。来源是Bootstrap绘制资源，不宣称Apple/Microsoft官方资产。版权为2019–2024 The Bootstrap Authors，[MIT原许可](https://github.com/twbs/icons/blob/829d2bc2b87543c7d781c815ca4f0feee8cf9e45/LICENSE)与版权全文保留在[随包许可](../components/assets/bootstrap-icons-LICENSE.txt)，NOTICE同步署名。Apple源文件的完全相同重复path去重，几何未改；没有新增图标库依赖。

版权许可不授予商标权或产品背书，实际分发还须尊重对应品牌条件；本组件只作平台指示，不给产品换品牌或声称已获商标授权。SVG几何内联且fill=currentColor，主题继承文字颜色，不使用CSS字符、emoji、远程脚本、外部SVG use或运行时资源请求。因此组件自身的资源加载失败为N/A，不虚构失败后重试；使用外部图片的消费场景另用既有Image明确失败后备。运行时未支持的平台显示“未支持的平台”，不显示错误平台品牌。

下载动作组合已有ButtonLink，持续显示完整平台文字。disabled/busy不保留可导航href；不把标记或链接可见写成下载、系统兼容或安装成功。#icon的独立平台章节展示普通/禁用/busy、16/20及未支持输入；所有链接为本地演示，不提供真实安装包。

这是封装已许可资源、主题继承和明确未知后备的单一原语，不是新增业务组合/调度器。源码与固定候选不等于正式npm发行，registry0.14.0不含此入口，不自动删除或升级真实消费者的依赖。
